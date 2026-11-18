import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Calculator } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { todayDubai } from "@/server/attendance";
import { aed, Badge, Card, Empty, fmtDateTime, PageHeader, Table } from "@/components/admin/ui";
import { CreatePayrollForm } from "@/components/admin/MoneyForms";

export const metadata = { title: "Payroll" };
const TONE: Record<string, string> = { draft: "new", approved: "in_progress", paid: "approved" };
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function Payroll() {
  await requireAdmin();
  const db = await getDb();
  const [runs, clients] = await Promise.all([
    db.select({ r: schema.payrollRuns, clientName: schema.clients.name }).from(schema.payrollRuns).leftJoin(schema.clients, eq(schema.payrollRuns.clientId, schema.clients.id)).orderBy(desc(schema.payrollRuns.month), desc(schema.payrollRuns.createdAt)),
    db.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients).orderBy(asc(schema.clients.name)),
  ]);
  const today = todayDubai();
  const last = new Date(`${today.slice(0, 7)}-01T00:00:00Z`); last.setUTCMonth(last.getUTCMonth() - 1);
  return (
    <>
      <PageHeader title="Payroll" sub="Salaries calculated from attendance: basic + overtime − absence − advances. WPS SIF file and payslips." actions={<Link href="/admin/payroll/gratuity" className="btn btn-outline btn-sm"><Calculator className="h-4 w-4" aria-hidden />Gratuity calculator</Link>} />
      <Card title="Run payroll" className="mb-6"><CreatePayrollForm clients={clients} month={last.toISOString().slice(0, 7)} /></Card>
      {runs.length === 0 ? <Empty title="No payroll yet" sub="Choose a month above to calculate the first payroll." /> : (
        <Table head={["Month", "Workers", "Gross (AED)", "Deductions", "Net (AED)", "Status", "Created"]}>
          {runs.map(({ r, clientName }) => (
            <tr key={r.id} className="hover:bg-mist/50">
              <td className="px-4 py-3"><Link href={`/admin/payroll/${r.id}`} className="font-semibold text-navy hover:text-orange">{monthLabel(r.month)}</Link><p className="text-xs text-muted">{clientName ?? "All workers"}</p></td>
              <td className="px-4 py-3 tabular-nums">{r.workers}</td>
              <td className="px-4 py-3 tabular-nums">{aed(r.gross).replace("AED ", "")}</td>
              <td className="px-4 py-3 tabular-nums">{aed(r.deductions).replace("AED ", "")}</td>
              <td className="px-4 py-3 font-semibold tabular-nums">{aed(r.net).replace("AED ", "")}</td>
              <td className="px-4 py-3"><Badge status={TONE[r.status]} label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} /></td>
              <td className="px-4 py-3 text-sm text-muted">{fmtDateTime(r.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
