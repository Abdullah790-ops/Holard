import "server-only";
import { and, asc, count, desc, eq, ilike, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { DOC_TYPES, type DocType } from "@/db/schema";

const { workers, clients, sites, workerDocuments } = schema;
export const PAGE_SIZE = 25;

export const DOC_LABEL: Record<DocType, string> = {
  passport: "Passport",
  emirates_id: "Emirates ID",
  visa: "Visa",
  labour_card: "Labour Card",
};

export type WorkerFilters = {
  q?: string; client?: string; site?: string; nationality?: string; job?: string; status?: string;
  expiry?: string; // expired | 7 | 15 | 30 — any document
  page?: number;
};

/** Days until a date (Dubai calendar). Negative = expired. */
export function daysUntil(d: string | null) {
  if (!d) return null;
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }));
  return Math.round((new Date(d).getTime() - today.getTime()) / 86400_000);
}
export function expiryState(d: string | null): "missing" | "expired" | "d7" | "d15" | "d30" | "ok" {
  const n = daysUntil(d);
  if (n === null) return "missing";
  if (n < 0) return "expired";
  if (n <= 7) return "d7";
  if (n <= 15) return "d15";
  if (n <= 30) return "d30";
  return "ok";
}
export const todayDubai = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
export const plusDays = (n: number) => {
  const d = new Date(todayDubai());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function whereFor(f: WorkerFilters) {
  const c: SQL[] = [];
  if (f.q) {
    const q = f.q.trim();
    const ds = /^ds\s*0*(\d+)$/i.exec(q);
    const like = `%${q.replace(/[%_]/g, "")}%`;
    c.push(or(ilike(workers.fullName, like), ilike(workers.phone, like), ...(ds ? [eq(workers.dsNumber, +ds[1])] : []))!);
  }
  if (f.client === "none") c.push(sql`${workers.clientId} is null`);
  else if (f.client) c.push(eq(workers.clientId, f.client));
  if (f.site) c.push(eq(workers.siteId, f.site));
  if (f.nationality) c.push(eq(workers.nationality, f.nationality));
  if (f.job) c.push(eq(workers.jobTitle, f.job));
  if (f.status) c.push(eq(workers.status, f.status as "active"));
  if (f.expiry) {
    const limit = f.expiry === "expired" ? plusDays(-1) : plusDays(Number(f.expiry) || 30);
    c.push(sql`exists (select 1 from ${workerDocuments} d where d.worker_id = ${workers.id} and d.expiry_date is not null and d.expiry_date <= ${limit})`);
  }
  return c.length ? and(...c) : undefined;
}

export async function listWorkers(f: WorkerFilters, opts: { all?: boolean } = {}) {
  const db = await getDb();
  const where = whereFor(f);
  const page = Math.max(1, f.page ?? 1);
  const base = db
    .select({
      id: workers.id, dsNumber: workers.dsNumber, fullName: workers.fullName, nationality: workers.nationality,
      jobTitle: workers.jobTitle, phone: workers.phone, whatsapp: workers.whatsapp, status: workers.status,
      joiningDate: workers.joiningDate, basicSalary: workers.basicSalary, overtimeRate: workers.overtimeRate,
      emergencyName: workers.emergencyName, emergencyPhone: workers.emergencyPhone,
      personId: workers.personId, iban: workers.iban, routingCode: workers.routingCode,
      clientName: clients.name, siteName: sites.name, photoFileId: workers.photoFileId,
      visaExpiry: sql<string | null>`(select d.expiry_date::text from ${workerDocuments} d where d.worker_id = ${workers.id} and d.type = 'visa')`,
      nextExpiry: sql<string | null>`(select min(d.expiry_date)::text from ${workerDocuments} d where d.worker_id = ${workers.id})`,
    })
    .from(workers)
    .leftJoin(clients, eq(workers.clientId, clients.id))
    .leftJoin(sites, eq(workers.siteId, sites.id))
    .where(where)
    .orderBy(asc(workers.dsNumber));
  const rows = opts.all ? await base.limit(10000) : await base.limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  const [{ n }] = await db.select({ n: count() }).from(workers).where(where);
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export async function filterOptions() {
  const db = await getDb();
  const [cl, st, nat, job] = await Promise.all([
    db.select({ id: clients.id, name: clients.name }).from(clients).orderBy(asc(clients.name)),
    db.select({ id: sites.id, name: sites.name, clientId: sites.clientId }).from(sites).orderBy(asc(sites.name)),
    db.selectDistinct({ v: workers.nationality }).from(workers).where(isNotNull(workers.nationality)).orderBy(asc(workers.nationality)),
    db.selectDistinct({ v: workers.jobTitle }).from(workers).where(isNotNull(workers.jobTitle)).orderBy(asc(workers.jobTitle)),
  ]);
  return { clients: cl, sites: st, nationalities: nat.map((r) => r.v!), jobs: job.map((r) => r.v!) };
}

export async function getWorker(id: string) {
  const db = await getDb();
  const [w] = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!w) return null;
  const docs = await db.select().from(workerDocuments).where(eq(workerDocuments.workerId, id));
  const byType = Object.fromEntries(DOC_TYPES.map((t) => [t, docs.find((d) => d.type === t) ?? null])) as Record<DocType, (typeof docs)[number] | null>;
  return { ...w, docs: byType };
}

export async function nextDsNumber(tx?: Awaited<ReturnType<typeof getDb>>) {
  const db = tx ?? (await getDb());
  const [{ m }] = await db.select({ m: sql<number>`coalesce(max(${workers.dsNumber}), 0)` }).from(workers);
  return Number(m) + 1;
}

export async function expiringDocuments(withinDays = 30, limit = 50) {
  const db = await getDb();
  return db
    .select({
      workerId: workers.id, dsNumber: workers.dsNumber, fullName: workers.fullName, clientName: clients.name,
      type: workerDocuments.type, expiryDate: workerDocuments.expiryDate,
    })
    .from(workerDocuments)
    .innerJoin(workers, eq(workerDocuments.workerId, workers.id))
    .leftJoin(clients, eq(workers.clientId, clients.id))
    .where(and(isNotNull(workerDocuments.expiryDate), lte(workerDocuments.expiryDate, plusDays(withinDays)), sql`${workers.status} <> 'terminated'`))
    .orderBy(asc(workerDocuments.expiryDate))
    .limit(limit);
}

export async function recentWorkers(n = 5) {
  const db = await getDb();
  return db.select({ id: workers.id, dsNumber: workers.dsNumber, fullName: workers.fullName, createdAt: workers.createdAt })
    .from(workers).orderBy(desc(workers.createdAt)).limit(n);
}
