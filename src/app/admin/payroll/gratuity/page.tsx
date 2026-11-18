import Link from "next/link";
import { asc, ne } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { isDate, todayDubai } from "@/server/attendance";
import { gratuity } from "@/server/payroll";
import { aed, Card, dsCode, PageHeader, Stat, Table } from "@/components/admin/ui";

export const metadata = { title: "Gratuity" };

export default async function Gratuity({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayDubai();
  const db = await getDb();
  const ws = await db.select({ id: schema.workers.id, ds: schema.workers.dsNumber, name: schema.workers.fullName, basic: schema.workers.basicSalary, join: schema.workers.joiningDate })
    .from(schema.workers).where(ne(schema.workers.status, "terminated")).orderBy(asc(schema.workers.dsNumber));
  const rows = ws.map((w) => ({ ...w, g: gratuity(Number(w.basic) || 0, w.join, today) }));
  const liability = rows.reduce((a, r) => a + r.g.amount, 0);
  const eligible = rows.filter((r) => r.g.eligible).length;
  // calculator
  const basic = Number(sp.basic) || 0;
  const join = isDate(sp.join) ? sp.join : null;
  const end = isDate(sp.end) ? sp.end : today;
  const unpaid = Math.max(0, Number(sp.unpaid) || 0);
  const calc = basic && join ? gratuity(basic, join, end, unpaid) : null;
  const top = [...rows].sort((a, b) => b.g.amount - a.g.amount).slice(0, 15);
  return (
    <>
      <PageHeader title="Gratuity (end of service)" sub="UAE law: 21 days' basic per year for the first 5 years, 30 days per year after; nothing before 1 year; capped at 2 years' basic." back={{ href: "/admin/payroll", label: "Payroll" }} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total gratuity liability today" value={aed(Math.round(liability))} tone="brand" sub="All active workers, if everyone left today" />
        <Stat label="Workers past 1 year" value={eligible} />
        <Stat label="Workers under 1 year" value={rows.length - eligible} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Calculator">
          <form className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="basic" className="field-label">Basic monthly salary (AED)</label><input id="basic" name="basic" type="number" step="0.01" defaultValue={sp.basic} className="field" required /></div>
            <div><label htmlFor="unpaid" className="field-label">Unpaid absence days</label><input id="unpaid" name="unpaid" type="number" defaultValue={sp.unpaid ?? 0} className="field" /></div>
            <div><label htmlFor="join" className="field-label">Joining date</label><input id="join" name="join" type="date" defaultValue={sp.join} className="field" required /></div>
            <div><label htmlFor="end" className="field-label">Last working day</label><input id="end" name="end" type="date" defaultValue={sp.end ?? today} className="field" /></div>
            <div className="sm:col-span-2"><button className="btn btn-primary btn-sm">Calculate</button></div>
          </form>
          {calc && (
            <div className="mt-5 rounded-2xl bg-navy p-6 text-white">
              <p className="text-sm text-white/70">{calc.years} years of service</p>
              <p className="mt-1 font-heading text-4xl font-extrabold">{aed(calc.amount)}</p>
              <p className="mt-2 text-sm text-white/70">{calc.breakdown}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-muted">Estimate only. Final settlement also includes unpaid salary, leave encashment and notice period, and may differ by contract.</p>
        </Card>
        <Card title="Largest balances">
          <Table head={["Worker", "Joined", "Years", "Gratuity"]} minWidth={420}>
            {top.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2"><Link href={`/admin/workers/${r.id}`} className="font-semibold text-navy hover:text-orange"><span className="mr-1 font-mono text-xs text-orange">{dsCode(r.ds)}</span>{r.name}</Link></td>
                <td className="px-4 py-2 text-sm">{r.join ?? "—"}</td>
                <td className="px-4 py-2 tabular-nums">{r.g.years}</td>
                <td className="px-4 py-2 font-semibold tabular-nums">{aed(r.g.amount)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
