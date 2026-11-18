import { NextResponse } from "next/server";
import { apiUser } from "@/server/auth";
import { buildSif, getRun, payrollSettings } from "@/server/payroll";
import { audit } from "@/server/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const run = await getRun((await params).id);
  if (!run) return new NextResponse("Not found", { status: 404 });
  if (run.status === "draft") return new NextResponse("Approve the payroll before creating the WPS file.", { status: 409 });
  const sif = buildSif(run, await payrollSettings());
  if (sif.problems.length) return new NextResponse(`WPS file not created. Fix these first:\n\n${sif.problems.join("\n")}`, { status: 422, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  await audit(user.id, "payroll.sif_export", "payroll", run.id, { count: sif.count, total: sif.total });
  return new NextResponse(sif.content, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${sif.name}"`, "Cache-Control": "private, no-store" } });
}
