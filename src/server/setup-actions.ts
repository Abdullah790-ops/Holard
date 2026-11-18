"use server";

import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession } from "./auth";
import { timingSafeEqual } from "node:crypto";
import { hashPassword } from "./crypto";
import { audit } from "./audit";
import { handle, reader, type FormState } from "./validate";

export async function needsSetup() {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.users).where(eq(schema.users.role, "super_admin"));
  return n === 0;
}

/** First-run only: creates the owner (Super Admin) account. Locked once any Super Admin exists. */
export async function setupOwner(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    if (!(await needsSetup())) redirect("/login");
    const r = reader(fd);
    const name = r.str("name", { required: true, label: "Name", max: 120 })!;
    const email = r.email("email", true)!;
    const pw = String(fd.get("password") ?? "");
    if (pw.length < 10 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) r.errors.password = "At least 10 characters, with letters and numbers.";
    if (pw !== String(fd.get("confirm") ?? "")) r.errors.confirm = "Passwords do not match.";
    // In production, require the one-time SETUP_TOKEN from the server environment.
    if (process.env.NODE_ENV === "production" && !sameSecret(String(fd.get("token") ?? ""), process.env.SETUP_TOKEN)) r.errors.token = "Invalid setup token.";
    r.check();
    const db = await getDb();
    const [u] = await db.insert(schema.users).values({ name, email, role: "super_admin", passwordHash: await hashPassword(pw) }).returning({ id: schema.users.id });
    await audit(u.id, "setup.owner_created", "user", u.id);
    await createSession(u.id, "super_admin");
    redirect("/admin");
  });
}

/** Constant-time compare; refuses setup when the server's token is missing or too short to be safe. */
function sameSecret(given: string, expected: string | undefined) {
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
