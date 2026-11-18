import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Role } from "@/db/schema";
import { randomToken, sha256 } from "./crypto";
import { clientIp } from "./ip";

export const SESSION_COOKIE = "holard_session";
// Admin sessions are short (an admin can see every worker's documents and pay); others last a week.
const SESSION_HOURS: Record<Role, number> = { super_admin: 12, client_admin: 168, supervisor: 168, employee: 168, investor: 168 };

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  clientId: string | null;
  workerId: string | null;
  siteId: string | null;
  mustChangePassword: boolean;
};

export const HOME_BY_ROLE: Record<Role, string> = {
  super_admin: "/admin",
  client_admin: "/portal",
  supervisor: "/portal",
  employee: "/portal",
  investor: "/portal",
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  client_admin: "Client Admin",
  supervisor: "Supervisor",
  employee: "Employee",
  investor: "Investor",
};

export async function createSession(userId: string, role: Role) {
  const db = await getDb();
  const token = randomToken();
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_HOURS[role] * 3600_000);
  await db.insert(schema.sessions).values({
    id: sha256(token),
    userId,
    expiresAt,
    ip: clientIp(h),
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  });
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Current user from the session cookie, or null. Cached per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      clientId: schema.users.clientId,
      workerId: schema.users.workerId,
      siteId: schema.users.siteId,
      mustChangePassword: schema.users.mustChangePassword,
      status: schema.users.status,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  if (!u || u.status !== "active") return null;
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    clientId: u.clientId, workerId: u.workerId, siteId: u.siteId, mustChangePassword: u.mustChangePassword,
  };
});

/** For API routes (downloads): the user, or null if signed out or still on a temporary password. */
export async function apiUser() {
  const user = await getUser();
  return user && !user.mustChangePassword ? user : null;
}

/** Call at the top of every protected page and server action. Deny by default. */
export async function requireUser(roles?: Role[], opts: { allowTempPassword?: boolean } = {}) {
  const user = await getUser();
  if (!user) redirect("/login");
  // A temporary password only unlocks the "set your password" step — enforced for actions too, not just pages.
  if (user.mustChangePassword && !opts.allowTempPassword) redirect("/account/password");
  if (roles && !roles.includes(user.role)) redirect(HOME_BY_ROLE[user.role]);
  return user;
}

export const requireAdmin = () => requireUser(["super_admin"]);

/** Normalise UAE / international phone numbers to +<digits>. */
export function normalisePhone(raw: string) {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = "+971" + d.slice(1);
  if (!d.startsWith("+")) d = "+" + d;
  return /^\+\d{8,15}$/.test(d) ? d : null;
}
