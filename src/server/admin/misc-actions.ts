"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ENQUIRY_STATUS, ROLES, type Role } from "@/db/schema";
import { normalisePhone, requireAdmin } from "../auth";
import { audit } from "../audit";
import { hashPassword, tempPassword } from "../crypto";
import { handle, reader, type FormState } from "../validate";

// ── Jobs ───────────────────────────────────────────────
export async function saveJob(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const v = {
      title: r.str("title", { required: true, label: "Job title", max: 80 })!,
      salary: r.str("salary", { max: 60 }),
      location: r.str("location", { max: 80 }),
      type: r.oneOf("type", ["Full-time", "Part-time", "Contract", "Temporary"] as const, "Full-time"),
      description: r.str("description", { max: 1000 }),
      isPublished: fd.get("isPublished") === "on",
      sortOrder: r.num("sortOrder", { int: true, min: 0, max: 999 }) ?? 0,
    };
    r.check();
    const db = await getDb();
    if (id) await db.update(schema.jobs).set(v).where(eq(schema.jobs.id, id));
    else await db.insert(schema.jobs).values(v);
    await audit(admin.id, id ? "job.update" : "job.create", "job", id ?? undefined, { title: v.title });
    revalidatePath("/admin/jobs");
    revalidatePath("/candidates");
    return { ok: id ? "Job updated." : `“${v.title}” posted${v.isPublished ? " and live on the website" : " as a draft"}.` };
  });
}

export async function deleteJob(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  await db.delete(schema.jobs).where(eq(schema.jobs.id, id));
  await audit(admin.id, "job.delete", "job", id);
  revalidatePath("/admin/jobs");
  revalidatePath("/candidates");
}

// ── Inbox ──────────────────────────────────────────────
export async function setEnquiryStatus(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!ENQUIRY_STATUS.includes(status as "new")) return;
  const db = await getDb();
  await db.update(schema.enquiries).set({ status: status as "new" }).where(eq(schema.enquiries.id, id));
  await audit(admin.id, "enquiry.status", "enquiry", id, { status });
  revalidatePath("/admin/inbox");
  revalidatePath("/testimonials");
}

// ── Users ──────────────────────────────────────────────
export async function createUser(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async (): Promise<FormState> => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const name = r.str("name", { required: true, label: "Name", max: 120 })!;
    const email = r.email("email");
    const phoneRaw = r.str("phone", { max: 30 });
    const role = r.oneOf("role", ROLES) as Role;
    const clientId = r.uuid("clientId");
    const workerId = r.uuid("workerId");
    const siteId = r.uuid("siteId");
    const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
    if (phoneRaw && !phone) r.errors.phone = "Enter a valid phone number with country code.";
    if (!email && !phone) r.errors.email = "Give an email or a phone number to log in with.";
    if ((role === "client_admin" || role === "supervisor") && !clientId) r.errors.clientId = "Pick the client this user belongs to.";
    if (role === "employee" && !workerId) r.errors.workerId = "Pick the worker this login is for.";
    r.check();
    const db = await getDb();
    if (siteId) {
      const [st] = await db.select({ clientId: schema.sites.clientId }).from(schema.sites).where(eq(schema.sites.id, siteId));
      if (!st || st.clientId !== clientId) return { error: "That site does not belong to the selected client.", errors: { clientId: "Site/client mismatch." } };
    }
    if (email) {
      const [dupe] = await db.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`);
      if (dupe) return { error: "A user with this email already exists.", errors: { email: "Already in use." } };
    }
    if (phone) {
      const [dupe] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.phone, phone));
      if (dupe) return { error: "A user with this phone already exists.", errors: { phone: "Already in use." } };
    }
    const pw = tempPassword();
    const [u] = await db.insert(schema.users).values({
      name, email, phone, role, passwordHash: await hashPassword(pw), mustChangePassword: true,
      clientId: role === "client_admin" || role === "supervisor" ? clientId : null,
      workerId: role === "employee" ? workerId : null,
      siteId: role === "supervisor" ? siteId : null,
    }).returning({ id: schema.users.id });
    await audit(admin.id, "user.create", "user", u.id, { role, email, phone });
    revalidatePath("/admin/users");
    return { ok: `User created. Share these login details securely — the temporary password is shown only once:\n${email ?? phone}\nTemporary password: ${pw}${phone ? "\n(Phone + OTP login also works once WhatsApp/SMS is connected.)" : ""}` };
  });
}

export async function userAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const op = String(fd.get("op") ?? "");
  const db = await getDb();
  if (id === admin.id && op === "disable") return; // never lock yourself out
  if (op === "disable" || op === "enable") {
    if (op === "disable") {
      // keep at least one active super admin
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(and(eq(schema.users.role, "super_admin"), eq(schema.users.status, "active"), ne(schema.users.id, id)));
      const [target] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id));
      if (target?.role === "super_admin" && n === 0) return;
    }
    await db.update(schema.users).set({ status: op === "disable" ? "disabled" : "active" }).where(eq(schema.users.id, id));
    if (op === "disable") await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
    await audit(admin.id, `user.${op}`, "user", id);
  }
  revalidatePath("/admin/users");
}

export async function resetUserPassword(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const id = String(fd.get("id") ?? "");
    const db = await getDb();
    const pw = tempPassword();
    await db.update(schema.users).set({ passwordHash: await hashPassword(pw), mustChangePassword: true }).where(eq(schema.users.id, id));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
    await audit(admin.id, "user.password_reset_by_admin", "user", id);
    return { ok: `New temporary password: ${pw}` };
  });
}
