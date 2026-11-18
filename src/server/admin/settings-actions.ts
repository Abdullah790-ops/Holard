"use server";

import { revalidatePath } from "next/cache";
import { count, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { handle, reader, type FormState } from "../validate";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export async function saveShift(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const name = r.str("name", { required: true, label: "Shift name", max: 40 })!;
    const startTime = r.str("startTime", { required: true, label: "Start" })!;
    const endTime = r.str("endTime", { required: true, label: "End" })!;
    const standardHours = r.num("standardHours", { required: true, min: 1, max: 14 });
    const graceMinutes = r.num("graceMinutes", { int: true, min: 0, max: 120 }) ?? 15;
    const isDefault = fd.get("isDefault") === "on";
    if (startTime && !TIME.test(startTime)) r.errors.startTime = "Use HH:MM (24-hour).";
    if (endTime && !TIME.test(endTime)) r.errors.endTime = "Use HH:MM (24-hour).";
    r.check();
    const db = await getDb();
    if (isDefault) await db.update(schema.shifts).set({ isDefault: false });
    const v = { name, startTime, endTime, standardHours: standardHours!.toFixed(2), graceMinutes, ...(isDefault ? { isDefault } : {}) };
    if (id) await db.update(schema.shifts).set(v).where(eq(schema.shifts.id, id));
    else await db.insert(schema.shifts).values(v);
    await audit(admin.id, id ? "shift.update" : "shift.create", "shift", id ?? undefined, v);
    revalidatePath("/admin/settings");
    return { ok: "Shift saved." };
  });
}

export async function deleteShift(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.workers).where(eq(schema.workers.shiftId, id));
  const [s] = await db.select({ isDefault: schema.shifts.isDefault }).from(schema.shifts).where(eq(schema.shifts.id, id));
  if (!s || s.isDefault || n > 0) return; // keep the default and shifts in use
  await db.delete(schema.shifts).where(eq(schema.shifts.id, id));
  await audit(admin.id, "shift.delete", "shift", id);
  revalidatePath("/admin/settings");
}

export async function saveGeneralSettings(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const weeklyOff = r.oneOf("weeklyOff", DAYS, "Friday");
    const annualDays = r.num("annualDays", { required: true, int: true, min: 0, max: 60 });
    const normalMultiplier = r.num("normalMultiplier", { required: true, min: 1, max: 3 });
    const nightMultiplier = r.num("nightMultiplier", { required: true, min: 1, max: 3 });
    r.check();
    const db = await getDb();
    const upsert = (key: string, value: unknown) =>
      db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
    await upsert("attendance", { weeklyOff, checkoutReminderHours: 12 });
    await upsert("leave", { annualDays });
    await upsert("overtime", { normalMultiplier, nightMultiplier });
    await audit(admin.id, "settings.update", "settings", undefined, { weeklyOff, annualDays, normalMultiplier, nightMultiplier });
    revalidatePath("/admin/settings");
    return { ok: "Settings saved." };
  });
}

export async function saveSiteCheckin(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const checkinMode = r.oneOf("checkinMode", ["both", "self", "supervisor"] as const, "both");
    const radiusMeters = r.num("radiusMeters", { int: true, min: 50, max: 5000 }) ?? 300;
    const latitude = r.num("latitude", { min: -90, max: 90 });
    const longitude = r.num("longitude", { min: -180, max: 180 });
    if ((latitude === null) !== (longitude === null)) r.errors.longitude = "Enter both latitude and longitude, or neither.";
    r.check();
    const db = await getDb();
    const [site] = await db.update(schema.sites).set({
      checkinMode, radiusMeters, requireSelfie: fd.get("requireSelfie") === "on",
      latitude: latitude?.toString() ?? null, longitude: longitude?.toString() ?? null,
    }).where(eq(schema.sites.id, id!)).returning({ clientId: schema.sites.clientId });
    await audit(admin.id, "site.checkin_settings", "site", id!, { checkinMode, radiusMeters });
    if (site) revalidatePath(`/admin/clients/${site.clientId}`);
    return { ok: "Check-in settings saved." };
  });
}

/** Assign a shift to many workers at once (e.g. a whole site moves to night shift). */
export async function assignShift(fd: FormData) {
  const admin = await requireAdmin();
  const shiftId = String(fd.get("shiftId") ?? "");
  const siteId = String(fd.get("siteId") ?? "");
  if (!siteId) return;
  const db = await getDb();
  await db.update(schema.workers).set({ shiftId: shiftId || null }).where(sql`${schema.workers.siteId} = ${siteId}`);
  await audit(admin.id, "shift.assign_site", "site", siteId, { shiftId });
  revalidatePath("/admin/settings");
}
