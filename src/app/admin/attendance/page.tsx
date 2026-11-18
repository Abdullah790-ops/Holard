import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { CalendarRange, ClipboardCheck, MapPinOff, Camera } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { addDays, dailyRows, hhmm, isDate, todayDubai, weekday, getSetting } from "@/server/attendance";
import { markUnmarkedAbsent } from "@/server/attendance-actions";
import { Badge, dsCode, PageHeader, Stat } from "@/components/admin/ui";
import { CorrectionForm } from "@/components/attendance/CorrectionForm";

export const metadata = { title: "Attendance" };
const S_TONE: Record<string, string> = { P: "active", A: "rejected", L: "leave", OFF: "inactive" };
const S_LABEL: Record<string, string> = { P: "Present", A: "Absent", L: "Leave", OFF: "Off" };

export default async function AttendancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayDubai();
  const date = isDate(sp.date) && sp.date <= today ? sp.date : today;
  const db = await getDb();
  const [clients, sites, { rows, summary }, att] = await Promise.all([
    db.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients).where(eq(schema.clients.status, "active")).orderBy(asc(schema.clients.name)),
    db.select({ id: schema.sites.id, name: schema.sites.name, clientId: schema.sites.clientId }).from(schema.sites).where(eq(schema.sites.status, "active")).orderBy(asc(schema.sites.name)),
    dailyRows({ date, clientId: sp.client, siteId: sp.site, status: sp.status }, undefined),
    getSetting("attendance"),
  ]);
  const q = sp.q?.trim().toLowerCase();
  const shown = q ? rows.filter((r) => `ds${String(r.dsNumber).padStart(3, "0")} ${r.fullName}`.toLowerCase().includes(q.replace(/\s+/g, " "))) : rows;
  const qs = (o: Record<string, string | undefined>) => `?${new URLSearchParams(Object.entries({ date, client: sp.client, site: sp.site, status: sp.status, q: sp.q, ...o }).filter(([, v]) => v) as [string, string][])}`;
  const isOffDay = weekday(date) === att.weeklyOff;
  const sel = "field !min-h-[44px] !py-2 text-sm";
  const pill = (k: string | undefined, label: string, n: number) => (
    <Link key={label} href={qs({ status: k })} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold ${(sp.status ?? "") === (k ?? "") ? "bg-navy text-white" : "bg-white text-navy hover:bg-line"}`}>{label} <span className="opacity-60">{n}</span></Link>
  );
  return (
    <>
      <PageHeader title="Attendance" sub={`${weekday(date)}, ${new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}${isOffDay ? " · weekly off day" : ""}`}
        actions={<>
          <Link href="/admin/attendance/sheet" className="btn btn-outline btn-sm"><CalendarRange className="h-4 w-4" aria-hidden />Monthly sheet</Link>
          <Link href={`/admin/attendance/mark?date=${date}${sp.site ? `&site=${sp.site}` : ""}`} className="btn btn-primary btn-sm"><ClipboardCheck className="h-4 w-4" aria-hidden />Mark by site</Link>
        </>} />

      <form className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex gap-2 lg:col-span-2">
          <Link href={qs({ date: addDays(date, -1) })} className="btn btn-outline btn-sm shrink-0" aria-label="Previous day">‹</Link>
          <label htmlFor="date" className="sr-only">Date</label>
          <input id="date" name="date" type="date" defaultValue={date} max={today} className={sel} />
          {date < today && <Link href={qs({ date: addDays(date, 1) })} className="btn btn-outline btn-sm shrink-0" aria-label="Next day">›</Link>}
        </div>
        <select name="client" defaultValue={sp.client ?? ""} className={sel} aria-label="Client"><option value="">All clients</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="site" defaultValue={sp.site ?? ""} className={sel} aria-label="Site"><option value="">All sites</option>{sites.filter((s) => !sp.client || s.clientId === sp.client).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="flex gap-2">
          <label htmlFor="q" className="sr-only">Search worker</label>
          <input id="q" name="q" defaultValue={sp.q} placeholder="Name or DS…" className={sel} />
          <button className="btn btn-navy btn-sm">Show</button>
        </div>
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Present" value={summary.P} tone="good" sub={`${summary.total ? Math.round((summary.P / summary.total) * 100) : 0}% of ${summary.total}`} />
        <Stat label="Absent" value={summary.A} tone="bad" />
        <Stat label="On leave" value={summary.L} tone="warn" />
        <Stat label="Not marked" value={summary.unmarked} tone="brand" />
        <Stat label="Late" value={summary.late} />
        <Stat label="Overtime" value={`${summary.ot} h`} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {pill(undefined, "All", summary.total)}{pill("P", "Present", summary.P)}{pill("A", "Absent", summary.A)}{pill("L", "Leave", summary.L)}{pill("OFF", "Off", summary.OFF)}{pill("unmarked", "Not marked", summary.unmarked)}{pill("late", "Late", summary.late)}{pill("outside", "Outside site", summary.outside)}
        {summary.unmarked > 0 && (
          <form action={markUnmarkedAbsent} className="ml-auto">
            <input type="hidden" name="date" value={date} />{sp.site && <input type="hidden" name="siteId" value={sp.site} />}{sp.client && <input type="hidden" name="clientId" value={sp.client} />}
            <button className="text-sm font-semibold text-red-600 hover:underline">Set {summary.unmarked} not-marked to Absent</button>
          </form>
        )}
      </div>

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {shown.slice(0, 300).map((r) => (
          <li key={r.workerId}>
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-mist/50 [&::-webkit-details-marker]:hidden">
                <span className="w-16 font-mono text-xs font-semibold text-orange">{dsCode(r.dsNumber)}</span>
                <span className="min-w-[180px] flex-1"><span className="font-semibold text-navy">{r.fullName}</span><span className="block text-xs text-muted">{r.clientName ?? "In pool"}{r.siteName ? ` · ${r.siteName}` : ""}</span></span>
                <span className="w-28 text-sm tabular-nums">{r.a?.checkInAt ? `${hhmm(r.a.checkInAt)} – ${r.a.checkOutAt ? hhmm(r.a.checkOutAt) : "…"}` : <span className="text-muted">—</span>}</span>
                <span className="flex w-40 items-center gap-1.5 text-xs">
                  {r.a?.late && <Badge status="d15" label="Late" />}
                  {r.a?.outsideSite && <span title={`${r.a.distanceMeters} m from site`} className="inline-flex items-center gap-0.5 font-semibold text-red-600"><MapPinOff className="h-3.5 w-3.5" aria-hidden />{r.a.distanceMeters}m</span>}
                  {r.a?.selfieFileId && <a href={`/api/files/${r.a.selfieFileId}`} target="_blank" rel="noopener" className="text-orange" title="Selfie"><Camera className="h-4 w-4" aria-label="Selfie" /></a>}
                  {Number(r.a?.overtimeHours) > 0 && <span className="font-semibold text-navy">+{Number(r.a!.overtimeHours)}h OT</span>}
                  {r.a?.correctedAt && <span className="text-muted" title={r.a.correctionReason ?? ""}>edited</span>}
                </span>
                <span className="w-24 text-right">{r.a ? <Badge status={S_TONE[r.a.status]} label={S_LABEL[r.a.status]} /> : <Badge status="missing" label="Not marked" />}</span>
                <span className="text-sm font-semibold text-orange group-open:hidden">Edit</span>
              </summary>
              <div className="border-t border-line bg-mist/40 px-4 py-4">
                {r.a && <p className="mb-3 text-xs text-muted">Source: {r.a.source}{r.a.checkInLat ? ` · GPS ${r.a.checkInLat}, ${r.a.checkInLng} (±${r.a.checkInAccuracy ?? "?"} m)` : ""}{r.a.note ? ` · ${r.a.note}` : ""}{r.a.correctionReason ? ` · Last correction: ${r.a.correctionReason}` : ""}</p>}
                <CorrectionForm workerId={r.workerId} date={date} cur={{ status: r.a?.status ?? null, checkIn: r.a?.checkInAt ? hhmm(r.a.checkInAt) : null, checkOut: r.a?.checkOutAt ? hhmm(r.a.checkOutAt) : null, ot: Number(r.a?.overtimeHours) || 0 }} />
              </div>
            </details>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-10 text-center text-muted">No workers match.</li>}
      </ul>
      {shown.length > 300 && <p className="mt-3 text-sm text-muted">Showing first 300 of {shown.length}. Search, or filter by client or site, to see the rest.</p>}
    </>
  );
}
