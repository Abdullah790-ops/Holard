import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ArrowRight, CalendarCheck, ClipboardCheck } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getDb, schema } from "@/db";
import { dailyRows, getSetting, hhmm, leaveBalance, listShifts, sitesInScope, todayDubai, weekday, workerMonth, workerScope } from "@/server/attendance";
import { listApprovals, openApprovalCount } from "@/server/approvals";
import { CheckInCard } from "@/components/attendance/CheckInCard";
import { ClientHome } from "@/components/portal/ClientHome";
import { InvestorHome } from "@/components/portal/InvestorHome";
import { Announcements } from "@/components/portal/Announcements";
import { ApprovalList } from "@/components/attendance/ApprovalList";

export default async function Portal() {
  const user = await requireUser();
  const today = todayDubai();
  const first = user.name.split(" ")[0];
  const dateLabel = `${weekday(today)}, ${new Date(`${today}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`;

  if (user.role === "employee") {
    if (!user.workerId) return <p className="rounded-2xl bg-white p-6">Your login is not linked to a worker record yet. Please contact Holard.</p>;
    const db = await getDb();
    const [w] = await db.select({ w: schema.workers, siteName: schema.sites.name, mode: schema.sites.checkinMode, selfie: schema.sites.requireSelfie })
      .from(schema.workers).leftJoin(schema.sites, eq(schema.workers.siteId, schema.sites.id)).where(eq(schema.workers.id, user.workerId));
    const [rec] = await db.select().from(schema.attendance).where(and(eq(schema.attendance.workerId, user.workerId), eq(schema.attendance.date, today)));
    const [shifts, days, bal, reqs] = await Promise.all([listShifts(), workerMonth(user.workerId, today.slice(0, 7)), leaveBalance(user.workerId), listApprovals(user, { limit: 3 })]);
    const shift = shifts.find((s) => s.id === w.w.shiftId) ?? shifts.find((s) => s.isDefault);
    const month = days.reduce((a, d) => { if (d) { a[d.s]++; a.ot += d.ot; } return a; }, { P: 0, A: 0, L: 0, OFF: 0, ot: 0 } as Record<string, number>);
    return (
      <div className="space-y-6">
        <div><h1 className="font-heading text-2xl font-extrabold text-navy">Hello, {first} 👋</h1><p className="text-muted">{dateLabel} · DS{String(w.w.dsNumber).padStart(3, "0")}</p></div>
        <Announcements role={user.role} />
        <CheckInCard siteName={w.siteName} shiftLabel={shift ? `${shift.name} ${shift.startTime}–${shift.endTime}` : null} requireSelfie={!!w.selfie} mode={w.mode}
          state={{ checkIn: rec?.checkInAt ? hhmm(rec.checkInAt) : null, checkOut: rec?.checkOutAt ? hhmm(rec.checkOutAt) : null, status: rec?.status ?? null, hours: rec?.workedHours ? Number(rec.workedHours).toFixed(1) : null, late: !!rec?.late, outside: !!rec?.outsideSite }} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/portal/attendance" className="rounded-2xl border border-line bg-white p-5 hover:border-navy">
            <p className="text-sm text-muted">This month</p>
            <p className="mt-1 font-heading text-3xl font-extrabold text-navy">{month.P} <span className="text-base font-semibold text-muted">days present</span></p>
            <p className="mt-1 text-sm text-muted">{month.A} absent · {month.L} leave · {month.ot} h overtime</p>
          </Link>
          <Link href="/portal/requests" className="rounded-2xl border border-line bg-white p-5 hover:border-navy">
            <p className="text-sm text-muted">Annual leave left</p>
            <p className="mt-1 font-heading text-3xl font-extrabold text-navy">{bal.balance} <span className="text-base font-semibold text-muted">of {bal.entitlement} days</span></p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-orange">Apply for leave, overtime or advance <ArrowRight className="h-4 w-4" aria-hidden /></p>
          </Link>
        </div>
        {reqs.length > 0 && <section><h2 className="mb-3 font-heading text-lg font-bold text-navy">My latest requests</h2><ApprovalList items={reqs} mode="worker" /></section>}
      </div>
    );
  }

  if (user.role === "supervisor") {
    const scope = workerScope(user);
    const sites = await sitesInScope(user);
    const att = await getSetting("attendance");
    const perSite = scope === false ? [] : await Promise.all(sites.map(async (s) => ({ s, sum: (await dailyRows({ date: today, siteId: s.id }, scope)).summary })));
    const pending = await openApprovalCount(user);
    return (
      <div className="space-y-6">
        <div><h1 className="font-heading text-2xl font-extrabold text-navy">Good day, {first}</h1><p className="text-muted">{dateLabel}{weekday(today) === att.weeklyOff ? " · weekly off day" : ""}</p></div>
        <Announcements role={user.role} />
        <div className="grid gap-4 sm:grid-cols-2">
          {perSite.map(({ s, sum }) => (
            <Link key={s.id} href={`/portal/mark?site=${s.id}`} className="rounded-2xl border border-line bg-white p-5 hover:border-navy">
              <p className="font-heading text-lg font-bold text-navy">{s.name}</p>
              <p className="text-sm text-muted">{s.clientName}</p>
              <p className="mt-3 font-heading text-3xl font-extrabold text-navy">{sum.P}<span className="text-lg text-muted">/{sum.total}</span> <span className="text-base font-semibold text-muted">present</span></p>
              <p className="text-sm text-muted">{sum.A} absent · {sum.L} leave · <span className={sum.unmarked ? "font-semibold text-orange-dark" : ""}>{sum.unmarked} not marked</span>{sum.outside ? ` · ${sum.outside} outside site` : ""}</p>
              <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-orange"><ClipboardCheck className="h-4 w-4" aria-hidden />Mark attendance</p>
            </Link>
          ))}
          {perSite.length === 0 && <p className="rounded-2xl bg-white p-6 text-muted">You have no sites yet. Ask Holard admin to assign you.</p>}
        </div>
        <Link href="/portal/approvals" className="flex items-center justify-between rounded-2xl bg-navy p-5 text-white">
          <span className="flex items-center gap-3"><CalendarCheck className="h-6 w-6 text-orange" aria-hidden /><span><strong className="font-heading text-xl">{pending}</strong> request{pending === 1 ? "" : "s"} waiting for you</span></span>
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    );
  }

  if (user.role === "client_admin") return <ClientHome user={user} dateLabel={dateLabel} />;
  if (user.role === "investor") return <InvestorHome user={user} />;
  return null;
}
