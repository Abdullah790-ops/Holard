import "server-only";
import { and, asc, between, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AttendanceStatus } from "@/db/schema";
import type { SessionUser } from "./auth";

const { workers, attendance, sites, clients, shifts, settings, leaveRequests } = schema;
export const TZ = "Asia/Dubai";

// ── Time helpers (everything is Dubai time) ────────────
export const todayDubai = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const isMonth = (s: unknown): s is string => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export const daysInMonth = (month: string) => new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
export const weekday = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
/** Minutes since midnight for an instant, in Dubai time. */
export function dubaiMinutes(d: Date) {
  const [h, m] = d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).split(":").map(Number);
  return h * 60 + m;
}
export const hhmm = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }) : "—");
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
/** "2026-11-10" + "07:45" (Dubai) → Date */
export const dubaiDateTime = (date: string, time: string) => new Date(`${date}T${time}:00+04:00`);

/** Distance in metres between two GPS points (haversine). */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function isLate(checkIn: Date, shift: { startTime: string; graceMinutes: number } | null) {
  if (!shift) return false;
  const mins = dubaiMinutes(checkIn);
  const start = toMin(shift.startTime);
  let diff = mins - start;
  if (diff < -12 * 60) diff += 24 * 60; // night shift crossing midnight
  return diff > shift.graceMinutes;
}

// ── Settings ───────────────────────────────────────────
export type AttendanceSettings = { weeklyOff: string; checkoutReminderHours: number };
export type LeaveSettings = { annualDays: number };
export type OvertimeSettings = { normalMultiplier: number; nightMultiplier: number };
const DEFAULTS = {
  attendance: { weeklyOff: "Friday", checkoutReminderHours: 12 } as AttendanceSettings,
  leave: { annualDays: 30 } as LeaveSettings,
  overtime: { normalMultiplier: 1.25, nightMultiplier: 1.5 } as OvertimeSettings,
};
export async function getSetting<K extends keyof typeof DEFAULTS>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return { ...DEFAULTS[key], ...((row?.value as object) ?? {}) };
}

export async function listShifts() {
  const db = await getDb();
  return db.select().from(shifts).orderBy(sql`${shifts.isDefault} desc`, asc(shifts.startTime));
}

// ── Scope: who can see / mark which workers ───────────
/** Worker filter for the signed-in user. Admin: all. Supervisor: own client (and site if set). Others: none. */
export function workerScope(user: SessionUser): SQL | undefined | false {
  if (user.role === "super_admin") return undefined;
  if (user.role === "supervisor" && user.clientId) {
    return user.siteId ? and(eq(workers.clientId, user.clientId), eq(workers.siteId, user.siteId)) : eq(workers.clientId, user.clientId);
  }
  return false;
}

export async function sitesInScope(user: SessionUser) {
  const db = await getDb();
  const base = db.select({ id: sites.id, name: sites.name, clientId: sites.clientId, clientName: clients.name, checkinMode: sites.checkinMode })
    .from(sites).innerJoin(clients, eq(sites.clientId, clients.id));
  if (user.role === "super_admin") return base.where(eq(sites.status, "active")).orderBy(asc(clients.name), asc(sites.name));
  if (user.role === "supervisor" && user.clientId) {
    return base.where(and(eq(sites.status, "active"), eq(sites.clientId, user.clientId), user.siteId ? eq(sites.id, user.siteId) : undefined)).orderBy(asc(sites.name));
  }
  return [];
}

// ── Daily list (bulk marking + admin daily view) ──────
export type DayFilters = { date: string; clientId?: string; siteId?: string; status?: string };

export async function dailyRows(f: DayFilters, scope: SQL | undefined) {
  const db = await getDb();
  const conds: SQL[] = [ne(workers.status, "terminated")];
  if (scope) conds.push(scope);
  if (f.clientId) conds.push(eq(workers.clientId, f.clientId));
  if (f.siteId) conds.push(eq(workers.siteId, f.siteId));
  const rows = await db.select({
    workerId: workers.id, dsNumber: workers.dsNumber, fullName: workers.fullName, jobTitle: workers.jobTitle,
    workerStatus: workers.status, clientName: clients.name, siteName: sites.name, siteId: workers.siteId,
    a: attendance,
  }).from(workers)
    .leftJoin(attendance, and(eq(attendance.workerId, workers.id), eq(attendance.date, f.date)))
    .leftJoin(clients, eq(workers.clientId, clients.id))
    .leftJoin(sites, eq(workers.siteId, sites.id))
    .where(and(...conds))
    .orderBy(asc(clients.name), asc(sites.name), asc(workers.dsNumber));
  const filtered = f.status === "unmarked" ? rows.filter((r) => !r.a) : f.status ? rows.filter((r) => r.a?.status === f.status || (f.status === "late" && r.a?.late) || (f.status === "outside" && r.a?.outsideSite)) : rows;
  const summary = { total: rows.length, P: 0, A: 0, L: 0, OFF: 0, unmarked: 0, late: 0, outside: 0, ot: 0 };
  for (const r of rows) {
    if (!r.a) summary.unmarked++;
    else {
      summary[r.a.status]++;
      if (r.a.late) summary.late++;
      if (r.a.outsideSite) summary.outside++;
      summary.ot += Number(r.a.overtimeHours) || 0;
    }
  }
  return { rows: filtered, summary };
}

// ── Monthly sheet ──────────────────────────────────────
export type SheetRow = {
  workerId: string; dsNumber: number; fullName: string; jobTitle: string | null; clientName: string | null; siteName: string | null;
  days: (null | { s: AttendanceStatus; ot: number })[];
  totals: { P: number; A: number; L: number; OFF: number; ot: number; unmarked: number };
};

export async function monthSheet(month: string, f: { clientId?: string; siteId?: string }, scope: SQL | undefined) {
  const db = await getDb();
  const n = daysInMonth(month);
  const from = `${month}-01`, to = `${month}-${String(n).padStart(2, "0")}`;
  const conds: SQL[] = [];
  if (scope) conds.push(scope);
  if (f.clientId) conds.push(eq(workers.clientId, f.clientId));
  if (f.siteId) conds.push(eq(workers.siteId, f.siteId));
  // Include workers with any attendance in the month, plus currently active/leave workers in scope.
  conds.push(sql`(${workers.status} <> 'terminated' or exists (select 1 from ${attendance} x where x.worker_id = ${workers.id} and x.date between ${from} and ${to}))`);
  const ws = await db.select({ id: workers.id, dsNumber: workers.dsNumber, fullName: workers.fullName, jobTitle: workers.jobTitle, clientName: clients.name, siteName: sites.name })
    .from(workers).leftJoin(clients, eq(workers.clientId, clients.id)).leftJoin(sites, eq(workers.siteId, sites.id))
    .where(and(...conds)).orderBy(asc(clients.name), asc(sites.name), asc(workers.dsNumber));
  const ids = ws.map((w) => w.id);
  const recs = ids.length
    ? await db.select({ workerId: attendance.workerId, date: attendance.date, status: attendance.status, ot: attendance.overtimeHours })
      .from(attendance).where(and(inArray(attendance.workerId, ids), between(attendance.date, from, to)))
    : [];
  const byWorker = new Map<string, typeof recs>();
  for (const r of recs) (byWorker.get(r.workerId) ?? byWorker.set(r.workerId, []).get(r.workerId)!).push(r);
  const today = todayDubai();
  const rows: SheetRow[] = ws.map((w) => {
    const days: SheetRow["days"] = Array.from({ length: n }, () => null);
    const totals = { P: 0, A: 0, L: 0, OFF: 0, ot: 0, unmarked: 0 };
    for (const r of byWorker.get(w.id) ?? []) {
      const d = Number(r.date.slice(8, 10)) - 1;
      const ot = Number(r.ot) || 0;
      days[d] = { s: r.status, ot };
      totals[r.status]++;
      totals.ot += ot;
    }
    days.forEach((d, i) => { if (!d && `${month}-${String(i + 1).padStart(2, "0")}` <= today) totals.unmarked++; });
    return { workerId: w.id, dsNumber: w.dsNumber, fullName: w.fullName, jobTitle: w.jobTitle, clientName: w.clientName, siteName: w.siteName, days, totals };
  });
  return { rows, days: n, from, to };
}

// ── Leave balance (UAE Labour Law) ─────────────────────
/** < 6 months: 0 · 6–12 months: 2 days per month of service · 1 year+: annual days (default 30). */
export async function leaveBalance(workerId: string) {
  const db = await getDb();
  const [w] = await db.select({ joiningDate: workers.joiningDate }).from(workers).where(eq(workers.id, workerId));
  const { annualDays } = await getSetting("leave");
  const today = todayDubai();
  const months = w?.joiningDate ? Math.max(0, (Date.parse(today) - Date.parse(w.joiningDate)) / (30.44 * 86400_000)) : 0;
  const entitlement = months < 6 ? 0 : months < 12 ? Math.floor(months) * 2 : annualDays;
  const year = today.slice(0, 4);
  const used = await db.select({ type: leaveRequests.type, days: sql<number>`coalesce(sum(${leaveRequests.days}),0)::int` })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.workerId, workerId), eq(leaveRequests.status, "approved"), sql`extract(year from ${leaveRequests.startDate})::text = ${year}`))
    .groupBy(leaveRequests.type);
  const by = Object.fromEntries(used.map((u) => [u.type, u.days])) as Record<string, number>;
  const pendingRows = await db.select({ days: sql<number>`coalesce(sum(${leaveRequests.days}),0)::int` }).from(leaveRequests)
    .where(and(eq(leaveRequests.workerId, workerId), eq(leaveRequests.type, "annual"), inArray(leaveRequests.status, ["pending", "supervisor_approved"])));
  return {
    entitlement, usedAnnual: by.annual ?? 0, usedSick: by.sick ?? 0, usedEmergency: by.emergency ?? 0, usedUnpaid: by.unpaid ?? 0,
    pendingAnnual: pendingRows[0]?.days ?? 0, balance: Math.max(0, entitlement - (by.annual ?? 0)), serviceMonths: Math.floor(months),
  };
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = { P: "Present", A: "Absent", L: "Leave", OFF: "Off" };

/** One worker's month as calendar cells. */
export async function workerMonth(workerId: string, month: string) {
  const db = await getDb();
  const n = daysInMonth(month);
  const recs = await db.select({ date: attendance.date, status: attendance.status, ot: attendance.overtimeHours })
    .from(attendance).where(and(eq(attendance.workerId, workerId), between(attendance.date, `${month}-01`, `${month}-${String(n).padStart(2, "0")}`)));
  const days: ({ s: AttendanceStatus; ot: number } | null)[] = Array.from({ length: n }, () => null);
  for (const r of recs) days[Number(r.date.slice(8, 10)) - 1] = { s: r.status, ot: Number(r.ot) || 0 };
  return days;
}
