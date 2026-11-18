import "server-only";
import { and, asc, between, eq, inArray, lte, ne, notInArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { daysInMonth, getSetting, todayDubai, weekday } from "./attendance";

const { workers, attendance, leaveRequests, advanceRequests, payrollRuns, payrollLines, clients, sites, shifts } = schema;

export type PayrollSettings = { dayBasis: number; establishmentId: string; employerRoutingCode: string };
export async function payrollSettings(): Promise<PayrollSettings> {
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "payroll"));
  return { dayBasis: 30, establishmentId: "", employerRoutingCode: "", ...((row?.value as object) ?? {}) };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const s2 = (n: number) => r2(n).toFixed(2);
export const monthRange = (month: string) => {
  const n = daysInMonth(month);
  return { from: `${month}-01`, to: `${month}-${String(n).padStart(2, "0")}`, days: n };
};

type LineCalc = Omit<typeof payrollLines.$inferInsert, "id" | "runId"> & { warnings: string[] };

/**
 * Salary for one worker for one month (UAE defaults, configurable):
 *  earned basic = basic × (calendar days employed this month ÷ days in month)
 *  absence deduction = (absent days + unpaid leave days) × basic ÷ day basis (30 by default)
 *  overtime pay = approved OT hours × hourly OT rate
 *      hourly OT rate = worker's fixed OT rate if set, else basic ÷ 30 ÷ shift hours × 1.25 (UAE law)
 *  advance deduction = monthly instalment of each approved advance, until repaid
 *  net = earned basic + OT + allowances − absence − advance − other deductions
 */
export async function calculateLines(month: string, workerIds: string[], keep: Map<string, { allowances: string; otherDeductions: string; note: string | null }> = new Map()) {
  if (!workerIds.length) return [];
  const db = await getDb();
  const { from, to, days } = monthRange(month);
  const today = todayDubai();
  const cfg = await payrollSettings();
  const ot = await getSetting("overtime");
  const allShifts = await db.select().from(shifts);
  const defShift = allShifts.find((s) => s.isDefault) ?? allShifts[0];

  const ws = await db.select({ w: workers, clientName: clients.name, siteName: sites.name })
    .from(workers).leftJoin(clients, eq(workers.clientId, clients.id)).leftJoin(sites, eq(workers.siteId, sites.id))
    .where(inArray(workers.id, workerIds)).orderBy(asc(workers.dsNumber));
  const att = await db.select({ workerId: attendance.workerId, date: attendance.date, status: attendance.status, ot: attendance.overtimeHours })
    .from(attendance).where(and(inArray(attendance.workerId, workerIds), between(attendance.date, from, to)));
  const unpaid = await db.select({ workerId: leaveRequests.workerId, start: leaveRequests.startDate, end: leaveRequests.endDate })
    .from(leaveRequests).where(and(inArray(leaveRequests.workerId, workerIds), eq(leaveRequests.type, "unpaid"), eq(leaveRequests.status, "approved"), lte(leaveRequests.startDate, to), sql`${leaveRequests.endDate} >= ${from}`));
  const advances = await db.select().from(advanceRequests)
    .where(and(inArray(advanceRequests.workerId, workerIds), eq(advanceRequests.status, "approved"), sql`${advanceRequests.adminAt} < (${to}::date + interval '1 day')`, sql`${advanceRequests.repaidAmount} < ${advanceRequests.amount}`));

  const byWorker = new Map<string, typeof att>();
  for (const a of att) (byWorker.get(a.workerId) ?? byWorker.set(a.workerId, []).get(a.workerId)!).push(a);

  return ws.map(({ w, clientName, siteName }): LineCalc => {
    const warnings: string[] = [];
    const basic = Number(w.basicSalary) || 0;
    if (!basic) warnings.push("No basic salary");
    const recs = byWorker.get(w.id) ?? [];
    const isUnpaid = (d: string) => unpaid.some((u) => u.workerId === w.id && u.start <= d && u.end >= d);
    let P = 0, A = 0, L = 0, UL = 0, OFF = 0, otH = 0;
    for (const r of recs) {
      otH += Number(r.ot) || 0;
      if (r.status === "P") P++;
      else if (r.status === "A") A++;
      else if (r.status === "OFF") OFF++;
      else if (r.status === "L") { if (isUnpaid(r.date)) UL++; else L++; }
    }
    // employment window in this month
    const start = w.joiningDate && w.joiningDate > from ? w.joiningDate : from;
    const end = to;
    const employedDays = start > end ? 0 : Math.round((Date.parse(end) - Date.parse(start)) / 86400_000) + 1;
    const lastCounted = to < today ? to : today;
    let unmarked = 0;
    for (let d = Number(start.slice(8, 10)); start.slice(0, 7) === month && d <= days; d++) {
      const date = `${month}-${String(d).padStart(2, "0")}`;
      if (date > lastCounted) break;
      if (!recs.some((r) => r.date === date)) unmarked++;
    }
    if (unmarked) warnings.push(`${unmarked} day${unmarked === 1 ? "" : "s"} not marked`);
    if (!w.iban || !w.routingCode || !w.personId) warnings.push("WPS bank details missing");

    const earnedBasic = basic * (employedDays / days);
    const daily = basic / (cfg.dayBasis || 30);
    const absenceDeduction = daily * (A + UL);
    const shift = allShifts.find((s) => s.id === w.shiftId) ?? defShift;
    const otHourly = Number(w.overtimeRate) || (basic / 30 / (Number(shift?.standardHours) || 8)) * ot.normalMultiplier;
    const otPay = otH * otHourly;
    let advanceDeduction = 0;
    for (const a of advances.filter((x) => x.workerId === w.id)) {
      const remaining = Number(a.amount) - Number(a.repaidAmount);
      advanceDeduction += Math.min(remaining, Number(a.amount) / a.repaymentMonths);
    }
    const k = keep.get(w.id);
    const allowances = Number(k?.allowances ?? 0);
    const other = Number(k?.otherDeductions ?? 0);
    const gross = earnedBasic + otPay + allowances;
    const net = Math.max(0, gross - absenceDeduction - advanceDeduction - other);
    if (gross - absenceDeduction - advanceDeduction - other < 0) warnings.push("Deductions exceed salary — net set to 0");
    return {
      workerId: w.id, month, dsNumber: w.dsNumber, fullName: w.fullName, jobTitle: w.jobTitle, clientName, siteName,
      personId: w.personId, iban: w.iban, routingCode: w.routingCode,
      basic: s2(earnedBasic), dayBasis: cfg.dayBasis || 30, presentDays: P, absentDays: A, paidLeaveDays: L, unpaidLeaveDays: UL, offDays: OFF, unmarkedDays: unmarked,
      otHours: s2(otH), otHourlyRate: s2(otHourly), otPay: s2(otPay), allowances: s2(allowances),
      absenceDeduction: s2(absenceDeduction), advanceDeduction: s2(advanceDeduction), otherDeductions: s2(other),
      gross: s2(gross), net: s2(net), note: k?.note ?? null, warnings,
    };
  });
}

/** Workers eligible for a month: not terminated (or had attendance that month), joined by month end, not already in another run. */
export async function eligibleWorkers(month: string, clientId: string | null) {
  const db = await getDb();
  const { from, to } = monthRange(month);
  const taken = db.select({ id: payrollLines.workerId }).from(payrollLines).where(eq(payrollLines.month, month));
  const rows = await db.select({ id: workers.id }).from(workers).where(and(
    clientId ? eq(workers.clientId, clientId) : undefined,
    or(ne(workers.status, "terminated"), sql`exists (select 1 from ${attendance} a where a.worker_id = ${workers.id} and a.date between ${from} and ${to})`),
    or(sql`${workers.joiningDate} is null`, lte(workers.joiningDate, to)),
    notInArray(workers.id, taken),
  ));
  return rows.map((r) => r.id);
}

type Money = string | number | null | undefined;
export function totals(lines: { gross?: Money; net?: Money; absenceDeduction?: Money; advanceDeduction?: Money; otherDeductions?: Money }[]) {
  let gross = 0, net = 0, deductions = 0;
  for (const l of lines) {
    gross += Number(l.gross ?? 0); net += Number(l.net ?? 0);
    deductions += Number(l.absenceDeduction ?? 0) + Number(l.advanceDeduction ?? 0) + Number(l.otherDeductions ?? 0);
  }
  return { workers: lines.length, gross: s2(gross), net: s2(net), deductions: s2(deductions) };
}

export async function getRun(id: string) {
  const db = await getDb();
  const [run] = await db.select({ r: payrollRuns, clientName: clients.name }).from(payrollRuns).leftJoin(clients, eq(payrollRuns.clientId, clients.id)).where(eq(payrollRuns.id, id));
  if (!run) return null;
  const lines = await db.select().from(payrollLines).where(eq(payrollLines.runId, id)).orderBy(asc(payrollLines.dsNumber));
  return { ...run.r, clientName: run.clientName, lines };
}

// ── WPS Salary Information File (SIF) ──────────────────
/**
 * UAE WPS SIF (CSV, one EDR line per employee + one SCR trailer):
 *  EDR,<person ID 14>,<agent routing code 9>,<IBAN/account>,<pay start YYYY-MM-DD>,<pay end>,<days in period>,<fixed salary>,<variable salary>,<days on leave>
 *  SCR,<employer establishment ID 13>,<employer bank routing code>,<file date YYYY-MM-DD>,<file time HHMM>,<salary month MMYYYY>,<EDR count>,<total salary>,AED,<employer reference>
 * Check the exact template with your bank/exchange house before first use.
 */
export function buildSif(run: { month: string; lines: (typeof payrollLines.$inferSelect)[] }, cfg: PayrollSettings) {
  const { from, to, days } = monthRange(run.month);
  const problems: string[] = [];
  if (!/^\d{13}$/.test(cfg.establishmentId)) problems.push("Employer establishment (MOL) ID must be 13 digits — set it in Settings → Payroll.");
  if (!/^\d{9}$/.test(cfg.employerRoutingCode)) problems.push("Employer bank routing code must be 9 digits — set it in Settings → Payroll.");
  const lines = run.lines.filter((l) => Number(l.net) > 0);
  const edr: string[] = [];
  let total = 0;
  for (const l of lines) {
    const ds = `DS${String(l.dsNumber).padStart(3, "0")}`;
    if (!l.personId || !/^\d{14}$/.test(l.personId)) problems.push(`${ds} ${l.fullName}: person ID must be 14 digits.`);
    if (!l.routingCode || !/^\d{9}$/.test(l.routingCode)) problems.push(`${ds} ${l.fullName}: agent routing code must be 9 digits.`);
    if (!l.iban) problems.push(`${ds} ${l.fullName}: IBAN / salary card number missing.`);
    const fixed = Number(l.basic) - Number(l.absenceDeduction) - Number(l.advanceDeduction) - Number(l.otherDeductions);
    const variable = Number(l.otPay) + Number(l.allowances);
    const net = Number(l.net);
    // keep fixed + variable = net (fixed never negative)
    const fixedOut = Math.max(0, r2(net - variable));
    const variableOut = r2(net - fixedOut);
    void fixed;
    total += net;
    edr.push(["EDR", l.personId ?? "", l.routingCode ?? "", (l.iban ?? "").replace(/\s/g, ""), from, to, days, fixedOut.toFixed(2), variableOut.toFixed(2), l.paidLeaveDays + l.unpaidLeaveDays].join(","));
  }
  const now = new Date();
  const dubai = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
  const pad = (n: number) => String(n).padStart(2, "0");
  const fileDate = `${dubai.getFullYear()}-${pad(dubai.getMonth() + 1)}-${pad(dubai.getDate())}`;
  const fileTime = `${pad(dubai.getHours())}${pad(dubai.getMinutes())}`;
  const salaryMonth = `${run.month.slice(5, 7)}${run.month.slice(0, 4)}`;
  const scr = ["SCR", cfg.establishmentId, cfg.employerRoutingCode, fileDate, fileTime, salaryMonth, edr.length, total.toFixed(2), "AED", `HOLARD ${run.month}`].join(",");
  const name = `${cfg.establishmentId || "0000000000000"}${String(dubai.getFullYear()).slice(2)}${pad(dubai.getMonth() + 1)}${pad(dubai.getDate())}${pad(dubai.getHours())}${pad(dubai.getMinutes())}${pad(dubai.getSeconds())}.SIF`;
  return { content: [...edr, scr].join("\r\n") + "\r\n", name, problems: [...new Set(problems)], count: edr.length, total: total.toFixed(2) };
}

// ── Gratuity (UAE Federal Decree-Law 33/2021) ─────────
/**
 * End-of-service gratuity on BASIC salary:
 *  < 1 year: nothing · first 5 years: 21 days' basic per year · after 5 years: 30 days' basic per year.
 *  Partial years after the first year count pro rata. Unpaid absence days are excluded from service.
 *  Total capped at 2 years' basic salary. Daily wage = basic ÷ 30.
 */
export function gratuity(basic: number, joiningDate: string | null, endDate: string, unpaidDays = 0) {
  if (!joiningDate || !basic) return { years: 0, amount: 0, eligible: false, breakdown: "No joining date or basic salary" };
  const days = Math.max(0, (Date.parse(endDate) - Date.parse(joiningDate)) / 86400_000 + 1 - unpaidDays);
  const years = days / 365;
  if (years < 1) return { years: r2(years), amount: 0, eligible: false, breakdown: "Less than 1 year of service — no gratuity" };
  const daily = basic / 30;
  const first = Math.min(years, 5) * 21 * daily;
  const after = Math.max(0, years - 5) * 30 * daily;
  const cap = basic * 24;
  const amount = Math.min(first + after, cap);
  return {
    years: r2(years), amount: r2(amount), eligible: true,
    breakdown: `${r2(Math.min(years, 5))} yrs × 21 days${years > 5 ? ` + ${r2(years - 5)} yrs × 30 days` : ""} × AED ${r2(daily)}/day${first + after > cap ? " (capped at 2 years' basic)" : ""}`,
  };
}

export const isWeeklyOff = (date: string, off: string) => weekday(date) === off;
