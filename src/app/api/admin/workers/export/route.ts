import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { apiUser } from "@/server/auth";
import { listWorkers } from "@/server/admin/workers";
import { audit } from "@/server/audit";

const ds = (n: number) => `DS${String(n).padStart(3, "0")}`;

export async function GET(req: Request) {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { rows } = await listWorkers({ ...sp, page: 1 }, { all: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = "HOLARD";
  const ws = wb.addWorksheet("Workers", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "DS Code", key: "ds", width: 10 }, { header: "Full Name", key: "fullName", width: 28 },
    { header: "Nationality", key: "nationality", width: 14 }, { header: "Job Title", key: "jobTitle", width: 18 },
    { header: "Client", key: "clientName", width: 20 }, { header: "Site", key: "siteName", width: 20 },
    { header: "Phone", key: "phone", width: 16 }, { header: "WhatsApp", key: "whatsapp", width: 16 },
    { header: "Emergency Contact", key: "emergencyName", width: 20 }, { header: "Emergency Phone", key: "emergencyPhone", width: 16 },
    { header: "Joining Date", key: "joiningDate", width: 12 }, { header: "Basic Salary (AED)", key: "basicSalary", width: 14 },
    { header: "Overtime Rate (AED/hr)", key: "overtimeRate", width: 14 }, { header: "Status", key: "status", width: 11 },
    { header: "Visa Expiry", key: "visaExpiry", width: 12 }, { header: "Next Document Expiry", key: "nextExpiry", width: 14 },
    { header: "Person ID", key: "personId", width: 16 }, { header: "IBAN", key: "iban", width: 26 }, { header: "Routing Code", key: "routingCode", width: 12 },
  ];
  for (const r of rows) {
    ws.addRow({ ...r, ds: ds(r.dsNumber), basicSalary: r.basicSalary ? Number(r.basicSalary) : null, overtimeRate: r.overtimeRate ? Number(r.overtimeRate) : null });
  }
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1931" } };
  ws.autoFilter = { from: "A1", to: "S1" };

  const buf = await wb.xlsx.writeBuffer();
  await audit(user.id, "workers.export", "worker", undefined, { count: rows.length, filters: sp });
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="holard-workers-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
