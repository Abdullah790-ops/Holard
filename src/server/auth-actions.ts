"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession, destroySession, getUser, HOME_BY_ROLE, normalisePhone, requireUser } from "./auth";
import { hashPassword, randomDigits, randomToken, sha256, verifyPassword } from "./crypto";
import { rateLimited } from "./ratelimit";
import { clientIp } from "./ip";
import { audit } from "./audit";

export type AuthState = { error?: string; info?: string; devCode?: string; devLink?: string; step?: "code" } | undefined;

const isDev = process.env.NODE_ENV !== "production";
const ip = async () => clientIp(await headers());

async function finishLogin(userId: string, method: string) {
  const db = await getDb();
  const [u] = await db.select({ role: schema.users.role, must: schema.users.mustChangePassword }).from(schema.users).where(eq(schema.users.id, userId));
  await createSession(userId, u.role);
  await audit(userId, "auth.login", "user", userId, { method });
  redirect(u.must ? "/account/password" : HOME_BY_ROLE[u.role]);
}

export async function loginWithPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  if (await rateLimited(`login:${await ip()}`, 20, 15 * 60_000) || await rateLimited(`login:${email}`, 8, 15 * 60_000)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`).limit(1);
  const ok = await verifyPassword(password, u?.passwordHash);
  if (!u || !ok || u.status !== "active") {
    await audit(u?.id ?? null, "auth.login_failed", "user", u?.id, { email });
    return { error: "Email or password is incorrect." };
  }
  await finishLogin(u.id, "password");
}

export async function requestOtp(_: AuthState, fd: FormData): Promise<AuthState> {
  const phone = normalisePhone(String(fd.get("phone") ?? ""));
  if (!phone) return { error: "Enter a valid phone number, e.g. +971 50 123 4567." };
  if (await rateLimited(`otp:${phone}`, 3, 10 * 60_000) || await rateLimited(`otp-ip:${await ip()}`, 10, 10 * 60_000)) {
    return { error: "Too many codes requested. Please wait 10 minutes." };
  }
  const db = await getDb();
  const [u] = await db.select({ id: schema.users.id, status: schema.users.status }).from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  const generic: AuthState = { step: "code", info: "If this number has a Holard account, a 6-digit code has been sent." };
  if (!u || u.status !== "active") return generic;
  const code = randomDigits(6);
  await db.insert(schema.otpCodes).values({ phone, codeHash: sha256(`${phone}:${code}`), expiresAt: new Date(Date.now() + 5 * 60_000) });
  // Phase 2E: send `code` via WhatsApp Business API / SMS. Until then it is shown on screen in development only.
  if (isDev) return { ...generic, devCode: code };
  return { error: "Phone login will be available once WhatsApp/SMS delivery is connected. Please use email for now." };
}

export async function verifyOtp(_: AuthState, fd: FormData): Promise<AuthState> {
  const phone = normalisePhone(String(fd.get("phone") ?? ""));
  const code = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (!phone || code.length !== 6) return { step: "code", error: "Enter the 6-digit code." };
  if (await rateLimited(`otp-verify:${phone}`, 10, 10 * 60_000)) return { step: "code", error: "Too many attempts. Request a new code later." };
  const db = await getDb();
  const [otp] = await db.select().from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.phone, phone), isNull(schema.otpCodes.usedAt), gt(schema.otpCodes.expiresAt, new Date())))
    .orderBy(desc(schema.otpCodes.createdAt)).limit(1);
  if (!otp || otp.attempts >= 5) return { step: "code", error: "Code expired. Request a new one." };
  if (otp.codeHash !== sha256(`${phone}:${code}`)) {
    await db.update(schema.otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(schema.otpCodes.id, otp.id));
    return { step: "code", error: "Incorrect code." };
  }
  await db.update(schema.otpCodes).set({ usedAt: new Date() }).where(eq(schema.otpCodes.id, otp.id));
  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.phone, phone), eq(schema.users.status, "active"))).limit(1);
  if (!u) return { error: "Account not found." };
  await finishLogin(u.id, "otp");
}

export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email." };
  if (await rateLimited(`reset:${await ip()}`, 5, 15 * 60_000)) return { error: "Too many requests. Please try later." };
  const res: AuthState = { info: "If an account exists for this email, a reset link has been sent. It expires in 30 minutes." };
  if (await rateLimited(`reset-email:${email}`, 3, 60 * 60_000)) return res; // stop inbox flooding; same reply so nothing leaks
  const db = await getDb();
  const [u] = await db.select({ id: schema.users.id, status: schema.users.status }).from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`).limit(1);
  if (!u || u.status !== "active") return res;
  const token = randomToken();
  await db.insert(schema.passwordResets).values({ id: sha256(token), userId: u.id, expiresAt: new Date(Date.now() + 30 * 60_000) });
  await audit(u.id, "auth.reset_requested", "user", u.id);
  // Phase 2E: email the link. Until then it is shown on screen in development only.
  return isDev ? { ...res, devLink: `/reset-password?token=${token}` } : res;
}

function weakPassword(pw: string) {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use letters and numbers.";
  return null;
}

export async function resetPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const token = String(fd.get("token") ?? "");
  const pw = String(fd.get("password") ?? "");
  if (pw !== String(fd.get("confirm") ?? "")) return { error: "Passwords do not match." };
  const weak = weakPassword(pw);
  if (weak) return { error: weak };
  const db = await getDb();
  const [r] = await db.select().from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.id, sha256(token)), isNull(schema.passwordResets.usedAt), gt(schema.passwordResets.expiresAt, new Date()))).limit(1);
  if (!r) return { error: "This link is invalid or expired. Request a new one." };
  await db.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.id, r.id));
  await db.update(schema.users).set({ passwordHash: await hashPassword(pw), mustChangePassword: false }).where(eq(schema.users.id, r.userId));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, r.userId)); // sign out everywhere
  await audit(r.userId, "auth.password_reset", "user", r.userId);
  return { info: "Password updated. You can now sign in." };
}

export async function changePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const user = await requireUser(undefined, { allowTempPassword: true });
  const pw = String(fd.get("password") ?? "");
  if (pw !== String(fd.get("confirm") ?? "")) return { error: "Passwords do not match." };
  const weak = weakPassword(pw);
  if (weak) return { error: weak };
  const db = await getDb();
  const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id));
  // Someone who borrows an unlocked phone/PC must not be able to take over the account: ask for the current password.
  if (!user.mustChangePassword) {
    if (await rateLimited(`pwchange:${user.id}`, 5, 15 * 60_000)) return { error: "Too many attempts. Please wait 15 minutes." };
    if (!(await verifyPassword(String(fd.get("current") ?? ""), row?.hash))) return { error: "Your current password is incorrect." };
  }
  if (row?.hash && (await verifyPassword(pw, row.hash))) return { error: "Choose a password different from the current one." };
  await db.update(schema.users).set({ passwordHash: await hashPassword(pw), mustChangePassword: false }).where(eq(schema.users.id, user.id));
  // Sign out every other device, then give this browser a fresh session.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  await createSession(user.id, user.role);
  await audit(user.id, "auth.password_changed", "user", user.id);
  redirect(HOME_BY_ROLE[user.role]);
}

export async function logout() {
  const u = await getUser();
  await destroySession();
  if (u) await audit(u.id, "auth.logout", "user", u.id);
  redirect("/login");
}
