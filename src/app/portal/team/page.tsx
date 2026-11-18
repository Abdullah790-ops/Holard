import { Search } from "lucide-react";
import { requireUser } from "@/server/auth";
import { hhmm } from "@/server/attendance";
import { clientOverview, clientScope, clientWorkers } from "@/server/portal";

export const metadata = { title: "Our Workers" };
const TODAY: Record<string, [string, string]> = { P: ["Present", "bg-emerald-50 text-emerald-700"], A: ["Absent", "bg-red-50 text-red-700"], L: ["Leave", "bg-amber-50 text-amber-800"], OFF: ["Off", "bg-gray-100 text-gray-600"] };

export default async function Team({ searchParams }: { searchParams: Promise<{ q?: string; site?: string }> }) {
  const user = await requireUser(["client_admin"]);
  const clientId = clientScope(user);
  const sp = await searchParams;
  const { sites } = await clientOverview(clientId);
  const site = sites.find((s) => s.id === sp.site)?.id; // only this client's sites are accepted
  const rows = await clientWorkers(clientId, { q: sp.q, site });
  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-extrabold text-navy">Our workers</h1><p className="text-muted">{rows.length} workers · today&apos;s attendance, live</p></div>
      <form className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-3" role="search">
        <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden /><label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Name or DS code" className="field !min-h-[44px] !py-2 pl-9 text-sm" /></div>
        <label htmlFor="site" className="sr-only">Site</label>
        <select id="site" name="site" defaultValue={site ?? ""} className="field !min-h-[44px] !w-auto !py-2 text-sm"><option value="">All sites</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button className="btn btn-navy btn-sm">Show</button>
      </form>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((w) => {
          const t = w.today ? TODAY[w.today] : ["Not marked", "bg-mist text-muted"];
          return (
            <li key={w.workerId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0"><p className="font-semibold text-navy"><span className="mr-2 font-mono text-xs text-orange">DS{String(w.dsNumber).padStart(3, "0")}</span>{w.fullName}</p><p className="text-xs text-muted">{w.jobTitle ?? "—"} · {w.siteName ?? "—"}{w.workerStatus === "leave" ? " · on leave" : ""}</p></div>
              <div className="flex items-center gap-3 text-sm">
                {w.checkIn && <span className="tabular-nums text-muted">In {hhmm(w.checkIn)}{w.checkOut ? ` · Out ${hhmm(w.checkOut)}` : ""}{w.late ? " · late" : ""}</span>}
                {w.ot > 0 && <span className="font-semibold text-navy">+{w.ot}h OT</span>}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t[1]}`}>{t[0]}</span>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-4 py-10 text-center text-muted">No workers found.</li>}
      </ul>
    </div>
  );
}
