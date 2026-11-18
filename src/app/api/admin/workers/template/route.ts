import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { apiUser } from "@/server/auth";
import { IMPORT_COLUMNS } from "@/server/admin/import";

export async function GET() {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Workers", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = IMPORT_COLUMNS.map((c) => ({ header: c.header + ("required" in c && c.required ? " *" : ""), key: c.key, width: Math.max(14, c.header.length + 4) }));
  ws.addRow({
    fullName: "John Mwangi", nationality: "Kenya", jobTitle: "Warehouse Helper", client: "Al Wafiq", site: "Noon Warehouse",
    phone: "+971501234567", whatsapp: "+971501234567", emergencyName: "Mary Mwangi", emergencyPhone: "+254700000000",
    joiningDate: "2026-01-15", basicSalary: 1600, overtimeRate: 8, status: "active",
    passportNo: "AK1234567", passportExpiry: "2030-05-01", emiratesIdNo: "784-1990-1234567-1", emiratesIdExpiry: "2027-03-10",
    visaNo: "201/2026/1234567", visaExpiry: "2027-03-10", labourCardNo: "12345678", labourCardExpiry: "2027-03-10",
  });
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1931" } };
  ws.getRow(2).font = { italic: true, color: { argb: "FF6B7280" } };
  const help = wb.addWorksheet("Instructions");
  [
    "HOLARD worker import — instructions",
    "• One worker per row. Delete the example row (row 2) before uploading, or it will be imported.",
    "• Columns marked * are required. Dates: YYYY-MM-DD (e.g. 2027-03-10) or Excel date cells.",
    "• Client and Site must match names already created in Clients & Sites (not case-sensitive).",
    "• Status: active, leave or terminated (defaults to active).",
    "• DS codes are assigned automatically. Up to 2,000 rows per file.",
  ].forEach((t, i) => { help.getCell(`A${i + 1}`).value = t; if (i === 0) help.getCell("A1").font = { bold: true, size: 14 }; });
  help.getColumn(1).width = 100;
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="holard-worker-import-template.xlsx"`,
    },
  });
}
