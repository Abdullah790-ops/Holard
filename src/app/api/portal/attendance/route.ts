import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { apiUser } from "@/server/auth";
import { schema } from "@/db";
import { isMonth, monthSheet, todayDubai, weekday } from "@/server/attendance";
import { audit } from "@/server/audit";

/** Client portal: monthly attendance sheet for the client's own workers only. */
export async function GET(req: Request) {
  const user = await apiUser();
  if (user?.role !== "client_admin" || !user.clientId) return new NextResponse("Forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const month = isMonth(sp.get("month")) ? sp.get("month")! : todayDubai().slice(0, 7);
  const sheet = await monthSheet(month, {}, eq(schema.workers.clientId, user.clientId));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(month, { views: [{ state: "frozen", xSplit: 3, ySplit: 2 }] });
  const header = ["DS Code", "Name", "Site", ...Array.from({ length: sheet.days }, (_, i) => String(i + 1)), "Present", "Absent", "Leave", "Off", "OT Hours"];
  ws.addRow(["", "", "", ...Array.from({ length: sheet.days }, (_, i) => weekday(`${month}-${String(i + 1).padStart(2, "0")}`).slice(0, 2))]);
  const h = ws.addRow(header);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1931" } }; });
  for (const r of sheet.rows) ws.addRow([`DS${String(r.dsNumber).padStart(3, "0")}`, r.fullName, r.siteName ?? "", ...r.days.map((d) => (d ? (d.ot ? `${d.s}+${d.ot}` : d.s) : "")), r.totals.P, r.totals.A, r.totals.L, r.totals.OFF, r.totals.ot]);
  ws.getColumn(2).width = 26; ws.getColumn(3).width = 18;
  for (let i = 0; i < sheet.days; i++) ws.getColumn(4 + i).width = 5;
  const buf = await wb.xlsx.writeBuffer();
  await audit(user.id, "portal.attendance_export", "attendance", month);
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="attendance-${month}.xlsx"`, "Cache-Control": "private, no-store" } });
}
