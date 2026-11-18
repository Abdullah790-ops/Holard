"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { handle, reader, type FormState } from "../validate";

const EMIRATES = ["Dubai", "Sharjah", "Abu Dhabi", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"] as const;

export async function saveClient(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const v = {
      name: r.str("name", { required: true, label: "Client name", max: 120 })!,
      short: r.str("short", { max: 4 })?.toUpperCase() ?? null,
      trn: r.str("trn", { max: 20 }),
      industry: r.str("industry", { max: 80 }),
      contactName: r.str("contactName", { max: 120 }),
      contactPhone: r.str("contactPhone", { max: 30 }),
      contactEmail: r.email("contactEmail"),
      address: r.str("address", { max: 300 }),
      contractedHeadcount: r.num("contractedHeadcount", { min: 0, max: 100000, int: true }) ?? 0,
      monthlyRate: r.num("monthlyRate", { min: 0, max: 1_000_000 })?.toFixed(2) ?? null,
      dailyRate: r.num("dailyRate", { min: 0, max: 100_000 })?.toFixed(2) ?? null,
      billingBasis: r.oneOf("billingBasis", ["per_day", "per_month"] as const, "per_day"),
      otRate: r.num("otRate", { min: 0, max: 10_000 })?.toFixed(2) ?? null,
      paymentTermsDays: r.num("paymentTermsDays", { int: true, min: 0, max: 180 }) ?? 30,
      status: r.oneOf("status", ["active", "inactive"] as const, "active"),
    };
    if (v.trn && !/^\d{15}$/.test(v.trn.replace(/\s/g, ""))) r.errors.trn = "UAE TRN is 15 digits.";
    r.check();
    const db = await getDb();
    let clientId = id;
    if (id) await db.update(schema.clients).set({ ...v, updatedAt: new Date() }).where(eq(schema.clients.id, id));
    else clientId = (await db.insert(schema.clients).values(v).returning({ id: schema.clients.id }))[0].id;
    await audit(admin.id, id ? "client.update" : "client.create", "client", clientId!, { name: v.name });
    revalidatePath("/admin/clients");
    if (!id) redirect(`/admin/clients/${clientId}`);
    return { ok: "Client saved." };
  });
}

export async function addSite(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const clientId = r.uuid("clientId");
    const v = {
      name: r.str("name", { required: true, label: "Site name", max: 120 })!,
      emirate: r.oneOf("emirate", EMIRATES, "Dubai"),
      address: r.str("address", { max: 300 }),
      latitude: r.num("latitude", { min: -90, max: 90 })?.toString() ?? null,
      longitude: r.num("longitude", { min: -180, max: 180 })?.toString() ?? null,
    };
    if (!clientId) r.errors.clientId = "Missing client.";
    r.check();
    const db = await getDb();
    const [s] = await db.insert(schema.sites).values({ ...v, clientId: clientId! }).returning({ id: schema.sites.id });
    await audit(admin.id, "site.create", "site", s.id, { name: v.name, clientId });
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: `Site “${v.name}” added.` };
  });
}

export async function removeSite(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const clientId = String(fd.get("clientId") ?? "");
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.workers).where(eq(schema.workers.siteId, id));
  if (n > 0) {
    await db.update(schema.sites).set({ status: "inactive" }).where(and(eq(schema.sites.id, id)));
  } else {
    await db.delete(schema.sites).where(eq(schema.sites.id, id));
  }
  await audit(admin.id, n > 0 ? "site.deactivate" : "site.delete", "site", id);
  revalidatePath(`/admin/clients/${clientId}`);
}
