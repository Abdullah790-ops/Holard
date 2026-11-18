import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { RequestStatus } from "@/db/schema";
import type { SessionUser } from "./auth";
import { workerScope } from "./attendance";

const { workers, clients, leaveRequests, overtimeRequests, advanceRequests, users } = schema;
export type Kind = "leave" | "overtime" | "advance";

export type ApprovalItem = {
  kind: Kind; id: string; workerId: string; ds: number; name: string; clientName: string | null;
  status: RequestStatus; createdAt: Date; summary: string; detail: string | null; fileId: string | null;
  supervisorNote: string | null; supervisorName: string | null; adminNote: string | null;
};

/** Requests visible to this user. `open` = waiting for *this* user's decision. */
export async function listApprovals(user: SessionUser, opts: { kind?: Kind; open?: boolean; workerId?: string; limit?: number } = {}) {
  const scope = workerScope(user);
  if (scope === false && user.role !== "employee") return [];
  const db = await getDb();
  const waiting: RequestStatus[] = user.role === "supervisor" ? ["pending"] : ["pending", "supervisor_approved"];
  const workerCond = user.role === "employee" ? eq(workers.id, user.workerId ?? "00000000-0000-0000-0000-000000000000") : scope || undefined;
  const limit = opts.limit ?? 200;
  const out: ApprovalItem[] = [];
  const common = { ds: workers.dsNumber, name: workers.fullName, clientName: clients.name, supervisorName: users.name };

  const mk = (t: typeof leaveRequests | typeof overtimeRequests | typeof advanceRequests) =>
    and(workerCond, opts.open ? inArray(t.status, waiting) : undefined, opts.workerId ? eq(t.workerId, opts.workerId) : undefined);

  if (!opts.kind || opts.kind === "leave") {
    const rows = await db.select({ r: leaveRequests, ...common }).from(leaveRequests)
      .innerJoin(workers, eq(leaveRequests.workerId, workers.id)).leftJoin(clients, eq(workers.clientId, clients.id)).leftJoin(users, eq(leaveRequests.supervisorId, users.id))
      .where(mk(leaveRequests)).orderBy(desc(leaveRequests.createdAt)).limit(limit);
    for (const { r, ...w } of rows) out.push({ kind: "leave", id: r.id, workerId: r.workerId, ...w, status: r.status, createdAt: r.createdAt,
      summary: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} leave · ${r.days} day${r.days === 1 ? "" : "s"} · ${fmt(r.startDate)} → ${fmt(r.endDate)}`,
      detail: r.reason, fileId: r.attachmentFileId, supervisorNote: r.supervisorNote, adminNote: r.adminNote });
  }
  if (!opts.kind || opts.kind === "overtime") {
    const rows = await db.select({ r: overtimeRequests, ...common }).from(overtimeRequests)
      .innerJoin(workers, eq(overtimeRequests.workerId, workers.id)).leftJoin(clients, eq(workers.clientId, clients.id)).leftJoin(users, eq(overtimeRequests.supervisorId, users.id))
      .where(mk(overtimeRequests)).orderBy(desc(overtimeRequests.createdAt)).limit(limit);
    for (const { r, ...w } of rows) out.push({ kind: "overtime", id: r.id, workerId: r.workerId, ...w, status: r.status, createdAt: r.createdAt,
      summary: `Overtime · ${Number(r.hours)} h on ${fmt(r.date)}`, detail: r.reason, fileId: null, supervisorNote: r.supervisorNote, adminNote: r.adminNote });
  }
  if (!opts.kind || opts.kind === "advance") {
    const rows = await db.select({ r: advanceRequests, ...common }).from(advanceRequests)
      .innerJoin(workers, eq(advanceRequests.workerId, workers.id)).leftJoin(clients, eq(workers.clientId, clients.id)).leftJoin(users, eq(advanceRequests.supervisorId, users.id))
      .where(mk(advanceRequests)).orderBy(desc(advanceRequests.createdAt)).limit(limit);
    for (const { r, ...w } of rows) out.push({ kind: "advance", id: r.id, workerId: r.workerId, ...w, status: r.status, createdAt: r.createdAt,
      summary: `Salary advance · AED ${Number(r.amount).toLocaleString()} · repay over ${r.repaymentMonths} month${r.repaymentMonths === 1 ? "" : "s"}`,
      detail: r.reason, fileId: null, supervisorNote: r.supervisorNote, adminNote: r.adminNote });
  }
  return out.sort((a, b) => +b.createdAt - +a.createdAt);
}

export async function openApprovalCount(user: SessionUser) {
  const scope = workerScope(user);
  if (scope === false) return 0;
  const db = await getDb();
  const waiting: RequestStatus[] = user.role === "supervisor" ? ["pending"] : ["pending", "supervisor_approved"];
  let n = 0;
  for (const t of [leaveRequests, overtimeRequests, advanceRequests]) {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(t).innerJoin(workers, eq(t.workerId, workers.id)).where(and(inArray(t.status, waiting), scope));
    n += r.n;
  }
  return n;
}

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
