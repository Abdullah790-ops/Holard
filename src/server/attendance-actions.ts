"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ATTENDANCE_STATUS, LEAVE_TYPES, type AttendanceStatus } from "@/db/schema";
import { requireUser, type SessionUser } from "./auth";
import { audit } from "./audit";
import { assertFile, fileFrom, IMAGE_MIME, DOC_MIME, saveFile } from "./storage";
import { handle, reader, type FormState } from "./validate";
import { addDays, distanceMeters, dubaiDateTime, isDate, isLate, todayDubai, workerScope } from "./attendance";

const { workers, attendance, sites, shifts, leaveRequests, overtimeRequests, advanceRequests } = schema;

/** Load workers the user may act on (server-side scope check). */
async function workersAllowed(user: SessionUser, ids: string[]) {
  if (!ids.length) return [];
  const scope = workerScope(user);
  if (scope === false) return [];
  const db = await getDb();
  return db.select({ id: workers.id, clientId: workers.clientId, siteId: workers.siteId, shiftId: workers.shiftId })
    .from(workers).where(and(inArray(workers.id, ids), scope));
}

async function shiftFor(shiftId: string | null) {
  const db = await getDb();
  const [s] = shiftId
    ? await db.select().from(shifts).where(eq(shifts.id, shiftId))
    : await db.select().from(shifts).where(eq(shifts.isDefault, true)).limit(1);
  return s ?? null;
}

// ── Worker self check-in / check-out ──────────────────
export async function selfCheckIn(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["employee"]);
    if (!user.workerId) return { error: "Your login is not linked to a worker record. Contact Holard." };
    const db = await getDb();
    const [w] = await db.select().from(workers).where(eq(workers.id, user.workerId));
    if (!w || w.status !== "active") return { error: "You are not active for work today. Contact your supervisor." };
    if (!w.siteId) return { error: "You are not assigned to a site yet. Contact your supervisor." };
    const [site] = await db.select().from(sites).where(eq(sites.id, w.siteId));
    if (site.checkinMode === "supervisor") return { error: "At your site, the supervisor marks attendance." };

    const lat = Number(fd.get("lat")), lng = Number(fd.get("lng")), acc = Number(fd.get("accuracy"));
    const hasGps = Number.isFinite(lat) && Number.isFinite(lng) && fd.get("lat") !== "" && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (!hasGps) return { error: "We need your location to check in. Allow location access and try again." };
    const selfie = fileFrom(fd.get("selfie"));
    if (site.requireSelfie && !selfie) return { error: "A selfie is required at this site." };
    if (selfie) await assertFile(selfie, IMAGE_MIME);

    const today = todayDubai();
    const [existing] = await db.select().from(attendance).where(and(eq(attendance.workerId, w.id), eq(attendance.date, today)));
    if (existing?.checkInAt) return { error: "You already checked in today." };

    const now = new Date();
    const shift = await shiftFor(w.shiftId);
    const dist = site.latitude && site.longitude ? distanceMeters(lat, lng, Number(site.latitude), Number(site.longitude)) : null;
    const outside = dist !== null && dist > site.radiusMeters + Math.min(Number.isFinite(acc) ? acc : 0, 200);
    const selfieFileId = selfie ? await saveFile(selfie, { ownerType: "worker", ownerId: w.id, uploadedBy: user.id, allowed: IMAGE_MIME }) : null;
    const values = {
      workerId: w.id, date: today, status: "P" as const, siteId: site.id, shiftId: shift?.id ?? null,
      checkInAt: now, checkInLat: lat.toFixed(6), checkInLng: lng.toFixed(6), checkInAccuracy: Number.isFinite(acc) ? Math.round(acc) : null,
      distanceMeters: dist, outsideSite: outside, late: isLate(now, shift), selfieFileId, source: "self" as const, markedBy: user.id,
    };
    if (existing) await db.update(attendance).set({ ...values, updatedAt: now }).where(eq(attendance.id, existing.id));
    else await db.insert(attendance).values(values);
    await audit(user.id, "attendance.check_in", "worker", w.id, { distance: dist, outside });
    revalidatePath("/portal");
    return { ok: outside ? `Checked in at ${now.toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })}. Note: you seem to be ${dist} m from the site — your supervisor will review.` : "Checked in. Have a good shift!" };
  });
}

export async function selfCheckOut(): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["employee"]);
    if (!user.workerId) return { error: "Your login is not linked to a worker." };
    const db = await getDb();
    // Night shifts: allow checking out of yesterday's open record.
    const today = todayDubai();
    const [open] = await db.select().from(attendance)
      .where(and(eq(attendance.workerId, user.workerId), inArray(attendance.date, [today, addDays(today, -1)]), sql`${attendance.checkInAt} is not null and ${attendance.checkOutAt} is null`))
      .orderBy(sql`${attendance.date} desc`).limit(1);
    if (!open) return { error: "You have not checked in." };
    const now = new Date();
    const hours = (now.getTime() - open.checkInAt!.getTime()) / 3_600_000;
    if (hours > 20) return { error: "This check-in is too old to close. Ask your supervisor to correct it." };
    await db.update(attendance).set({ checkOutAt: now, workedHours: hours.toFixed(2), updatedAt: now }).where(eq(attendance.id, open.id));
    await audit(user.id, "attendance.check_out", "worker", user.workerId, { hours: hours.toFixed(2) });
    revalidatePath("/portal");
    return { ok: `Checked out. You worked ${hours.toFixed(1)} hours today. Overtime must be requested and approved separately.` };
  });
}

// ── Supervisor / admin bulk marking ───────────────────
export async function bulkMark(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["super_admin", "supervisor"]);
    const date = String(fd.get("date") ?? "");
    if (!isDate(date)) return { error: "Choose a valid date." };
    const today = todayDubai();
    if (date > today) return { error: "You cannot mark attendance for a future date." };
    if (user.role === "supervisor" && date < addDays(today, -2)) return { error: "Supervisors can mark today and the previous 2 days. Ask the admin for older corrections." };

    const entries: { workerId: string; status: AttendanceStatus; ot: number }[] = [];
    for (const [k, v] of fd.entries()) {
      if (!k.startsWith("s_") || typeof v !== "string" || !v) continue;
      const workerId = k.slice(2);
      if (!ATTENDANCE_STATUS.includes(v as AttendanceStatus)) continue;
      const ot = Number(fd.get(`ot_${workerId}`) || 0);
      if (!Number.isFinite(ot) || ot < 0 || ot > 12) return { error: "Overtime must be between 0 and 12 hours." };
      entries.push({ workerId, status: v as AttendanceStatus, ot: v === "P" ? ot : 0 });
    }
    if (!entries.length) return { error: "Nothing to save — choose P, A, L or Off for at least one worker." };
    const allowed = await workersAllowed(user, entries.map((e) => e.workerId));
    const ok = new Map(allowed.map((w) => [w.id, w]));
    if (ok.size !== new Set(entries.map((e) => e.workerId)).size) return { error: "Some workers are outside your sites." };

    const db = await getDb();
    const existing = await db.select().from(attendance).where(and(eq(attendance.date, date), inArray(attendance.workerId, [...ok.keys()])));
    const byWorker = new Map(existing.map((e) => [e.workerId, e]));
    let changed = 0;
    for (const e of entries) {
      const w = ok.get(e.workerId)!;
      const cur = byWorker.get(e.workerId);
      const otStr = e.ot.toFixed(2);
      if (cur && cur.status === e.status && Number(cur.overtimeHours) === e.ot) continue;
      if (cur) {
        await db.update(attendance).set({ status: e.status, overtimeHours: otStr, markedBy: user.id, updatedAt: new Date(), ...(user.role === "super_admin" && cur.source === "self" ? { correctedBy: user.id, correctedAt: new Date(), correctionReason: "Bulk update by admin" } : {}) }).where(eq(attendance.id, cur.id));
      } else {
        await db.insert(attendance).values({ workerId: e.workerId, date, status: e.status, overtimeHours: otStr, siteId: w.siteId, shiftId: w.shiftId, source: user.role === "supervisor" ? "supervisor" : "admin", markedBy: user.id });
      }
      changed++;
    }
    await audit(user.id, "attendance.bulk_mark", "attendance", date, { changed, total: entries.length });
    revalidatePath("/admin/attendance");
    revalidatePath("/portal");
    return { ok: changed ? `Saved ${changed} worker${changed === 1 ? "" : "s"} for ${date}.` : "No changes — everything was already saved." };
  });
}

// ── Admin manual correction ───────────────────────────
export async function correctAttendance(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireUser(["super_admin"]);
    const r = reader(fd);
    const workerId = r.uuid("workerId");
    const date = r.date("date", true);
    const status = r.oneOf("status", ATTENDANCE_STATUS);
    const inT = r.str("checkIn", { max: 5 }), outT = r.str("checkOut", { max: 5 });
    const ot = r.num("overtime", { min: 0, max: 12 }) ?? 0;
    const reason = r.str("reason", { required: true, label: "Reason", max: 300 });
    for (const [k, t] of [["checkIn", inT], ["checkOut", outT]] as const) if (t && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) r.errors[k] = "Use HH:MM (24-hour).";
    if (!workerId) r.errors.workerId = "Missing worker.";
    r.check();
    const db = await getDb();
    const [w] = await db.select({ siteId: workers.siteId, shiftId: workers.shiftId }).from(workers).where(eq(workers.id, workerId!));
    if (!w) return { error: "Worker not found." };
    const checkInAt = inT ? dubaiDateTime(date!, inT) : null;
    let checkOutAt = outT ? dubaiDateTime(date!, outT) : null;
    if (checkInAt && checkOutAt && checkOutAt < checkInAt) checkOutAt = new Date(checkOutAt.getTime() + 86400_000); // past midnight
    const workedHours = checkInAt && checkOutAt ? ((checkOutAt.getTime() - checkInAt.getTime()) / 3_600_000).toFixed(2) : null;
    const [cur] = await db.select().from(attendance).where(and(eq(attendance.workerId, workerId!), eq(attendance.date, date!)));
    const vals = { status, checkInAt, checkOutAt, workedHours, overtimeHours: (status === "P" ? ot : 0).toFixed(2), correctedBy: admin.id, correctedAt: new Date(), correctionReason: reason, updatedAt: new Date() };
    if (cur) await db.update(attendance).set(vals).where(eq(attendance.id, cur.id));
    else await db.insert(attendance).values({ ...vals, workerId: workerId!, date: date!, siteId: w.siteId, shiftId: w.shiftId, source: "admin", markedBy: admin.id });
    await audit(admin.id, "attendance.correct", "worker", workerId!, { date, status, before: cur ? { status: cur.status, ot: cur.overtimeHours } : null, reason });
    revalidatePath("/admin/attendance");
    return { ok: "Attendance corrected." };
  });
}

export async function markUnmarkedAbsent(fd: FormData) {
  const admin = await requireUser(["super_admin"]);
  const date = String(fd.get("date") ?? "");
  const siteId = String(fd.get("siteId") ?? "") || null;
  const clientId = String(fd.get("clientId") ?? "") || null;
  if (!isDate(date) || date > todayDubai()) return;
  const db = await getDb();
  const unmarked = await db.select({ id: workers.id, siteId: workers.siteId, shiftId: workers.shiftId }).from(workers)
    .where(and(eq(workers.status, "active"), sql`${workers.siteId} is not null`, siteId ? eq(workers.siteId, siteId) : undefined, clientId ? eq(workers.clientId, clientId) : undefined,
      sql`not exists (select 1 from ${attendance} a where a.worker_id = ${workers.id} and a.date = ${date})`));
  if (unmarked.length) {
    await db.insert(attendance).values(unmarked.map((w) => ({ workerId: w.id, date, status: "A" as const, siteId: w.siteId, shiftId: w.shiftId, source: "admin" as const, markedBy: admin.id, note: "Not marked — set absent by admin" })));
  }
  await audit(admin.id, "attendance.mark_unmarked_absent", "attendance", date, { count: unmarked.length });
  revalidatePath("/admin/attendance");
}

// ── Requests: leave, overtime, advance ────────────────
type Kind = "leave" | "overtime" | "advance";
const TABLES = { leave: leaveRequests, overtime: overtimeRequests, advance: advanceRequests } as const;
// Only real keys — never inherited ones like "constructor" sent by a crafted request.
const TABLE = new Proxy(TABLES, { get: (t, k) => (typeof k === "string" && Object.hasOwn(t, k) ? t[k as Kind] : undefined) });

/** Workers apply for themselves; supervisors/admins can apply on a worker's behalf. */
async function resolveWorker(user: SessionUser, fd: FormData) {
  if (user.role === "employee") return user.workerId;
  const id = String(fd.get("workerId") ?? "");
  const [w] = await workersAllowed(user, [id]);
  return w?.id ?? null;
}

export async function applyLeave(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["employee", "supervisor", "super_admin"]);
    const workerId = await resolveWorker(user, fd);
    if (!workerId) return { error: "Worker not found or not in your team." };
    const r = reader(fd);
    const type = r.oneOf("type", LEAVE_TYPES);
    const start = r.date("startDate", true), end = r.date("endDate", true);
    const reason = r.str("reason", { max: 500, required: type !== "annual", label: "Reason" });
    const file = fileFrom(fd.get("attachment"));
    if (start && end && end < start) r.errors.endDate = "End date must be on or after the start date.";
    if (start && end && (Date.parse(end) - Date.parse(start)) / 86400_000 > 60) r.errors.endDate = "Maximum 60 days per request.";
    if (start && start < addDays(todayDubai(), -30)) r.errors.startDate = "Start date is too far in the past.";
    r.check();
    if (file) await assertFile(file, DOC_MIME);
    const db = await getDb();
    const [overlap] = await db.select({ id: leaveRequests.id }).from(leaveRequests)
      .where(and(eq(leaveRequests.workerId, workerId), inArray(leaveRequests.status, ["pending", "supervisor_approved", "approved"]), lte(leaveRequests.startDate, end!), gte(leaveRequests.endDate, start!)));
    if (overlap) return { error: "There is already a leave request for these dates." };
    const days = Math.round((Date.parse(end!) - Date.parse(start!)) / 86400_000) + 1;
    const attachmentFileId = file ? await saveFile(file, { ownerType: "worker", ownerId: workerId, uploadedBy: user.id }) : null;
    await db.insert(leaveRequests).values({ workerId, type, startDate: start!, endDate: end!, days, reason, attachmentFileId, createdBy: user.id });
    await audit(user.id, "leave.apply", "worker", workerId, { type, start, end, days });
    revalidatePath("/portal"); revalidatePath("/admin/approvals");
    return { ok: `Leave request sent (${days} day${days === 1 ? "" : "s"}). You'll see the decision here.` };
  });
}

export async function applyOvertime(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["employee", "supervisor", "super_admin"]);
    const workerId = await resolveWorker(user, fd);
    if (!workerId) return { error: "Worker not found or not in your team." };
    const r = reader(fd);
    const date = r.date("date", true);
    const hours = r.num("hours", { required: true, min: 0.5, max: 12 });
    const reason = r.str("reason", { max: 500 });
    if (date && date > todayDubai()) r.errors.date = "Overtime can only be claimed for today or earlier.";
    if (date && date < addDays(todayDubai(), -30)) r.errors.date = "Claims older than 30 days need the admin.";
    r.check();
    const db = await getDb();
    const [dupe] = await db.select({ id: overtimeRequests.id }).from(overtimeRequests)
      .where(and(eq(overtimeRequests.workerId, workerId), eq(overtimeRequests.date, date!), ne(overtimeRequests.status, "rejected"), ne(overtimeRequests.status, "cancelled")));
    if (dupe) return { error: "An overtime request for this date already exists." };
    await db.insert(overtimeRequests).values({ workerId, date: date!, hours: hours!.toFixed(2), reason, createdBy: user.id });
    await audit(user.id, "overtime.apply", "worker", workerId, { date, hours });
    revalidatePath("/portal"); revalidatePath("/admin/approvals");
    return { ok: `Overtime request sent: ${hours} hours on ${date}.` };
  });
}

export async function applyAdvance(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser(["employee", "supervisor", "super_admin"]);
    const workerId = await resolveWorker(user, fd);
    if (!workerId) return { error: "Worker not found or not in your team." };
    const r = reader(fd);
    const amount = r.num("amount", { required: true, min: 50, max: 20000 });
    const months = r.num("repaymentMonths", { int: true, min: 1, max: 12 }) ?? 1;
    const reason = r.str("reason", { required: true, label: "Reason", max: 500 });
    r.check();
    const db = await getDb();
    const [open] = await db.select({ id: advanceRequests.id }).from(advanceRequests)
      .where(and(eq(advanceRequests.workerId, workerId), inArray(advanceRequests.status, ["pending", "supervisor_approved"])));
    if (open) return { error: "You already have an advance request waiting for approval." };
    await db.insert(advanceRequests).values({ workerId, amount: amount!.toFixed(2), repaymentMonths: months, reason, createdBy: user.id });
    await audit(user.id, "advance.apply", "worker", workerId, { amount, months });
    revalidatePath("/portal"); revalidatePath("/admin/approvals");
    return { ok: `Advance request for AED ${amount!.toLocaleString()} sent.` };
  });
}

export async function cancelRequest(fd: FormData) {
  const user = await requireUser(["employee"]);
  const kind = String(fd.get("kind")) as Kind;
  const id = String(fd.get("id") ?? "");
  const t = TABLE[kind];
  if (!t || !user.workerId) return;
  const db = await getDb();
  await db.update(t).set({ status: "cancelled" }).where(and(eq(t.id, id), eq(t.workerId, user.workerId), eq(t.status, "pending")));
  await audit(user.id, `${kind}.cancel`, kind, id);
  revalidatePath("/portal/requests");
}

/** Worker → Supervisor → Admin. Supervisor approval is step 1; admin approval is final (admin may skip step 1). */
export async function decideRequest(fd: FormData) {
  const user = await requireUser(["supervisor", "super_admin"]);
  const kind = String(fd.get("kind")) as Kind;
  const id = String(fd.get("id") ?? "");
  const decision = String(fd.get("decision"));
  const note = String(fd.get("note") ?? "").slice(0, 500) || null;
  const t = TABLE[kind];
  if (!t || !["approve", "reject"].includes(decision)) return;
  const db = await getDb();
  const [req] = await db.select().from(t).where(eq(t.id, id));
  if (!req) return;
  const [w] = await workersAllowed(user, [req.workerId]);
  if (!w) return;
  const now = new Date();

  if (user.role === "supervisor") {
    if (req.status !== "pending") return;
    await db.update(t).set({ status: decision === "approve" ? "supervisor_approved" : "rejected", supervisorId: user.id, supervisorAt: now, supervisorNote: note }).where(eq(t.id, id));
  } else {
    if (!["pending", "supervisor_approved"].includes(req.status)) return;
    await db.update(t).set({ status: decision === "approve" ? "approved" : "rejected", adminId: user.id, adminAt: now, adminNote: note }).where(eq(t.id, id));
    if (decision === "approve") await applyApproved(kind, id, user.id);
  }
  await audit(user.id, `${kind}.${decision}`, kind, id, { by: user.role, note });
  revalidatePath("/admin/approvals"); revalidatePath("/portal/approvals"); revalidatePath("/admin/attendance");
}

/** Side effects of final approval: leave → "L" days; overtime → hours on that day. */
async function applyApproved(kind: Kind, id: string, adminId: string) {
  const db = await getDb();
  if (kind === "leave") {
    const [l] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    const [w] = await db.select({ siteId: workers.siteId, shiftId: workers.shiftId }).from(workers).where(eq(workers.id, l.workerId));
    for (let d = l.startDate; d <= l.endDate; d = addDays(d, 1)) {
      const [cur] = await db.select().from(attendance).where(and(eq(attendance.workerId, l.workerId), eq(attendance.date, d)));
      if (cur?.status === "P") continue; // never overwrite a day actually worked
      if (cur) await db.update(attendance).set({ status: "L", source: "leave", note: `${l.type} leave`, updatedAt: new Date() }).where(eq(attendance.id, cur.id));
      else await db.insert(attendance).values({ workerId: l.workerId, date: d, status: "L", siteId: w?.siteId, shiftId: w?.shiftId, source: "leave", markedBy: adminId, note: `${l.type} leave` });
    }
  } else if (kind === "overtime") {
    const [o] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, id));
    const [cur] = await db.select().from(attendance).where(and(eq(attendance.workerId, o.workerId), eq(attendance.date, o.date)));
    if (cur) await db.update(attendance).set({ overtimeHours: (Number(cur.overtimeHours) + Number(o.hours)).toFixed(2), status: "P", updatedAt: new Date() }).where(eq(attendance.id, cur.id));
    else {
      const [w] = await db.select({ siteId: workers.siteId, shiftId: workers.shiftId }).from(workers).where(eq(workers.id, o.workerId));
      await db.insert(attendance).values({ workerId: o.workerId, date: o.date, status: "P", overtimeHours: o.hours, siteId: w?.siteId, shiftId: w?.shiftId, source: "admin", markedBy: adminId, note: "Created from approved overtime" });
    }
  }
}

export async function approveRequest(fd: FormData) {
  fd.set("decision", "approve");
  return decideRequest(fd);
}
export async function rejectRequest(fd: FormData) {
  fd.set("decision", "reject");
  return decideRequest(fd);
}
