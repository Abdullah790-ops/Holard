import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { todayDubai } from "@/server/attendance";
import { invNo, invoiceState, moneySummary } from "@/server/invoicing";
import { aed, Badge, Card, Empty, fmtDate, PageHeader, Stat, Table } from "@/components/admin/ui";
import { CreateInvoiceForm } from "@/components/admin/MoneyForms";

export const metadata = { title: "Invoices" };
const STATE_TONE: Record<string, string> = { draft: "new", sent: "in_progress", partial: "leave", overdue: "rejected", paid: "approved", void: "inactive" };
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function Invoices({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  await requireAdmin();
  const { state } = await searchParams;
  const db = await getDb();
  const today = todayDubai();
  const [rows, clients, money] = await Promise.all([
    db.select().from(schema.invoices).orderBy(desc(schema.invoices.number)),
    db.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients).where(eq(schema.clients.status, "active")).orderBy(asc(schema.clients.name)),
    moneySummary(today.slice(0, 7)),
  ]);
  const withState = rows.map((r) => ({ ...r, state: invoiceState(r) }));
  const shown = state ? withState.filter((r) => r.state === state) : withState;
  const count = (s: string) => withState.filter((r) => r.state === s).length;
  const last = new Date(`${today.slice(0, 7)}-01T00:00:00Z`); last.setUTCMonth(last.getUTCMonth() - 1);
  const tab = (s: string | undefined, label: string) => (
    <Link key={label} href={s ? `?state=${s}` : "?"} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${(state ?? "") === (s ?? "") ? "bg-navy text-white" : "bg-white text-navy hover:bg-line"}`}>{label} <span className="opacity-60">{s ? count(s) : withState.length}</span></Link>
  );
  return (
    <>
      <PageHeader title="Invoices" sub="Created from attendance: workers × days × rate, site-wise, with the DS-code list attached." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Invoiced this month" value={aed(Math.round(money.invoicedThisMonth))} />
        <Stat label="Paid (this month's invoices)" value={aed(Math.round(money.paidThisMonth))} tone="good" />
        <Stat label="Outstanding" value={aed(Math.round(money.outstanding))} tone="warn" sub={money.dueSoon ? `${money.dueSoon} due in the next 7 days` : undefined} />
        <Stat label="Overdue" value={aed(Math.round(money.overdue))} tone="bad" sub={`${money.overdueCount} invoice${money.overdueCount === 1 ? "" : "s"}`} />
      </div>
      <Card title="New invoice" className="mb-6"><CreateInvoiceForm clients={clients} month={last.toISOString().slice(0, 7)} /></Card>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{tab(undefined, "All")}{tab("draft", "Draft")}{tab("sent", "Sent")}{tab("partial", "Partial")}{tab("overdue", "Overdue")}{tab("paid", "Paid")}{tab("void", "Void")}</div>
      {shown.length === 0 ? <Empty title="No invoices here" sub="Create one from a client's attendance above." /> : (
        <Table head={["Invoice", "Client", "Period", "Issued", "Due", "Total (AED)", "Balance", "Status"]}>
          {shown.map((r) => (
            <tr key={r.id} className="hover:bg-mist/50">
              <td className="px-4 py-3"><Link href={`/admin/invoices/${r.id}`} className="font-mono font-semibold text-navy hover:text-orange">{invNo(r.number)}</Link></td>
              <td className="px-4 py-3 font-semibold">{r.clientName}</td>
              <td className="px-4 py-3">{monthLabel(r.month)}</td>
              <td className="px-4 py-3 text-sm">{fmtDate(r.issueDate)}</td>
              <td className={`px-4 py-3 text-sm ${r.state === "overdue" ? "font-semibold text-red-600" : ""}`}>{fmtDate(r.dueDate)}</td>
              <td className="px-4 py-3 tabular-nums">{Number(r.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 tabular-nums">{r.state === "void" ? "—" : (Number(r.total) - Number(r.paidAmount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3"><Badge status={STATE_TONE[r.state]} label={r.state.charAt(0).toUpperCase() + r.state.slice(1)} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
