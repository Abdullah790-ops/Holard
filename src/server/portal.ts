import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Role } from "@/db/schema";
import { dailyRows, todayDubai } from "./attendance";
import { invoiceState } from "./invoicing";
import type { SessionUser } from "./auth";

const { workers, sites, clients, attendance, invoices, announcements, portalRequests, investorDocuments, investorUpdates } = schema;

/** Every client-portal query is filtered by the signed-in user's clientId (never by a value from the browser). */
export function clientScope(user: SessionUser) {
  if (user.role !== "client_admin" || !user.clientId) throw new Error("Not a client user");
  return user.clientId;
}

export async function clientOverview(clientId: string) {
  const db = await getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  const clientSites = await db.select({ id: sites.id, name: sites.name, emirate: sites.emirate }).from(sites).where(and(eq(sites.clientId, clientId), eq(sites.status, "active"))).orderBy(asc(sites.name));
  const { rows, summary } = await dailyRows({ date: todayDubai() }, eq(workers.clientId, clientId));
  const perSite = clientSites.map((s) => {
    const r = rows.filter((x) => x.siteId === s.id);
    return { ...s, total: r.length, P: r.filter((x) => x.a?.status === "P").length, A: r.filter((x) => x.a?.status === "A").length, L: r.filter((x) => x.a?.status === "L").length, unmarked: r.filter((x) => !x.a).length };
  });
  return { client, sites: clientSites, perSite, summary, rows };
}

/** Client view of its workers: no personal documents, phone numbers or salaries. */
export async function clientWorkers(clientId: string, f: { q?: string; site?: string }) {
  const { rows } = await dailyRows({ date: todayDubai(), siteId: f.site }, eq(workers.clientId, clientId));
  const q = f.q?.trim().toLowerCase();
  return rows
    .filter((r) => !q || `ds${String(r.dsNumber).padStart(3, "0")} ${r.fullName}`.toLowerCase().includes(q))
    .map((r) => ({
      workerId: r.workerId, dsNumber: r.dsNumber, fullName: r.fullName, jobTitle: r.jobTitle, siteName: r.siteName, workerStatus: r.workerStatus,
      today: r.a?.status ?? null, checkIn: r.a?.checkInAt ?? null, checkOut: r.a?.checkOutAt ?? null, late: !!r.a?.late, ot: Number(r.a?.overtimeHours) || 0,
    }));
}

export async function clientInvoices(clientId: string) {
  const db = await getDb();
  const rows = await db.select().from(invoices).where(and(eq(invoices.clientId, clientId), ne(invoices.status, "draft"), ne(invoices.status, "void"))).orderBy(desc(invoices.number));
  return rows.map((r) => ({ ...r, state: invoiceState(r) }));
}

const AUDIENCE: Record<Role, string> = { super_admin: "all", employee: "employees", supervisor: "supervisors", client_admin: "clients", investor: "investors" };
export async function announcementsFor(role: Role, limit = 5) {
  const db = await getDb();
  const today = todayDubai();
  return db.select().from(announcements)
    .where(and(eq(announcements.isPublished, true), inArray(announcements.audience, ["all", AUDIENCE[role] as "all"]), or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today))))
    .orderBy(desc(announcements.createdAt)).limit(limit);
}

/** Requests the user may see: client admins → their company's; employees → their own. */
export async function requestsFor(user: SessionUser) {
  const db = await getDb();
  const where = user.role === "client_admin" && user.clientId ? eq(portalRequests.clientId, user.clientId)
    : user.role === "employee" && user.workerId ? eq(portalRequests.workerId, user.workerId)
    : sql`false`;
  return db.select({ r: portalRequests, siteName: sites.name }).from(portalRequests).leftJoin(sites, eq(portalRequests.siteId, sites.id)).where(where).orderBy(desc(portalRequests.createdAt)).limit(50);
}

// ── Investor metrics (business numbers only — no worker personal data) ──
function lastMonths(n: number) {
  const out: string[] = [];
  const d = new Date(`${todayDubai().slice(0, 7)}-01T00:00:00Z`);
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() - i); out.push(x.toISOString().slice(0, 7)); }
  return out;
}

export async function investorMetrics() {
  const db = await getDb();
  const months = lastMonths(12);
  const from = `${months[0]}-01`;
  const [inv, wk, [active], [clientCount], [demo]] = await Promise.all([
    db.select({ month: invoices.month, subtotal: sql<string>`sum(${invoices.subtotal})`, total: sql<string>`sum(${invoices.total})`, paid: sql<string>`sum(${invoices.paidAmount})` })
      .from(invoices).where(and(ne(invoices.status, "draft"), ne(invoices.status, "void"), gte(invoices.month, months[0]))).groupBy(invoices.month),
    db.select({ month: sql<string>`to_char(${attendance.date}, 'YYYY-MM')`, n: sql<number>`count(distinct ${attendance.workerId})::int` })
      .from(attendance).where(and(eq(attendance.status, "P"), gte(attendance.date, from))).groupBy(sql`1`),
    db.select({ n: sql<number>`count(*)::int` }).from(workers).where(eq(workers.status, "active")),
    db.select({ n: sql<number>`count(distinct ${workers.clientId})::int` }).from(workers).where(and(eq(workers.status, "active"), sql`${workers.clientId} is not null`)),
    db.select({ n: sql<number>`count(*)::int` }).from(clients).where(eq(clients.isDemo, true)),
  ]);
  const allInv = await db.select().from(invoices).where(and(ne(invoices.status, "draft"), ne(invoices.status, "void")));
  const paid = allInv.reduce((a, i) => a + Number(i.paidAmount), 0);
  const pending = allInv.reduce((a, i) => a + Math.max(0, Number(i.total) - Number(i.paidAmount)), 0);
  const overdue = allInv.filter((i) => invoiceState(i) === "overdue").reduce((a, i) => a + Number(i.total) - Number(i.paidAmount), 0);
  const revenue = months.map((m) => ({ label: m, value: Number(inv.find((r) => r.month === m)?.subtotal ?? 0) }));
  const workersByMonth = months.map((m) => ({ label: m, value: wk.find((r) => r.month === m)?.n ?? 0 }));
  const lastFull = [...revenue].reverse().find((r) => r.value > 0);
  return { months, revenue, workersByMonth, activeWorkers: active.n, activeClients: clientCount.n, paid, pending, overdue, lastRevenue: lastFull, hasDemo: demo.n > 0 };
}

export async function investorLibrary() {
  const db = await getDb();
  const [docs, updates] = await Promise.all([
    db.select().from(investorDocuments).where(eq(investorDocuments.isVisible, true)).orderBy(desc(investorDocuments.createdAt)),
    db.select().from(investorUpdates).where(eq(investorUpdates.isPublished, true)).orderBy(desc(investorUpdates.month)),
  ]);
  return { docs, updates };
}
