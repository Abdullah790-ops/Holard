"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { handle, reader, type FormState } from "../validate";
import { addDays, isMonth, todayDubai } from "../attendance";
import { buildFromAttendance, computeTotals, invoiceSettings, invNo, nextInvoiceNumber } from "../invoicing";

const { invoices, invoiceLines, invoiceWorkers, invoicePayments } = schema;

export async function createInvoice(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const clientId = r.uuid("clientId");
    const month = String(fd.get("month") ?? "");
    if (!clientId) r.errors.clientId = "Choose a client.";
    if (!isMonth(month)) r.errors.month = "Choose a month.";
    r.check();
    const db = await getDb();
    const [dupe] = await db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(and(eq(invoices.clientId, clientId!), eq(invoices.month, month), ne(invoices.status, "void")));
    if (dupe) return { error: `${invNo(dupe.number)} already exists for this client and month. Void it first to create a new one.` };
    const { client, lines, annex, problems, from, to } = await buildFromAttendance(clientId!, month);
    if (problems.length) return { error: problems.join(" ") };
    const cfg = await invoiceSettings();
    const issue = todayDubai();
    const terms = client.paymentTermsDays ?? cfg.paymentTermsDays;
    let invoiceId = "";
    for (let attempt = 0; ; attempt++) {
      try {
        const [inv] = await db.insert(invoices).values({
          number: await nextInvoiceNumber(), clientId: client.id, month, periodStart: from, periodEnd: to, issueDate: issue, dueDate: addDays(issue, terms),
          clientName: client.name, clientTrn: client.trn, clientAddress: client.address, vatRate: String(cfg.vatRate), createdBy: admin.id,
        }).returning({ id: invoices.id });
        invoiceId = inv.id;
        break;
      } catch (e) { if (attempt >= 3) throw e; }
    }
    await db.insert(invoiceLines).values(lines.map((l) => ({ ...l, invoiceId })));
    for (let i = 0; i < annex.length; i += 500) {
      await db.insert(invoiceWorkers).values(annex.slice(i, i + 500).map((w) => ({ invoiceId, workerId: w.workerId, dsNumber: w.ds, fullName: w.name, siteName: w.siteName, days: w.days, otHours: w.ot.toFixed(2) })));
    }
    await computeTotals(invoiceId);
    await audit(admin.id, "invoice.create", "invoice", invoiceId, { client: client.name, month });
    revalidatePath("/admin/invoices");
    redirect(`/admin/invoices/${invoiceId}`);
  });
}

async function draft(id: string) {
  const db = await getDb();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  return inv?.status === "draft" ? inv : null;
}

/** Rebuild a draft from the latest attendance (manual adjustment lines are kept). */
export async function regenerateInvoice(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const inv = await draft(id);
  if (!inv) return;
  const { lines, annex } = await buildFromAttendance(inv.clientId, inv.month);
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(invoiceLines).where(and(eq(invoiceLines.invoiceId, id), ne(invoiceLines.kind, "adjustment")));
    await tx.delete(invoiceWorkers).where(eq(invoiceWorkers.invoiceId, id));
    if (lines.length) await tx.insert(invoiceLines).values(lines.map((l) => ({ ...l, invoiceId: id })));
    for (let i = 0; i < annex.length; i += 500) {
      await tx.insert(invoiceWorkers).values(annex.slice(i, i + 500).map((w) => ({ invoiceId: id, workerId: w.workerId, dsNumber: w.ds, fullName: w.name, siteName: w.siteName, days: w.days, otHours: w.ot.toFixed(2) })));
    }
  });
  await computeTotals(id);
  await audit(admin.id, "invoice.regenerate", "invoice", id);
  revalidatePath(`/admin/invoices/${id}`);
}

export async function addInvoiceLine(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const description = r.str("description", { required: true, label: "Description", max: 200 })!;
    const amount = r.num("amount", { required: true, min: -1_000_000, max: 10_000_000 });
    r.check();
    if (!(await draft(id!))) return { error: "Only draft invoices can be changed." };
    const db = await getDb();
    await db.insert(invoiceLines).values({ invoiceId: id!, kind: "adjustment", description, quantity: "1", unit: "item", rate: amount!.toFixed(2), amount: amount!.toFixed(2), sortOrder: 999 });
    await computeTotals(id!);
    await audit(admin.id, "invoice.add_line", "invoice", id!, { description, amount });
    revalidatePath(`/admin/invoices/${id}`);
    return { ok: "Line added." };
  });
}

export async function removeInvoiceLine(fd: FormData) {
  const admin = await requireAdmin();
  const lineId = String(fd.get("lineId") ?? "");
  const db = await getDb();
  const [l] = await db.select().from(invoiceLines).where(eq(invoiceLines.id, lineId));
  if (!l || !(await draft(l.invoiceId))) return;
  await db.delete(invoiceLines).where(eq(invoiceLines.id, lineId));
  await computeTotals(l.invoiceId);
  await audit(admin.id, "invoice.remove_line", "invoice", l.invoiceId, { description: l.description });
  revalidatePath(`/admin/invoices/${l.invoiceId}`);
}

export async function saveInvoiceNotes(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const id = String(fd.get("id") ?? "");
    const notes = String(fd.get("notes") ?? "").slice(0, 1000) || null;
    if (!(await draft(id))) return { error: "Only draft invoices can be changed." };
    const db = await getDb();
    await db.update(invoices).set({ notes, updatedAt: new Date() }).where(eq(invoices.id, id));
    await audit(admin.id, "invoice.notes", "invoice", id);
    revalidatePath(`/admin/invoices/${id}`);
    return { ok: "Notes saved." };
  });
}

/** Draft → Sent. Locks the invoice. (Sending by email/WhatsApp is manual until Phase 2E.) */
export async function markInvoiceSent(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const inv = await draft(id);
  if (!inv) return;
  const db = await getDb();
  const today = todayDubai();
  await db.update(invoices).set({ status: "sent", sentAt: new Date(), issueDate: today, dueDate: addDays(today, Math.round((Date.parse(inv.dueDate) - Date.parse(inv.issueDate)) / 86400_000)), updatedAt: new Date() }).where(eq(invoices.id, id));
  await audit(admin.id, "invoice.sent", "invoice", id);
  revalidatePath(`/admin/invoices/${id}`); revalidatePath("/admin/invoices");
}

export async function recordPayment(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const amount = r.num("amount", { required: true, min: 0.01, max: 100_000_000 });
    const date = r.date("date", true);
    const method = r.oneOf("method", ["Bank transfer", "Cheque", "Cash", "Other"] as const, "Bank transfer");
    const reference = r.str("reference", { max: 100 });
    r.check();
    const db = await getDb();
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id!));
    if (!inv || inv.status === "draft" || inv.status === "void") return { error: "Mark the invoice as sent before recording payments." };
    const balance = Number(inv.total) - Number(inv.paidAmount);
    if (amount! > balance + 0.01) return { error: `Amount is more than the balance (AED ${balance.toFixed(2)}).`, errors: { amount: "Too high." } };
    const paid = Number(inv.paidAmount) + amount!;
    await db.insert(invoicePayments).values({ invoiceId: id!, amount: amount!.toFixed(2), date: date!, method, reference, createdBy: admin.id });
    await db.update(invoices).set({ paidAmount: paid.toFixed(2), status: paid >= Number(inv.total) - 0.004 ? "paid" : "sent", updatedAt: new Date() }).where(eq(invoices.id, id!));
    await audit(admin.id, "invoice.payment", "invoice", id!, { amount, method, reference });
    revalidatePath(`/admin/invoices/${id}`); revalidatePath("/admin/invoices");
    return { ok: `Payment of AED ${amount!.toLocaleString("en-US", { minimumFractionDigits: 2 })} recorded.` };
  });
}

export async function voidInvoice(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv || Number(inv.paidAmount) > 0 || inv.status === "void") return;
  await db.update(invoices).set({ status: "void", updatedAt: new Date() }).where(eq(invoices.id, id));
  await audit(admin.id, "invoice.void", "invoice", id, { number: inv.number });
  revalidatePath(`/admin/invoices/${id}`); revalidatePath("/admin/invoices");
}
