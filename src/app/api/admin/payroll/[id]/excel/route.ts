import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { apiUser } from "@/server/auth";
import { getRun } from "@/server/payroll";
import { audit } from "@/server/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const run = await getRun((await params).id);
  if (!run) return new NextResponse("Not found", { status: 404 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Payroll ${run.month}`, { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
  const cols: [string, string, number][] = [["DS Code", "ds", 9], ["Name", "fullName", 26], ["Client", "clientName", 18], ["Site", "siteName", 18], ["Basic (earned)", "basic", 12], ["Present", "presentDays", 8], ["Absent", "absentDays", 8], ["Paid leave", "paidLeaveDays", 9], ["Unpaid leave", "unpaidLeaveDays", 10], ["Off", "offDays", 6], ["Not marked", "unmarkedDays", 9], ["OT hours", "otHours", 9], ["OT rate", "otHourlyRate", 9], ["OT pay", "otPay", 10], ["Allowances", "allowances", 10], ["Absence ded.", "absenceDeduction", 11], ["Advance ded.", "advanceDeduction", 11], ["Other ded.", "otherDeductions", 10], ["Gross", "gross", 12], ["Net", "net", 12], ["Person ID", "personId", 16], ["IBAN / card", "iban", 26], ["Routing code", "routingCode", 12], ["Note", "note", 24]];
  ws.columns = cols.map(([header, key, width]) => ({ header, key, width }));
  const num = new Set(["basic", "otHours", "otHourlyRate", "otPay", "allowances", "absenceDeduction", "advanceDeduction", "otherDeductions", "gross", "net"]);
  for (const l of run.lines) {
    const row: Record<string, unknown> = { ...l, ds: `DS${String(l.dsNumber).padStart(3, "0")}` };
    for (const k of num) row[k] = Number(row[k]);
    ws.addRow(row);
  }
  const t = ws.addRow({ fullName: "TOTAL", gross: Number(run.gross), net: Number(run.net) });
  t.font = { bold: true };
  const h = ws.getRow(1);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1931" } };
  for (const k of num) ws.getColumn(k).numFmt = "#,##0.00";
  const buf = await wb.xlsx.writeBuffer();
  await audit(user.id, "payroll.excel_export", "payroll", run.id);
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="holard-payroll-${run.month}${run.clientName ? "-" + run.clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}.xlsx"`, "Cache-Control": "private, no-store" } });
}
