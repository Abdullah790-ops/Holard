import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { apiUser } from "@/server/auth";
import { getDb, schema } from "@/db";
import { getSetting, isMonth, monthSheet, todayDubai, weekday } from "@/server/attendance";
import { audit } from "@/server/audit";

const FILL: Record<string, string> = { A: "FFFEE2E2", L: "FFFEF3C7", OFF: "FFF3F4F6" };

export async function GET(req: Request) {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const month = isMonth(sp.month) ? sp.month : todayDubai().slice(0, 7);
  const sheet = await monthSheet(month, { clientId: sp.client, siteId: sp.site }, undefined);
  const att = await getSetting("attendance");
  const db = await getDb();
  const [client] = sp.client ? await db.select({ name: schema.clients.name, trn: schema.clients.trn }).from(schema.clients).where(eq(schema.clients.id, sp.client)) : [];
  const label = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  const wb = new ExcelJS.Workbook();
  wb.creator = "HOLARD";
  const ws = wb.addWorksheet(label, { views: [{ state: "frozen", xSplit: 4, ySplit: 4 }], pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 } });
  ws.getCell("A1").value = `HOLARD — Attendance Sheet — ${label}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF0A1931" } };
  ws.getCell("A2").value = `${client ? `Client: ${client.name}${client.trn ? ` (TRN ${client.trn})` : ""}` : "All clients"} · P = Present, A = Absent, L = Leave, OFF = Weekly off (${att.weeklyOff}), +n = overtime hours`;
  ws.getCell("A2").font = { italic: true, color: { argb: "FF4B5563" } };
  const header = ["DS Code", "Name", "Client", "Site", ...Array.from({ length: sheet.days }, (_, i) => String(i + 1)), "Present", "Absent", "Leave", "Off", "OT Hours"];
  const hr = ws.getRow(4);
  hr.values = header;
  hr.font = { bold: true, color: { argb: "FFFFFFFF" } };
  hr.alignment = { horizontal: "center" };
  header.forEach((_, i) => { hr.getCell(i + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i >= 4 + sheet.days ? "FFFF6B00" : "FF0A1931" } }; });
  const dayRow = ws.getRow(3);
  for (let i = 0; i < sheet.days; i++) dayRow.getCell(5 + i).value = weekday(`${month}-${String(i + 1).padStart(2, "0")}`).slice(0, 2);
  dayRow.font = { size: 8, color: { argb: "FF6B7280" } };
  dayRow.alignment = { horizontal: "center" };

  for (const r of sheet.rows) {
    const row = ws.addRow([`DS${String(r.dsNumber).padStart(3, "0")}`, r.fullName, r.clientName ?? "", r.siteName ?? "",
      ...r.days.map((d) => (d ? (d.ot ? `${d.s}+${d.ot}` : d.s) : "")), r.totals.P, r.totals.A, r.totals.L, r.totals.OFF, r.totals.ot]);
    r.days.forEach((d, i) => {
      const c = row.getCell(5 + i);
      c.alignment = { horizontal: "center" };
      if (d && FILL[d.s]) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL[d.s] } };
    });
  }
  const totalRow = ws.addRow(["", "TOTAL", "", "", ...Array.from({ length: sheet.days }, () => ""),
    ...(["P", "A", "L", "OFF", "ot"] as const).map((k) => sheet.rows.reduce((a, r) => a + r.totals[k], 0))]);
  totalRow.font = { bold: true };
  ws.getColumn(1).width = 9; ws.getColumn(2).width = 26; ws.getColumn(3).width = 18; ws.getColumn(4).width = 18;
  for (let i = 0; i < sheet.days; i++) ws.getColumn(5 + i).width = 5.5;
  for (let i = 0; i < 5; i++) ws.getColumn(5 + sheet.days + i).width = 9;

  const buf = await wb.xlsx.writeBuffer();
  await audit(user.id, "attendance.export", "attendance", month, { client: sp.client, site: sp.site, rows: sheet.rows.length });
  const name = `holard-attendance-${month}${client ? `-${client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}.xlsx`;
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" },
  });
}
