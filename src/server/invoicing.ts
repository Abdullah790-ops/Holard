import "server-only";
import { and, asc, between, desc, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { addDays, daysInMonth, getSetting, todayDubai, weekday } from "./attendance";

const { invoices, invoiceLines, invoiceWorkers, invoicePayments, clients, sites, workers, attendance } = schema;

export type InvoiceSettings = { vatRate: number; paymentTermsDays: number; companyName: string; companyTrn: string; companyAddress: string; bankDetails: string };
export async function invoiceSettings(): Promise<InvoiceSettings> {
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "invoice"));
  return { vatRate: 5, paymentTermsDays: 30, companyName: "HOLARD", companyTrn: "", companyAddress: "", bankDetails: "", ...((row?.value as object) ?? {}) };
}

export const invNo = (n: number) => `HOL-INV-${String(n).padStart(3, "0")}`;
const s2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/** Display status: draft / sent / partial / overdue / paid / void */
export function invoiceState(inv: { status: string; total: string; paidAmount: string; dueDate: string }) {
  if (inv.status === "draft" || inv.status === "void" || inv.status === "paid") return inv.status;
  const balance = Number(inv.total) - Number(inv.paidAmount);
  if (balance <= 0.004) return "paid";
  if (inv.dueDate < todayDubai()) return "overdue";
  if (Number(inv.paidAmount) > 0) return "partial";
  return "sent";
}

/** Build invoice lines from approved attendance for one client and month. */
export async function buildFromAttendance(clientId: string, month: string) {
  const db = await getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new Error("Client not found");
  const n = daysInMonth(month);
  const from = `${month}-01`, to = `${month}-${String(n).padStart(2, "0")}`;
  const att = await getSetting("attendance");
  const workingDays = Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`).filter((d) => weekday(d) !== att.weeklyOff).length;

  // Attendance at this client's sites during the month (worker may have moved since).
  const rows = await db.select({
    workerId: attendance.workerId, status: attendance.status, ot: attendance.overtimeHours,
    siteId: sites.id, siteName: sites.name, ds: workers.dsNumber, name: workers.fullName,
  }).from(attendance)
    .innerJoin(sites, eq(attendance.siteId, sites.id))
    .innerJoin(workers, eq(attendance.workerId, workers.id))
    .where(and(eq(sites.clientId, clientId), between(attendance.date, from, to)));

  type W = { workerId: string; ds: number; name: string; siteName: string; days: number; ot: number };
  const perWorker = new Map<string, W>();
  const perSite = new Map<string, { name: string; workers: Set<string>; days: number; ot: number; workerMonths: number }>();
  for (const r of rows) {
    const key = `${r.workerId}|${r.siteId}`;
    const w = perWorker.get(key) ?? { workerId: r.workerId, ds: r.ds, name: r.name, siteName: r.siteName, days: 0, ot: 0 };
    if (r.status === "P") w.days++;
    w.ot += Number(r.ot) || 0;
    perWorker.set(key, w);
  }
  for (const [key, w] of perWorker) {
    const siteId = key.split("|")[1];
    const s = perSite.get(siteId) ?? { name: w.siteName, workers: new Set<string>(), days: 0, ot: 0, workerMonths: 0 };
    if (w.days > 0) s.workers.add(w.workerId);
    s.days += w.days; s.ot += w.ot;
    s.workerMonths += Math.min(1, w.days / Math.max(1, workingDays));
    perSite.set(siteId, s);
  }

  const lines: Omit<typeof invoiceLines.$inferInsert, "invoiceId">[] = [];
  const problems: string[] = [];
  const perDay = client.billingBasis !== "per_month";
  const rate = Number(perDay ? client.dailyRate : client.monthlyRate);
  if (!rate) problems.push(`Set the client's ${perDay ? "daily" : "monthly"} rate first (Clients → ${client.name}).`);
  let order = 0;
  for (const s of [...perSite.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    if (s.days > 0) {
      const qty = perDay ? s.days : Math.round(s.workerMonths * 100) / 100;
      lines.push({
        kind: "labour", siteName: s.name, sortOrder: order++,
        description: perDay ? `Manpower supply — ${s.name} (${s.workers.size} workers × days present)` : `Manpower supply — ${s.name} (${s.workers.size} workers, pro-rated to ${workingDays} working days)`,
        workers: s.workers.size, quantity: s2(qty), unit: perDay ? "day" : "worker-month", rate: s2(rate), amount: s2(qty * rate),
      });
    }
    if (s.ot > 0 && Number(client.otRate)) {
      lines.push({ kind: "overtime", siteName: s.name, sortOrder: order++, description: `Overtime — ${s.name}`, workers: null, quantity: s2(s.ot), unit: "hour", rate: s2(Number(client.otRate)), amount: s2(s.ot * Number(client.otRate)) });
    }
  }
  if (!lines.length) problems.push(`No present days found for ${client.name} in ${month}. Mark attendance first.`);
  const annex = [...perWorker.values()].filter((w) => w.days > 0 || w.ot > 0).sort((a, b) => a.siteName.localeCompare(b.siteName) || a.ds - b.ds);
  return { client, lines, annex, problems, from, to };
}

export async function computeTotals(invoiceId: string) {
  const db = await getDb();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  const lines = await db.select({ amount: invoiceLines.amount }).from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId));
  const subtotal = lines.reduce((a, l) => a + Number(l.amount), 0);
  const vat = (subtotal * Number(inv.vatRate)) / 100;
  await db.update(invoices).set({ subtotal: s2(subtotal), vatAmount: s2(vat), total: s2(subtotal + vat), updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
}

export async function nextInvoiceNumber() {
  const db = await getDb();
  const [{ m }] = await db.select({ m: sql<number>`coalesce(max(${invoices.number}), 0)::int` }).from(invoices);
  return Number(m) + 1;
}

export async function getInvoice(id: string) {
  const db = await getDb();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) return null;
  const [lines, annex, payments] = await Promise.all([
    db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id)).orderBy(asc(invoiceLines.sortOrder)),
    db.select().from(invoiceWorkers).where(eq(invoiceWorkers.invoiceId, id)).orderBy(asc(invoiceWorkers.siteName), asc(invoiceWorkers.dsNumber)),
    db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, id)).orderBy(desc(invoicePayments.date)),
  ]);
  return { ...inv, lines, annex, payments, state: invoiceState(inv) };
}

/** Money summary for the dashboard (issued invoices). */
export async function moneySummary(month: string) {
  const db = await getDb();
  const all = await db.select().from(invoices).where(and(ne(invoices.status, "draft"), ne(invoices.status, "void")));
  const thisMonth = all.filter((i) => i.issueDate.startsWith(month));
  const sum = (xs: typeof all, f: (i: (typeof all)[number]) => number) => xs.reduce((a, i) => a + f(i), 0);
  const outstanding = all.filter((i) => ["sent", "partial", "overdue"].includes(invoiceState(i)));
  const overdue = all.filter((i) => invoiceState(i) === "overdue");
  return {
    invoicedThisMonth: sum(thisMonth, (i) => Number(i.total)),
    paidThisMonth: sum(thisMonth, (i) => Number(i.paidAmount)),
    outstanding: sum(outstanding, (i) => Number(i.total) - Number(i.paidAmount)),
    overdue: sum(overdue, (i) => Number(i.total) - Number(i.paidAmount)),
    overdueCount: overdue.length,
    dueSoon: outstanding.filter((i) => i.dueDate >= todayDubai() && i.dueDate <= addDays(todayDubai(), 7)).length,
  };
}

