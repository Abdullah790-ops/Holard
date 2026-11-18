import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { apiUser } from "@/server/auth";
import { invoiceSettings } from "@/server/invoicing";
import { payslipsPdf } from "@/server/pdf";
import { audit } from "@/server/audit";

/** One payslip. Admin: any. Employee: only their own, and only once the payroll is approved. */
export async function GET(_: Request, { params }: { params: Promise<{ lineId: string }> }) {
  const user = await apiUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { lineId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(lineId)) return new NextResponse("Not found", { status: 404 });
  const db = await getDb();
  const [row] = await db.select({ l: schema.payrollLines, status: schema.payrollRuns.status }).from(schema.payrollLines)
    .innerJoin(schema.payrollRuns, eq(schema.payrollLines.runId, schema.payrollRuns.id)).where(eq(schema.payrollLines.id, lineId));
  if (!row) return new NextResponse("Not found", { status: 404 });
  const own = user.role === "employee" && user.workerId === row.l.workerId && row.status !== "draft";
  if (user.role !== "super_admin" && !own) return new NextResponse("Forbidden", { status: 403 });
  const cfg = await invoiceSettings();
  const pdf = await payslipsPdf([row.l], { name: cfg.companyName, address: cfg.companyAddress });
  await audit(user.id, "payslip.download", "payroll_line", lineId);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="payslip-${row.l.month}-DS${String(row.l.dsNumber).padStart(3, "0")}.pdf"`, "Cache-Control": "private, no-store" } });
}
