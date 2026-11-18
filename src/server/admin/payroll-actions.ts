"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { handle, reader, type FormState } from "../validate";
import { isMonth, todayDubai } from "../attendance";
import { calculateLines, eligibleWorkers, totals } from "../payroll";

const { payrollRuns, payrollLines, advanceRequests } = schema;

export async function createPayroll(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const month = String(fd.get("month") ?? "");
    const clientId = String(fd.get("clientId") ?? "") || null;
    if (!isMonth(month)) return { error: "Choose a month.", errors: { month: "Choose a month." } };
    if (month > todayDubai().slice(0, 7)) return { error: "You cannot run payroll for a future month.", errors: { month: "Future month." } };
    const ids = await eligibleWorkers(month, clientId);
    if (!ids.length) return { error: "No workers to pay — they may already be in another payroll for this month." };
    const lines = await calculateLines(month, ids);
    const db = await getDb();
    const t = totals(lines);
    const [run] = await db.insert(payrollRuns).values({ month, clientId, createdBy: admin.id, ...t }).returning({ id: payrollRuns.id });
    for (let i = 0; i < lines.length; i += 500) {
      await db.insert(payrollLines).values(lines.slice(i, i + 500).map(({ warnings, ...l }) => { void warnings; return { ...l, runId: run.id }; }));
    }
    await audit(admin.id, "payroll.create", "payroll", run.id, { month, clientId, workers: lines.length });
    revalidatePath("/admin/payroll");
    redirect(`/admin/payroll/${run.id}`);
  });
}

async function draftRun(id: string) {
  const db = await getDb();
  const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id));
  return run?.status === "draft" ? run : null;
}

async function refreshTotals(runId: string) {
  const db = await getDb();
  const lines = await db.select().from(payrollLines).where(eq(payrollLines.runId, runId));
  await db.update(payrollRuns).set({ ...totals(lines), updatedAt: new Date() }).where(eq(payrollRuns.id, runId));
}

/** Re-read attendance, leave and advances; keeps manual allowances / deductions / notes. */
export async function recalculatePayroll(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const run = await draftRun(id);
  if (!run) return;
  const db = await getDb();
  const cur = await db.select().from(payrollLines).where(eq(payrollLines.runId, id));
  const keep = new Map(cur.map((l) => [l.workerId, { allowances: l.allowances, otherDeductions: l.otherDeductions, note: l.note }]));
  const lines = await calculateLines(run.month, cur.map((l) => l.workerId), keep);
  await db.transaction(async (tx) => {
    await tx.delete(payrollLines).where(eq(payrollLines.runId, id));
    for (let i = 0; i < lines.length; i += 500) {
      await tx.insert(payrollLines).values(lines.slice(i, i + 500).map(({ warnings, ...l }) => { void warnings; return { ...l, runId: id }; }));
    }
  });
  await refreshTotals(id);
  await audit(admin.id, "payroll.recalculate", "payroll", id);
  revalidatePath(`/admin/payroll/${id}`);
}

export async function adjustLine(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const lineId = r.uuid("lineId");
    const allowances = r.num("allowances", { min: 0, max: 100000 }) ?? 0;
    const otherDeductions = r.num("otherDeductions", { min: 0, max: 100000 }) ?? 0;
    const note = r.str("note", { max: 200 });
    r.check();
    const db = await getDb();
    const [l] = await db.select().from(payrollLines).where(eq(payrollLines.id, lineId!));
    if (!l || !(await draftRun(l.runId))) return { error: "This payroll is locked." };
    const gross = Number(l.basic) + Number(l.otPay) + allowances;
    const net = Math.max(0, gross - Number(l.absenceDeduction) - Number(l.advanceDeduction) - otherDeductions);
    await db.update(payrollLines).set({ allowances: allowances.toFixed(2), otherDeductions: otherDeductions.toFixed(2), note, gross: gross.toFixed(2), net: net.toFixed(2) }).where(eq(payrollLines.id, l.id));
    await refreshTotals(l.runId);
    await audit(admin.id, "payroll.adjust", "payroll_line", l.id, { allowances, otherDeductions, note });
    revalidatePath(`/admin/payroll/${l.runId}`);
    return { ok: `Saved · net AED ${net.toLocaleString("en-US", { minimumFractionDigits: 2 })}` };
  });
}

export async function removeLine(fd: FormData) {
  const admin = await requireAdmin();
  const lineId = String(fd.get("lineId") ?? "");
  const db = await getDb();
  const [l] = await db.select().from(payrollLines).where(eq(payrollLines.id, lineId));
  if (!l || !(await draftRun(l.runId))) return;
  await db.delete(payrollLines).where(eq(payrollLines.id, lineId));
  await refreshTotals(l.runId);
  await audit(admin.id, "payroll.remove_worker", "payroll", l.runId, { workerId: l.workerId });
  revalidatePath(`/admin/payroll/${l.runId}`);
}

/** Locks the payroll, records advance repayments and publishes payslips to workers. */
export async function approvePayroll(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const run = await draftRun(id);
  if (!run) return;
  const db = await getDb();
  const lines = await db.select().from(payrollLines).where(eq(payrollLines.runId, id));
  await db.transaction(async (tx) => {
    for (const l of lines) {
      let left = Number(l.advanceDeduction);
      if (left <= 0) continue;
      const adv = await tx.select().from(advanceRequests)
        .where(and(eq(advanceRequests.workerId, l.workerId), eq(advanceRequests.status, "approved"), sql`${advanceRequests.repaidAmount} < ${advanceRequests.amount}`))
        .orderBy(asc(advanceRequests.adminAt));
      for (const a of adv) {
        if (left <= 0) break;
        const pay = Math.min(left, Number(a.amount) - Number(a.repaidAmount));
        await tx.update(advanceRequests).set({ repaidAmount: (Number(a.repaidAmount) + pay).toFixed(2) }).where(eq(advanceRequests.id, a.id));
        left -= pay;
      }
    }
    await tx.update(payrollRuns).set({ status: "approved", approvedBy: admin.id, approvedAt: new Date(), updatedAt: new Date() }).where(eq(payrollRuns.id, id));
  });
  await audit(admin.id, "payroll.approve", "payroll", id, { month: run.month, workers: lines.length });
  revalidatePath(`/admin/payroll/${id}`); revalidatePath("/admin/payroll");
}

export async function markPayrollPaid(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  await db.update(payrollRuns).set({ status: "paid", paidAt: new Date(), updatedAt: new Date() }).where(and(eq(payrollRuns.id, id), eq(payrollRuns.status, "approved")));
  await audit(admin.id, "payroll.paid", "payroll", id);
  revalidatePath(`/admin/payroll/${id}`); revalidatePath("/admin/payroll");
}

export async function deletePayroll(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!(await draftRun(id))) return;
  const db = await getDb();
  await db.delete(payrollRuns).where(eq(payrollRuns.id, id));
  await audit(admin.id, "payroll.delete_draft", "payroll", id);
  revalidatePath("/admin/payroll");
  redirect("/admin/payroll");
}

export async function savePayrollSettings(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const dayBasis = r.oneOf("dayBasis", ["30", "26"] as const, "30");
    const establishmentId = (r.str("establishmentId", { max: 20 }) ?? "").replace(/\D/g, "");
    const employerRoutingCode = (r.str("employerRoutingCode", { max: 20 }) ?? "").replace(/\D/g, "");
    if (establishmentId && establishmentId.length !== 13) r.errors.establishmentId = "13 digits.";
    if (employerRoutingCode && employerRoutingCode.length !== 9) r.errors.employerRoutingCode = "9 digits.";
    const vatRate = r.num("vatRate", { required: true, min: 0, max: 20 });
    const paymentTermsDays = r.num("paymentTermsDays", { required: true, int: true, min: 0, max: 180 });
    const companyName = r.str("companyName", { max: 120 }) ?? "HOLARD";
    const companyTrn = (r.str("companyTrn", { max: 20 }) ?? "").replace(/\s/g, "");
    if (companyTrn && !/^\d{15}$/.test(companyTrn)) r.errors.companyTrn = "UAE TRN is 15 digits.";
    const companyAddress = r.str("companyAddress", { max: 300 }) ?? "";
    const bankDetails = r.str("bankDetails", { max: 500 }) ?? "";
    r.check();
    const db = await getDb();
    const up = (key: string, value: unknown) => db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
    await up("payroll", { dayBasis: Number(dayBasis), establishmentId, employerRoutingCode });
    await up("invoice", { vatRate, paymentTermsDays, companyName, companyTrn, companyAddress, bankDetails });
    await audit(admin.id, "settings.payroll_invoice", "settings");
    revalidatePath("/admin/settings");
    return { ok: "Payroll & invoice settings saved." };
  });
}
