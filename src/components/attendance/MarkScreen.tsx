import Link from "next/link";
import { requireUser } from "@/server/auth";
import { addDays, dailyRows, hhmm, isDate, sitesInScope, todayDubai, workerScope, weekday, getSetting } from "@/server/attendance";
import { dsCode, PageHeader } from "@/components/admin/ui";
import { BulkMarkForm } from "@/components/attendance/BulkMarkForm";

/** Bulk attendance screen — used by admin (/admin/attendance/mark) and supervisors (/portal/mark). */
export async function MarkScreen({ sp }: { sp: Record<string, string | undefined> }) {
  const user = await requireUser(["super_admin", "supervisor"]);
  const today = todayDubai();
  const minDate = user.role === "supervisor" ? addDays(today, -2) : undefined;
  const date = isDate(sp.date) && sp.date <= today && (!minDate || sp.date >= minDate) ? sp.date : today;
  const sites = await sitesInScope(user);
  const siteId = sites.find((s) => s.id === sp.site)?.id ?? (sites.length === 1 ? sites[0].id : undefined);
  const scope = workerScope(user);
  const att = await getSetting("attendance");
  const data = siteId && scope !== false ? await dailyRows({ date, siteId }, scope) : null;
  const site = sites.find((s) => s.id === siteId);
  return (
    <>
      <PageHeader title="Mark attendance" sub={site ? `${site.clientName} · ${site.name} · ${weekday(date)} ${date}${weekday(date) === att.weeklyOff ? " (weekly off)" : ""}` : "Choose a site"}
        back={user.role === "super_admin" ? { href: `/admin/attendance?date=${date}`, label: "Attendance" } : { href: "/portal", label: "Home" }} />
      <form className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-4">
        <label htmlFor="site" className="sr-only">Site</label>
        <select id="site" name="site" defaultValue={siteId ?? ""} className="field !min-h-[44px] !w-auto flex-1 !py-2 text-sm" required>
          <option value="">Choose site…</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{user.role === "super_admin" ? `${s.clientName} · ` : ""}{s.name}</option>)}
        </select>
        <label htmlFor="date" className="sr-only">Date</label>
        <input id="date" name="date" type="date" defaultValue={date} max={today} min={minDate} className="field !min-h-[44px] !w-auto !py-2 text-sm" />
        <button className="btn btn-navy btn-sm">Open</button>
      </form>
      {!data ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center text-muted">{sites.length ? "Choose a site to mark its workers." : "No sites available. Ask the admin to assign you to a site."}</p>
      ) : (
        <BulkMarkForm key={`${siteId}-${date}`} date={date} rows={data.rows.map((r) => ({
          workerId: r.workerId, ds: dsCode(r.dsNumber), name: r.fullName, job: r.jobTitle, site: null,
          status: r.a?.status ?? null, ot: Number(r.a?.overtimeHours) || 0, checkIn: r.a?.checkInAt ? hhmm(r.a.checkInAt) : null,
          late: !!r.a?.late, outside: !!r.a?.outsideSite, source: r.a?.source ?? null,
        }))} />
      )}
      <p className="mt-4 text-sm text-muted">Workers who checked in themselves show their time. Approved leave is locked. {user.role === "supervisor" && <>You can mark today and the 2 previous days. <Link href="/portal/approvals" className="font-semibold text-orange">Approvals →</Link></>}</p>
    </>
  );
}
