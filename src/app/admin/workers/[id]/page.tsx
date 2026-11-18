import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { FileText, Pencil, UserRound } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { DOC_TYPES } from "@/db/schema";
import { DOC_LABEL, daysUntil, expiryState, getWorker } from "@/server/admin/workers";
import { setWorkerStatus } from "@/server/admin/worker-actions";
import { aed, Badge, Card, dsCode, fmtDate, PageHeader } from "@/components/admin/ui";
import { getSetting, isMonth, leaveBalance, todayDubai, workerMonth } from "@/server/attendance";
import { listApprovals } from "@/server/approvals";
import { MonthCalendar } from "@/components/attendance/MonthCalendar";
import { gratuity } from "@/server/payroll";
import { desc } from "drizzle-orm";
import { ApprovalList } from "@/components/attendance/ApprovalList";

export const metadata = { title: "Worker" };

export default async function WorkerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; month?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved, month: m } = await searchParams;
  const today = todayDubai();
  const month = isMonth(m) && m <= today.slice(0, 7) ? m : today.slice(0, 7);
  const w = await getWorker(id);
  if (!w) notFound();
  const [days, bal, reqs, att] = await Promise.all([workerMonth(id, month), leaveBalance(id), listApprovals(admin, { workerId: id, limit: 10 }), getSetting("attendance")]);
  const db = await getDb();
  const slips = await db.select({ l: schema.payrollLines, status: schema.payrollRuns.status }).from(schema.payrollLines)
    .innerJoin(schema.payrollRuns, eq(schema.payrollLines.runId, schema.payrollRuns.id)).where(eq(schema.payrollLines.workerId, id)).orderBy(desc(schema.payrollLines.month)).limit(12);
  const grat = gratuity(Number(w.basicSalary) || 0, w.joiningDate, today);
  const [client] = w.clientId ? await db.select({ name: schema.clients.name }).from(schema.clients).where(eq(schema.clients.id, w.clientId)) : [];
  const [site] = w.siteId ? await db.select({ name: schema.sites.name }).from(schema.sites).where(eq(schema.sites.id, w.siteId)) : [];
  const rows: [string, React.ReactNode][] = [
    ["Nationality", w.nationality], ["Job title", w.jobTitle], ["Phone", w.phone], ["WhatsApp", w.whatsapp],
    ["Emergency contact", [w.emergencyName, w.emergencyPhone].filter(Boolean).join(" · ") || null],
    ["Joining date", fmtDate(w.joiningDate)],
  ];
  return (
    <>
      {saved && <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Saved.</p>}
      <PageHeader title={w.fullName} sub={`${dsCode(w.dsNumber)} · ${w.jobTitle ?? "No job title"}`} back={{ href: "/admin/workers", label: "Workers" }}
        actions={<Link href={`/admin/workers/${id}/edit`} className="btn btn-primary btn-sm"><Pencil className="h-4 w-4" aria-hidden />Edit</Link>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="flex items-center gap-4">
            {w.photoFileId
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`/api/files/${w.photoFileId}`} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              : <span className="grid h-20 w-20 place-items-center rounded-2xl bg-mist text-navy/40"><UserRound className="h-9 w-9" aria-hidden /></span>}
            <div>
              <p className="font-mono text-sm font-bold text-orange">{dsCode(w.dsNumber)}</p>
              <div className="mt-1"><Badge status={w.status} /></div>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-line text-sm">
            {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v || "—"}</dd></div>)}
          </dl>
          <form action={setWorkerStatus} className="mt-6 flex gap-2">
            <input type="hidden" name="id" value={w.id} />
            <label htmlFor="status" className="sr-only">Change status</label>
            <select id="status" name="status" defaultValue={w.status} className="field !min-h-[40px] !py-1.5 text-sm">
              <option value="active">Active</option><option value="leave">On leave</option><option value="terminated">Terminated</option>
            </select>
            <button className="btn btn-navy btn-sm shrink-0">Update</button>
          </form>
        </Card>
        <div className="space-y-6 xl:col-span-2">
          <Card title="Assignment & pay">
            <dl className="grid gap-5 sm:grid-cols-4">
              {[["Client", client?.name ?? "In pool"], ["Site", site?.name ?? "—"], ["Basic salary", aed(w.basicSalary)], ["Overtime / hr", w.overtimeRate ? aed(w.overtimeRate) : "UAE law"]].map(([k, v]) => (
                <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="mt-1 font-heading text-lg font-bold text-navy">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Documents">
            <ul className="divide-y divide-line">
              {DOC_TYPES.map((t) => {
                const d = w.docs[t];
                const st = expiryState(d?.expiryDate ?? null);
                const n = daysUntil(d?.expiryDate ?? null);
                return (
                  <li key={t} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div>
                      <p className="font-semibold text-navy">{DOC_LABEL[t]}</p>
                      <p className="text-sm text-muted">{d?.number ?? "No number"} · Expires {fmtDate(d?.expiryDate)}{n !== null && n >= 0 && n <= 60 ? ` (in ${n} days)` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={st} />
                      {d?.fileId ? <a href={`/api/files/${d.fileId}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-orange hover:underline"><FileText className="h-4 w-4" aria-hidden />View file</a> : <span className="text-sm text-muted">No file</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Attendance"><MonthCalendar month={month} days={days} today={today} weeklyOff={att.weeklyOff} hrefFor={(mm) => `/admin/workers/${id}?month=${mm}`} /></Card>
            <Card title="Leave balance (this year)">
              <p className="font-heading text-4xl font-extrabold text-navy">{bal.balance}<span className="text-lg font-semibold text-muted"> / {bal.entitlement} days</span></p>
              <p className="mt-1 text-sm text-muted">Annual leave left · {bal.serviceMonths} months of service{bal.pendingAnnual ? ` · ${bal.pendingAnnual} days pending` : ""}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {[["Annual used", bal.usedAnnual], ["Sick", bal.usedSick], ["Emergency", bal.usedEmergency], ["Unpaid", bal.usedUnpaid]].map(([k, v]) => <div key={k} className="rounded-xl bg-mist p-3"><dt className="text-muted">{k}</dt><dd className="font-heading text-xl font-bold text-navy">{v}</dd></div>)}
              </dl>
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Payslips">
              {slips.length === 0 ? <p className="text-muted">No payroll yet.</p> : (
                <ul className="divide-y divide-line">{slips.map(({ l, status }) => (
                  <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span>{new Date(`${l.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })} <Badge status={status === "draft" ? "new" : "approved"} label={status} /></span>
                    <span className="flex items-center gap-3"><strong className="tabular-nums">{aed(l.net)}</strong><a href={`/api/payslips/${l.id}`} target="_blank" className="font-semibold text-orange hover:underline">PDF</a></span>
                  </li>))}</ul>
              )}
            </Card>
            <Card title="Gratuity today & WPS">
              <p className="font-heading text-3xl font-extrabold text-navy">{aed(grat.amount)}</p>
              <p className="text-sm text-muted">{grat.years} years · {grat.breakdown}</p>
              <dl className="mt-5 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Person ID</dt><dd className={w.personId ? "" : "font-semibold text-red-600"}>{w.personId ?? "Missing"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">IBAN / card</dt><dd className={w.iban ? "" : "font-semibold text-red-600"}>{w.iban ?? "Missing"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Routing code</dt><dd className={w.routingCode ? "" : "font-semibold text-red-600"}>{w.routingCode ?? "Missing"}</dd></div>
              </dl>
            </Card>
          </div>
          <Card title="Requests"><ApprovalList items={reqs} mode="admin" /></Card>
        </div>
      </div>
    </>
  );
}
