"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth";
import { audit } from "../audit";
import { fileFrom } from "../storage";
import { commitImport, validateImport, type ImportReport } from "./import";

export type ImportState = { error?: string; report?: ImportReport; done?: number } | undefined;

export async function importAction(_: ImportState, fd: FormData): Promise<ImportState> {
  const admin = await requireAdmin();
  try {
    const token = String(fd.get("token") ?? "");
    if (token) {
      const n = await commitImport(token);
      await audit(admin.id, "workers.import", "worker", undefined, { count: n });
      revalidatePath("/admin/workers");
      return { done: n };
    }
    const file = fileFrom(fd.get("file"));
    if (!file) return { error: "Choose an Excel file first." };
    return { report: await validateImport(file) };
  } catch (e) {
    if (e instanceof Error && e.name === "FileError") return { error: e.message };
    console.error(e);
    return { error: "Import failed. Nothing was saved — please check the file and try again." };
  }
}
