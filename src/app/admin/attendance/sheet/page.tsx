import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { getSetting, isMonth, monthSheet, todayDubai, weekday } from "@/server/attendance";
import { dsCode, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Monthly Attendance Sheet" };
const CELL: Record<string, string> = { P: "text-emerald-700", A: "bg-red-50 text-red-700 font-bold", L: "bg-amber-50 text-amber-800", OFF: "text-gray-400" };

export default async function Sheet({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayDubai();
  const month = isMonth(sp.month) ? sp.month : today.slice(0, 7);
  const db = await getDb();
  const [clients, sites, sheet, att] = await Promise.all([
    db.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients).orderBy(asc(schema.clients.name)),
    db.select({ id: schema.sites.id, name: schema.sites.name, clientId: schema.sites.clientId }).from(schema.sites).where(eq(schema.sites.status, "active")).orderBy(asc(schema.sites.name)),
    monthSheet(month, { clientId: sp.client, siteId: sp.site }, undefined),
    getSetting("attendance"),
  ]);
  const days = Array.from({ length: sheet.days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  const exportQs = new URLSearchParams(Object.entries({ month, client: sp.client, site: sp.site }).filter(([, v]) => v) as [string, string][]);
  const sel = "field !min-h-[44px] !py-2 text-sm";
  const sum = sheet.rows.reduce((a, r) => ({ P: a.P + r.totals.P, A: a.A + r.totals.A, L: a.L + r.totals.L, ot: a.ot + r.totals.ot }), { P: 0, A: 0, L: 0, ot: 0 });
  return (
    <>
      <PageHeader title="Monthly attendance sheet" sub={`${sheet.rows.length} workers · ${sum.P.toLocaleString()} present days · ${sum.A} absent · ${sum.L} leave · ${sum.ot} OT hours`}
        back={{ href: "/admin/attendance", label: "Attendance" }}
        actions={<a href={`/api/admin/attendance/export?${exportQs}`} className="btn btn-primary btn-sm"><Download className="h-4 w-4" aria-hidden />Download Excel</a>} />
      <form className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-4">
        <label htmlFor="month" className="sr-only">Month</label>
        <input id="month" name="month" type="month" defaultValue={month} max={today.slice(0, 7)} className={sel} />
        <select name="client" defaultValue={sp.client ?? ""} className={sel} aria-label="Client"><option value="">All clients</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="site" defaultValue={sp.site ?? ""} className={sel} aria-label="Site"><option value="">All sites</option>{sites.filter((s) => !sp.client || s.clientId === sp.client).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button className="btn btn-navy btn-sm">Show</button>
      </form>
      <p className="mb-3 text-sm text-muted"><strong className="text-emerald-700">P</strong> present · <strong className="text-red-700">A</strong> absent · <strong className="text-amber-700">L</strong> leave · <span className="text-gray-400">Off</span> weekly off · small number = overtime hours · blank = not marked. Weekly off: {att.weeklyOff}.</p>
      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-line bg-white">
        <table className="w-max border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20 bg-navy text-white">
            <tr>
              <th scope="col" className="sticky left-0 z-30 min-w-[220px] bg-navy px-3 py-2 text-left font-semibold">Worker</th>
              {days.map((d) => <th key={d} scope="col" className={`w-9 px-0 py-2 text-center font-semibold ${weekday(d) === att.weeklyOff ? "bg-navy-3" : ""}`}><span className="block">{+d.slice(8)}</span><span className="block text-[9px] font-normal opacity-60">{weekday(d).slice(0, 2)}</span></th>)}
              {["P", "A", "L", "OT"].map((h) => <th key={h} scope="col" className="w-11 bg-orange px-1 py-2 text-center font-bold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((r) => (
              <tr key={r.workerId} className="hover:bg-mist/60">
                <th scope="row" className="sticky left-0 z-10 border-b border-line bg-white px-3 py-1.5 text-left font-normal">
                  <Link href={`/admin/workers/${r.workerId}`} className="font-semibold text-navy hover:text-orange"><span className="mr-1.5 font-mono text-orange">{dsCode(r.dsNumber)}</span>{r.fullName}</Link>
                  <span className="block truncate text-[10px] text-muted">{r.clientName ?? "In pool"}{r.siteName ? ` · ${r.siteName}` : ""}</span>
                </th>
                {r.days.map((d, i) => (
                  <td key={i} className={`border-b border-l border-line/70 text-center ${d ? CELL[d.s] : days[i] > today ? "bg-mist/40" : ""}`}>
                    {d && <span className="font-semibold">{d.s === "OFF" ? "–" : d.s}</span>}{d?.ot ? <sup className="ml-px text-[9px] font-bold text-navy">{d.ot}</sup> : null}
                  </td>
                ))}
                {(["P", "A", "L"] as const).map((k) => <td key={k} className="border-b border-l border-line bg-mist/60 text-center font-bold tabular-nums">{r.totals[k]}</td>)}
                <td className="border-b border-l border-line bg-mist/60 text-center font-bold tabular-nums">{r.totals.ot || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
