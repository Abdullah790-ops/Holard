import { NextResponse } from "next/server";
import { apiUser } from "@/server/auth";
import { getRun } from "@/server/payroll";
import { invoiceSettings } from "@/server/invoicing";
import { payslipsPdf } from "@/server/pdf";
import { audit } from "@/server/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const run = await getRun((await params).id);
  if (!run || !run.lines.length) return new NextResponse("Not found", { status: 404 });
  const cfg = await invoiceSettings();
  const pdf = await payslipsPdf(run.lines, { name: cfg.companyName, address: cfg.companyAddress });
  await audit(user.id, "payroll.payslips_pdf", "payroll", run.id, { count: run.lines.length });
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="payslips-${run.month}${run.status === "draft" ? "-DRAFT" : ""}.pdf"`, "Cache-Control": "private, no-store" } });
}
