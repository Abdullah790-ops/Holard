import Link from "next/link";
import { and, count, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { AlertTriangle, Briefcase, Building2, FileSpreadsheet, Receipt, UserPlus } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { DOC_LABEL, expiringDocuments, expiryState, plusDays } from "@/server/admin/workers";
import { dailyRows, todayDubai } from "@/server/attendance";
import { openApprovalCount } from "@/server/approvals";
import { moneySummary } from "@/server/invoicing";
import { Badge, Card, dsCode, Empty, fmtDate, PageHeader, Stat } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireAdmin();
  const db = await getDb();
  const { workers, clients, sites, workerDocuments, candidates, enquiries } = schema;

  const [{ summary: day }, approvalsOpen, money] = await Promise.all([dailyRows({ date: todayDubai() }, undefined), openApprovalCount(user), moneySummary(todayDubai().slice(0, 7))]);
  const [statusCounts, [pool], byClient, bySite, docBuckets, expiring, [newCand], [newHire], [newOther], [totalWorkers]] = await Promise.all([
    db.select({ s: workers.status, n: count() }).from(workers).groupBy(workers.status),
    db.select({ n: count() }).from(workers).where(and(eq(workers.status, "active"), sql`${workers.clientId} is null`)),
    db.select({
      id: clients.id, name: clients.name, contracted: clients.contractedHeadcount,
      active: sql<number>`count(${workers.id}) filter (where ${workers.status} = 'active')::int`,
      leave: sql<number>`count(${workers.id}) filter (where ${workers.status} = 'leave')::int`,
    }).from(clients).leftJoin(workers, eq(workers.clientId, clients.id)).where(eq(clients.status, "active"))
      .groupBy(clients.id).orderBy(desc(sql`count(${workers.id})`)),
    db.select({ id: sites.id, name: sites.name, client: clients.name, emirate: sites.emirate, n: sql<number>`count(${workers.id})::int` })
      .from(sites).innerJoin(clients, eq(sites.clientId, clients.id))
      .leftJoin(workers, and(eq(workers.siteId, sites.id), sql`${workers.status} <> 'terminated'`))
      .where(eq(sites.status, "active")).groupBy(sites.id, clients.name).orderBy(desc(sql`count(${workers.id})`)).limit(8),
    db.select({
      expired: sql<number>`count(*) filter (where ${workerDocuments.expiryDate} < ${plusDays(0)})::int`,
      d7: sql<number>`count(*) filter (where ${workerDocuments.expiryDate} between ${plusDays(0)} and ${plusDays(7)})::int`,
      d15: sql<number>`count(*) filter (where ${workerDocuments.expiryDate} between ${plusDays(8)} and ${plusDays(15)})::int`,
      d30: sql<number>`count(*) filter (where ${workerDocuments.expiryDate} between ${plusDays(16)} and ${plusDays(30)})::int`,
    }).from(workerDocuments).innerJoin(workers, eq(workerDocuments.workerId, workers.id))
      .where(and(isNotNull(workerDocuments.expiryDate), lte(workerDocuments.expiryDate, plusDays(30)), sql`${workers.status} <> 'terminated'`)),
    expiringDocuments(30, 8),
    db.select({ n: count() }).from(candidates).where(eq(candidates.status, "new")),
    db.select({ n: count() }).from(enquiries).where(and(eq(enquiries.status, "new"), eq(enquiries.type, "hire"))),
    db.select({ n: count() }).from(enquiries).where(and(eq(enquiries.status, "new"), sql`${enquiries.type} <> 'hire'`)),
    db.select({ n: count() }).from(workers),
  ]);
  const st = Object.fromEntries(statusCounts.map((r) => [r.s, r.n])) as Record<string, number>;
  const active = st.active ?? 0, leave = st.leave ?? 0;
  const b = docBuckets[0] ?? { expired: 0, d7: 0, d15: 0, d30: 0 };
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Dubai" });

  if (totalWorkers.n === 0) {
    return (
      <>
        <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} sub={today} />
        <Empty title="Let's set up your back office" sub="1. Add your clients and their sites. 2. Import your workers from Excel. 3. Create logins for your team."
          action={<div className="flex flex-wrap justify-center gap-3"><Link href="/admin/clients/new" className="btn btn-primary btn-sm">Add first client</Link><Link href="/admin/workers/import" className="btn btn-outline btn-sm">Import workers</Link></div>} />
      </>
    );
  }

  const quick = [
    { href: "/admin/workers/new", label: "Add Worker", icon: UserPlus },
    { href: "/admin/clients/new", label: "Add Client", icon: Building2 },
    { href: "/admin/attendance/mark", label: "Mark Attendance", icon: Briefcase },
    { href: "/admin/invoices", label: "Create Invoice", icon: Receipt },
    { href: "/admin/jobs", label: "Post Job", icon: Briefcase },
    { href: "/admin/workers/import", label: "Bulk Import", icon: FileSpreadsheet },
  ];

  return (
    <>
      <PageHeader title={`Good day, ${user.name.split(" ")[0]}`} sub={today}
        actions={quick.map(({ href, label, icon: I }) => <Link key={href} href={href} className="btn btn-outline btn-sm"><I className="h-4 w-4" aria-hidden />{label}</Link>)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active workers" value={active.toLocaleString()} sub={`${leave} on leave · ${pool.n} in pool`} />
        <Stat label="Present today" value={day.P.toLocaleString()} tone="good"
          sub={<Link href="/admin/attendance" className="hover:underline">{day.A} absent · {day.L} leave · <span className={day.unmarked ? "font-semibold text-orange-dark" : ""}>{day.unmarked} not marked</span></Link>} />
        <Stat label="Approvals waiting" value={approvalsOpen} tone="warn" sub={<Link href="/admin/approvals" className="font-semibold text-orange hover:underline">Leave, overtime &amp; advances</Link>} />
        <Stat label="New from website" value={newCand.n + newHire.n + newOther.n} tone="brand"
          sub={<><Link href="/admin/candidates?status=new" className="font-semibold text-orange hover:underline">{newCand.n} candidates</Link> · <Link href="/admin/inbox?type=hire" className="font-semibold text-orange hover:underline">{newHire.n} hire requests</Link> · <Link href="/admin/inbox" className="font-semibold text-orange hover:underline">{newOther.n} other</Link></>} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="By client" className="xl:col-span-2" action={<Link href="/admin/clients" className="text-sm font-semibold text-orange">All clients</Link>}>
          {byClient.length === 0 ? <p className="text-muted">No clients yet.</p> : (
            <ul className="space-y-4">
              {byClient.map((c) => {
                const assigned = c.active + c.leave;
                const pct = c.contracted ? Math.min(100, (assigned / c.contracted) * 100) : 0;
                const short = c.contracted > 0 && assigned < c.contracted;
                return (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/admin/clients/${c.id}`} className="font-semibold text-navy hover:text-orange">{c.name}</Link>
                      <span className="text-sm tabular-nums"><strong className="text-navy">{assigned}</strong><span className="text-muted">/{c.contracted || "—"}</span>{c.leave > 0 && <span className="text-muted"> · {c.leave} on leave</span>}{short && <span className="ml-2 font-semibold text-orange-dark">{c.contracted - assigned} short</span>}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist"><div className={`h-full rounded-full ${short ? "bg-orange" : "bg-navy"}`} style={{ width: `${c.contracted ? pct : 0}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Document alerts" action={<Link href="/admin/workers?expiry=30" className="text-sm font-semibold text-orange">View all</Link>}>
          <div className="grid grid-cols-4 gap-2 text-center">
            {([["expired", "Expired", b.expired], ["d7", "≤ 7 days", b.d7], ["d15", "≤ 15 days", b.d15], ["d30", "≤ 30 days", b.d30]] as const).map(([k, l, n]) => (
              <Link key={k} href={`/admin/workers?expiry=${k === "expired" ? "expired" : k.slice(1)}`} className={`rounded-xl p-3 ${n ? (k === "d30" ? "bg-amber-50" : k === "d15" ? "bg-orange/10" : "bg-red-50") : "bg-mist"}`}>
                <p className="font-heading text-2xl font-extrabold text-navy tabular-nums">{n}</p><p className="text-xs text-muted">{l}</p>
              </Link>
            ))}
          </div>
          {expiring.length > 0 ? (
            <ul className="mt-5 divide-y divide-line">
              {expiring.map((d) => (
                <li key={`${d.workerId}${d.type}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/workers/${d.workerId}`} className="min-w-0">
                    <p className="truncate font-semibold text-navy hover:text-orange">{d.fullName}</p>
                    <p className="text-xs text-muted">{dsCode(d.dsNumber)} · {DOC_LABEL[d.type]} · {fmtDate(d.expiryDate)}</p>
                  </Link>
                  <Badge status={expiryState(d.expiryDate)} />
                </li>
              ))}
            </ul>
          ) : <p className="mt-5 flex items-center gap-2 text-sm text-muted"><AlertTriangle className="h-4 w-4" aria-hidden />No documents expiring in the next 30 days.</p>}
        </Card>

        <Card title="By site" className="xl:col-span-2">
          {bySite.length === 0 ? <p className="text-muted">No sites yet.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {bySite.map((s) => (
                <Link key={s.id} href={`/admin/workers?site=${s.id}`} className="rounded-xl bg-mist p-4 hover:bg-line">
                  <p className="font-heading text-2xl font-extrabold text-navy tabular-nums">{s.n}</p>
                  <p className="truncate font-semibold text-navy">{s.name}</p>
                  <p className="truncate text-xs text-muted">{s.client}{s.emirate ? ` · ${s.emirate}` : ""}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Money" action={<Link href="/admin/invoices" className="text-sm font-semibold text-orange">Invoices</Link>}>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {([["Invoiced this month", money.invoicedThisMonth, "text-navy"], ["Paid", money.paidThisMonth, "text-emerald-700"], ["Outstanding", money.outstanding, "text-amber-700"], ["Overdue", money.overdue, "text-red-600"]] as const).map(([k, v, c]) => (
              <div key={k} className="rounded-xl bg-mist p-3"><dt className="text-muted">{k}</dt><dd className={`font-heading text-lg font-bold tabular-nums ${c}`}>AED {Math.round(v).toLocaleString("en-US")}</dd></div>
            ))}
          </dl>
          {money.overdueCount > 0 && <Link href="/admin/invoices?state=overdue" className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-600"><Receipt className="h-4 w-4" aria-hidden />{money.overdueCount} overdue invoice{money.overdueCount === 1 ? "" : "s"} — follow up</Link>}
        </Card>
      </div>
    </>
  );
}
