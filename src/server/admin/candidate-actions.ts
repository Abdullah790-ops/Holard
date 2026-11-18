"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { CANDIDATE_STATUS } from "@/db/schema";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { nextDsNumber } from "./workers";

export async function updateCandidate(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  const notes = String(fd.get("notes") ?? "").slice(0, 4000);
  const db = await getDb();
  const set: Partial<typeof schema.candidates.$inferInsert> = { notes, updatedAt: new Date() };
  if (CANDIDATE_STATUS.includes(status as "new") && status !== "deployed") set.status = status as "new";
  await db.update(schema.candidates).set(set).where(eq(schema.candidates.id, id));
  await audit(admin.id, "candidate.update", "candidate", id, { status: set.status });
  revalidatePath(`/admin/candidates/${id}`);
  revalidatePath("/admin/candidates");
}

/** One click: candidate → worker (DS code assigned, documents and photo carried over). */
export async function convertToWorker(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const db = await getDb();
  const [c] = await db.select().from(schema.candidates).where(eq(schema.candidates.id, id));
  if (!c) redirect("/admin/candidates");
  if (c.workerId) redirect(`/admin/workers/${c.workerId}`);

  let workerId = "";
  for (let attempt = 0; ; attempt++) {
    try {
      const [w] = await db.insert(schema.workers).values({
        dsNumber: await nextDsNumber(), fullName: c.fullName, nationality: c.nationality, jobTitle: c.jobWanted,
        phone: c.phone, whatsapp: c.phone, photoFileId: c.photoFileId, status: "active", candidateId: c.id,
        joiningDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }),
      }).returning({ id: schema.workers.id });
      workerId = w.id;
      break;
    } catch (e) {
      if (attempt >= 3) throw e;
    }
  }
  if (c.passportFileId) await db.insert(schema.workerDocuments).values({ workerId, type: "passport", fileId: c.passportFileId });
  for (const fid of [c.passportFileId, c.photoFileId, c.cvFileId].filter(Boolean) as string[]) {
    await db.update(schema.files).set({ ownerType: "worker", ownerId: workerId }).where(eq(schema.files.id, fid));
  }
  await db.update(schema.candidates).set({ status: "deployed", workerId, updatedAt: new Date() }).where(eq(schema.candidates.id, id));
  await audit(admin.id, "candidate.convert", "candidate", id, { workerId });
  revalidatePath("/admin/candidates");
  redirect(`/admin/workers/${workerId}/edit`);
}
