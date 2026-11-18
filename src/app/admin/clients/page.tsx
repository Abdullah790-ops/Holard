import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { aed, Badge, Empty, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Clients & Sites" };

export default async function Clients() {
  await requireAdmin();
  const db = await getDb();
  const { clients, workers, sites } = schema;
  const rows = await db.select({
    id: clients.id, name: clients.name, short: clients.short, industry: clients.industry, status: clients.status,
    contracted: clients.contractedHeadcount, monthlyRate: clients.monthlyRate,
    active: sql<number>`(select count(*)::int from ${workers} w where w.client_id = ${clients.id} and w.status = 'active')`,
    onLeave: sql<number>`(select count(*)::int from ${workers} w where w.client_id = ${clients.id} and w.status = 'leave')`,
    siteCount: sql<number>`(select count(*)::int from ${sites} s where s.client_id = ${clients.id} and s.status = 'active')`,
  }).from(clients).orderBy(sql`${clients.status} = 'inactive'`, asc(clients.name));
  return (
    <>
      <PageHeader title="Clients & Sites" sub={`${rows.length} client${rows.length === 1 ? "" : "s"}`} actions={<Link href="/admin/clients/new" className="btn btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden />Add client</Link>} />
      {rows.length === 0 ? <Empty title="No clients yet" sub="Add your first client, then its sites." action={<Link href="/admin/clients/new" className="btn btn-primary btn-sm">Add client</Link>} /> : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((c) => {
            const assigned = c.active + c.onLeave;
            const pct = c.contracted ? Math.min(100, Math.round((assigned / c.contracted) * 100)) : 0;
            const short = assigned < c.contracted;
            return (
              <Link key={c.id} href={`/admin/clients/${c.id}`} className="rounded-2xl border border-line bg-white p-6 transition hover:border-navy hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy font-heading text-sm font-extrabold text-white">{c.short ?? c.name.slice(0, 2).toUpperCase()}</span>
                    <div><p className="font-heading text-lg font-bold text-navy">{c.name}</p><p className="text-sm text-muted">{c.industry ?? "—"}</p></div>
                  </div>
                  {c.status !== "active" && <Badge status="inactive" />}
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <p className="font-heading text-3xl font-extrabold text-navy tabular-nums">{assigned}<span className="text-lg text-muted">/{c.contracted}</span></p>
                  <p className={`text-sm font-semibold ${short ? "text-orange-dark" : "text-emerald-700"}`}>{c.contracted ? (short ? `${c.contracted - assigned} short` : "Fully staffed") : "No contract set"}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist" role="img" aria-label={`${pct}% of contracted headcount`}><div className={`h-full rounded-full ${short ? "bg-orange" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
                <p className="mt-4 text-sm text-muted">{c.siteCount} site{c.siteCount === 1 ? "" : "s"} · {c.onLeave} on leave · {aed(c.monthlyRate)}/worker/month</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
