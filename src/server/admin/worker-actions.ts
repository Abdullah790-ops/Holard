"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { DOC_TYPES, WORKER_STATUS } from "@/db/schema";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { assertFile, fileFrom, IMAGE_MIME, saveFile } from "../storage";
import { handle, reader, type FormState } from "../validate";
import { nextDsNumber } from "./workers";

const { workers, workerDocuments, sites } = schema;

export async function saveWorker(_: FormState, fd: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const r = reader(fd);
    const id = r.uuid("id");
    const v = {
      fullName: r.str("fullName", { required: true, label: "Full name", max: 120 })!,
      nationality: r.str("nationality", { max: 60 }),
      jobTitle: r.str("jobTitle", { max: 80 }),
      clientId: r.uuid("clientId"),
      siteId: r.uuid("siteId"),
      shiftId: r.uuid("shiftId"),
      phone: r.str("phone", { max: 30 }),
      whatsapp: r.str("whatsapp", { max: 30 }),
      emergencyName: r.str("emergencyName", { max: 120 }),
      emergencyPhone: r.str("emergencyPhone", { max: 30 }),
      joiningDate: r.date("joiningDate"),
      basicSalary: r.num("basicSalary", { min: 0, max: 1_000_000 })?.toFixed(2) ?? null,
      overtimeRate: r.num("overtimeRate", { min: 0, max: 10_000 })?.toFixed(2) ?? null,
      personId: r.str("personId", { max: 20 })?.replace(/\D/g, "") || null,
      iban: r.str("iban", { max: 40 })?.replace(/\s/g, "").toUpperCase() || null,
      routingCode: r.str("routingCode", { max: 20 })?.replace(/\D/g, "") || null,
      status: r.oneOf("status", WORKER_STATUS, "active"),
    };
    const docs = DOC_TYPES.map((t) => ({ type: t, number: r.str(`${t}_number`, { max: 40 }), expiryDate: r.date(`${t}_expiry`), file: fileFrom(fd.get(`${t}_file`)) }));
    const photo = fileFrom(fd.get("photo"));
    if (v.personId && v.personId.length !== 14) r.errors.personId = "MOHRE person ID is 14 digits.";
    if (v.routingCode && v.routingCode.length !== 9) r.errors.routingCode = "Routing code is 9 digits.";
    if (v.iban && v.iban.startsWith("AE") && !/^AE\d{21}$/.test(v.iban)) r.errors.iban = "UAE IBAN is AE + 21 digits.";
    r.check();
    if (photo) await assertFile(photo, IMAGE_MIME);
    for (const d of docs) if (d.file) await assertFile(d.file);

    const db = await getDb();
    if (v.siteId) {
      const [s] = await db.select({ clientId: sites.clientId }).from(sites).where(eq(sites.id, v.siteId));
      if (!s || (v.clientId && s.clientId !== v.clientId)) return { error: "That site does not belong to the selected client.", errors: { siteId: "Pick a site of the selected client." } };
      v.clientId ??= s.clientId;
    }

    let workerId = id;
    if (workerId) {
      await db.update(workers).set({ ...v, updatedAt: new Date() }).where(eq(workers.id, workerId));
    } else {
      for (let attempt = 0; ; attempt++) {
        try {
          const [row] = await db.insert(workers).values({ ...v, dsNumber: await nextDsNumber() }).returning({ id: workers.id });
          workerId = row.id;
          break;
        } catch (e) {
          if (attempt >= 3) throw e; // DS number race — retry
        }
      }
    }

    if (photo) {
      const fid = await saveFile(photo, { ownerType: "worker", ownerId: workerId, uploadedBy: admin.id, allowed: IMAGE_MIME });
      await db.update(workers).set({ photoFileId: fid }).where(eq(workers.id, workerId!));
    }
    for (const d of docs) {
      const [existing] = await db.select().from(workerDocuments).where(and(eq(workerDocuments.workerId, workerId!), eq(workerDocuments.type, d.type)));
      const fileId = d.file ? await saveFile(d.file, { ownerType: "worker", ownerId: workerId, uploadedBy: admin.id }) : existing?.fileId ?? null;
      if (!existing && !d.number && !d.expiryDate && !fileId) continue;
      if (existing) {
        await db.update(workerDocuments).set({ number: d.number, expiryDate: d.expiryDate, fileId, updatedAt: new Date() }).where(eq(workerDocuments.id, existing.id));
      } else {
        await db.insert(workerDocuments).values({ workerId: workerId!, type: d.type, number: d.number, expiryDate: d.expiryDate, fileId });
      }
    }
    await audit(admin.id, id ? "worker.update" : "worker.create", "worker", workerId!, { fullName: v.fullName });
    revalidatePath("/admin/workers");
    redirect(`/admin/workers/${workerId}?saved=1`);
  });
}

export async function setWorkerStatus(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!WORKER_STATUS.includes(status as "active")) return;
  const db = await getDb();
  await db.update(workers).set({ status: status as "active", updatedAt: new Date() }).where(eq(workers.id, id));
  await audit(admin.id, "worker.status", "worker", id, { status });
  revalidatePath(`/admin/workers/${id}`);
}
