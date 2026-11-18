"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { AUDIENCES } from "@/db/schema";
import { requireAdmin, requireUser } from "./auth";
import { audit } from "./audit";
import { handle, reader, type FormState } from "./validate";
import { assertFile, DOC_MIME, fileFrom, saveFile } from "./storage";
import { isMonth, todayDubai } from "./attendance";

const { portalRequests, sites, workers, announcements, investorDocuments, investorUpdates } = schema;
const ref = () => `REQ-${Date.now().toString(36).toUpperCase()}`;

// ── Client: request workers / replacement / complaint ──
export async function submitClientRequest(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async (): Promise<FormState> => {
    const user = await requireUser(["client_admin"]);
    if (!user.clientId) return { error: "Your login is not linked to a company." };
    const r = reader(fd);
    const type = r.oneOf("type", ["new_workers", "replacement", "complaint"] as const);
    const siteId = r.uuid("siteId");
    const workerDs = r.str("workerDs", { max: 10 });
    const quantity = type === "new_workers" ? r.num("quantity", { required: true, int: true, min: 1, max: 5000 }) : null;
    const category = r.str("category", { max: 80, required: type === "new_workers", label: "Role" });
    const startDate = type === "new_workers" ? r.date("startDate", true) : null;
    const details = r.str("details", { max: 2000, required: type !== "new_workers", label: "Details" });
    if (startDate && startDate < todayDubai()) r.errors.startDate = "Choose today or a future date.";
    r.check();
    const db = await getDb();
    // Never trust IDs from the browser: site and worker must belong to this client.
    if (siteId) {
      const [s] = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.id, siteId), eq(sites.clientId, user.clientId)));
      if (!s) return { error: "Choose one of your sites.", errors: { siteId: "Not your site." } };
    }
    let workerId: string | null = null;
    if (type === "replacement" && workerDs) {
      const n = Number(workerDs.replace(/\D/g, ""));
      const [w] = await db.select({ id: workers.id }).from(workers).where(and(eq(workers.dsNumber, n), eq(workers.clientId, user.clientId)));
      if (!w) return { error: "That DS code is not one of your workers.", errors: { workerDs: "Not found in your team." } };
      workerId = w.id;
    }
    const subject = type === "new_workers" ? `${quantity} × ${category}` : type === "replacement" ? `Replacement${workerDs ? ` for ${workerDs.toUpperCase()}` : ""}` : "Complaint";
    const reference = ref();
    await db.insert(portalRequests).values({ reference, type, clientId: user.clientId, workerId, siteId, createdBy: user.id, subject, details, quantity, category, startDate });
    await audit(user.id, "portal.client_request", "request", reference, { type });
    revalidatePath("/portal/service"); revalidatePath("/admin/requests");
    return { ok: `Request ${reference} sent. Holard will contact you shortly.` };
  });
}

// ── Employee: help desk ──
export async function submitEmployeeRequest(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["employee"]);
    if (!user.workerId) return { error: "Your login is not linked to a worker record." };
    const r = reader(fd);
    const type = r.oneOf("type", ["complaint", "salary", "accommodation", "documents", "other"] as const);
    const subject = r.str("subject", { required: true, label: "Subject", max: 120 })!;
    const details = r.str("details", { required: true, label: "Details", max: 2000 });
    r.check();
    const db = await getDb();
    const [w] = await db.select({ clientId: workers.clientId, siteId: workers.siteId }).from(workers).where(eq(workers.id, user.workerId));
    const reference = ref();
    await db.insert(portalRequests).values({ reference, type, workerId: user.workerId, clientId: null, siteId: w?.siteId ?? null, createdBy: user.id, subject, details });
    await audit(user.id, "portal.employee_request", "request", reference, { type });
    revalidatePath("/portal/help"); revalidatePath("/admin/requests");
    return { ok: `Sent (${reference}). Holard HR will reply here.` };
  });
}

// ── Admin: reply to requests ──
export async function replyRequest(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const status = r.oneOf("status", ["new", "in_progress", "resolved", "closed"] as const);
    const reply = r.str("reply", { max: 2000 });
    r.check();
    const db = await getDb();
    await db.update(portalRequests).set({ status, reply, repliedBy: admin.id, repliedAt: new Date(), updatedAt: new Date() }).where(eq(portalRequests.id, id!));
    await audit(admin.id, "request.reply", "request", id!, { status });
    revalidatePath("/admin/requests");
    return { ok: "Saved — the requester sees the update in their portal." };
  });
}

// ── Admin: announcements ──
export async function saveAnnouncement(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const title = r.str("title", { required: true, label: "Title", max: 120 })!;
    const body = r.str("body", { required: true, label: "Message", max: 3000 })!;
    const audience = r.oneOf("audience", AUDIENCES, "all");
    const expiresOn = r.date("expiresOn");
    r.check();
    const db = await getDb();
    await db.insert(announcements).values({ title, body, audience, expiresOn, createdBy: admin.id });
    await audit(admin.id, "announcement.create", "announcement", undefined, { title, audience });
    revalidatePath("/admin/announcements");
    return { ok: "Announcement published." };
  });
}

export async function deleteAnnouncement(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  await db.delete(announcements).where(eq(announcements.id, id));
  await audit(admin.id, "announcement.delete", "announcement", id);
  revalidatePath("/admin/announcements");
}

// ── Admin: investor documents & updates ──
export async function uploadInvestorDoc(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const title = r.str("title", { required: true, label: "Title", max: 120 })!;
    const category = r.oneOf("category", ["Trade licence", "Financial summary", "Contract", "Company profile", "Pitch deck", "Other"] as const, "Other");
    const notes = r.str("notes", { max: 300 });
    const file = fileFrom(fd.get("file"));
    if (!file) r.errors.file = "Choose a file.";
    r.check();
    await assertFile(file!, DOC_MIME);
    const fileId = await saveFile(file!, { ownerType: "investor_doc", uploadedBy: admin.id });
    const db = await getDb();
    const [d] = await db.insert(investorDocuments).values({ title, category, notes, fileId, isVisible: fd.get("isVisible") === "on", createdBy: admin.id }).returning({ id: investorDocuments.id });
    await db.update(schema.files).set({ ownerId: d.id }).where(eq(schema.files.id, fileId));
    await audit(admin.id, "investor_doc.upload", "investor_doc", d.id, { title, category });
    revalidatePath("/admin/investors");
    return { ok: "Document uploaded." };
  });
}

export async function toggleInvestorDoc(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const visible = fd.get("visible") === "1";
  const db = await getDb();
  await db.update(investorDocuments).set({ isVisible: visible }).where(eq(investorDocuments.id, id));
  await audit(admin.id, visible ? "investor_doc.show" : "investor_doc.hide", "investor_doc", id);
  revalidatePath("/admin/investors");
}

export async function deleteInvestorDoc(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  await db.delete(investorDocuments).where(eq(investorDocuments.id, id));
  await audit(admin.id, "investor_doc.delete", "investor_doc", id);
  revalidatePath("/admin/investors");
}

export async function saveInvestorUpdate(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const month = String(fd.get("month") ?? "");
    if (!isMonth(month)) r.errors.month = "Choose a month.";
    const title = r.str("title", { required: true, label: "Title", max: 120 })!;
    const body = r.str("body", { required: true, label: "Letter", max: 10000 })!;
    const publish = fd.get("publish") === "on";
    r.check();
    const db = await getDb();
    await db.insert(investorUpdates).values({ month, title, body, isPublished: publish, publishedAt: publish ? new Date() : null, createdBy: admin.id });
    await audit(admin.id, "investor_update.create", "investor_update", undefined, { month, publish });
    revalidatePath("/admin/investors");
    return { ok: publish ? "Update published to investors." : "Saved as draft." };
  });
}

export async function publishInvestorUpdate(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const publish = fd.get("publish") === "1";
  const db = await getDb();
  await db.update(investorUpdates).set({ isPublished: publish, publishedAt: publish ? new Date() : null }).where(eq(investorUpdates.id, id));
  await audit(admin.id, publish ? "investor_update.publish" : "investor_update.unpublish", "investor_update", id);
  revalidatePath("/admin/investors");
}
