import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { requireUser } from "@/server/auth";
import { schema } from "@/db";
import { isMonth, monthSheet, todayDubai } from "@/server/attendance";
import { clientScope } from "@/server/portal";

export const metadata = { title: "Attendance Sheet" };
const CELL: Record<string, string> = { P: "text-emerald-700", A: "bg-red-50 text-red-700 font-bold", L: "bg-amber-50 text-amber-800", OFF: "text-gray-400" };

export default async function Sheet({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser(["client_admin"]);
  const clientId = clientScope(user);
  const { month: m } = await searchParams;
  const today = todayDubai();
  const month = isMonth(m) && m <= today.slice(0, 7) ? m : today.slice(0, 7);
  const sheet = await monthSheet(month, {}, eq(schema.workers.clientId, clientId));
  const days = Array.from({ length: sheet.days }, (_, i) => i + 1);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-extrabold text-navy">Monthly attendance sheet</h1><p className="text-sm text-muted">P present · A absent · L leave · – off · small number = overtime hours</p></div>
        <div className="flex gap-2">
          <form className="flex gap-2"><label htmlFor="month" className="sr-only">Month</label><input id="month" name="month" type="month" defaultValue={month} max={today.slice(0, 7)} className="field !min-h-[44px] !py-2 text-sm" /><button className="btn btn-navy btn-sm">Show</button></form>
          <a href={`/api/portal/attendance?month=${month}`} className="btn btn-primary btn-sm"><Download className="h-4 w-4" aria-hidden />Excel</a>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-line bg-white">
        <table className="w-max border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20 bg-navy text-white"><tr><th className="sticky left-0 z-30 min-w-[190px] bg-navy px-3 py-2 text-left">Worker</th>{days.map((d) => <th key={d} className="w-8 py-2 text-center font-semibold">{d}</th>)}{["P", "A", "L", "OT"].map((h) => <th key={h} className="w-10 bg-orange py-2 text-center">{h}</th>)}</tr></thead>
          <tbody>
            {sheet.rows.map((r) => (
              <tr key={r.workerId}>
                <th scope="row" className="sticky left-0 z-10 border-b border-line bg-white px-3 py-1.5 text-left font-normal"><span className="mr-1 font-mono text-orange">DS{String(r.dsNumber).padStart(3, "0")}</span><span className="font-semibold text-navy">{r.fullName}</span><span className="block text-[10px] text-muted">{r.siteName}</span></th>
                {r.days.map((d, i) => <td key={i} className={`border-b border-l border-line/70 text-center ${d ? CELL[d.s] : ""}`}>{d && (d.s === "OFF" ? "–" : d.s)}{d?.ot ? <sup className="text-[9px] font-bold text-navy">{d.ot}</sup> : null}</td>)}
                {(["P", "A", "L"] as const).map((k) => <td key={k} className="border-b border-l border-line bg-mist/60 text-center font-bold">{r.totals[k]}</td>)}
                <td className="border-b border-l border-line bg-mist/60 text-center font-bold">{r.totals.ot || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
