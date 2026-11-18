import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { apiUser } from "@/server/auth";
import { readStoredFile } from "@/server/storage";
import { audit } from "@/server/audit";

// Private files are never public: every download checks the user's role and ownership.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const db = await getDb();
  const [f] = await db.select().from(schema.files).where(eq(schema.files.id, id)).limit(1);
  if (!f) return new NextResponse("Not found", { status: 404 });

  let allowed =
    user.role === "super_admin" ||
    (user.role === "employee" && f.ownerType === "worker" && !!user.workerId && f.ownerId === user.workerId);
  if (!allowed && user.role === "investor" && f.ownerType === "investor_doc" && f.ownerId) {
    const [doc] = await db.select({ visible: schema.investorDocuments.isVisible }).from(schema.investorDocuments).where(eq(schema.investorDocuments.id, f.ownerId));
    allowed = !!doc?.visible; // investors only see documents the admin made visible
  }
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const buf = await readStoredFile(f.storageKey);
  if (f.ownerType !== "worker" || f.mime !== "image/jpeg") await audit(user.id, "file.download", "file", f.id, { ownerType: f.ownerType });
  const inline = f.mime === "application/pdf" || f.mime.startsWith("image/");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${f.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
