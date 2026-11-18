import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { MapPin, Plus } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { removeSite } from "@/server/admin/client-actions";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { ClientForm, SiteForm } from "@/components/admin/ClientForm";
import { SiteCheckinForm } from "@/components/admin/SettingsForms";

export const metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = await getDb();
  const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
  if (!c) notFound();
  const sites = await db.select({
    id: schema.sites.id, name: schema.sites.name, emirate: schema.sites.emirate, address: schema.sites.address, status: schema.sites.status,
    latitude: schema.sites.latitude, longitude: schema.sites.longitude,
    checkinMode: schema.sites.checkinMode, radiusMeters: schema.sites.radiusMeters, requireSelfie: schema.sites.requireSelfie,
    workers: sql<number>`(select count(*)::int from ${schema.workers} w where w.site_id = ${schema.sites.id} and w.status <> 'terminated')`,
  }).from(schema.sites).where(eq(schema.sites.clientId, id)).orderBy(asc(schema.sites.name));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.workers).where(sql`${schema.workers.clientId} = ${id} and ${schema.workers.status} <> 'terminated'`);
  return (
    <>
      <PageHeader title={c.name} sub={`${n} worker${n === 1 ? "" : "s"} assigned · ${c.contractedHeadcount} contracted`} back={{ href: "/admin/clients", label: "Clients & Sites" }}
        actions={<>
          <Link href={`/admin/workers?client=${c.id}`} className="btn btn-outline btn-sm">View workers</Link>
          <Link href={`/admin/workers/new?client=${c.id}`} className="btn btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden />Add worker</Link>
        </>} />
      <div className="grid gap-6 2xl:grid-cols-5">
        <Card title="Client details" className="2xl:col-span-3"><ClientForm c={c} /></Card>
        <div className="space-y-6 2xl:col-span-2">
          <Card title={`Sites (${sites.length})`}>
            {sites.length === 0 ? <p className="text-muted">No sites yet. Add the first one below.</p> : (
              <ul className="divide-y divide-line">
                {sites.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy">{s.name} {s.status !== "active" && <Badge status="inactive" />}</p>
                        <p className="text-sm text-muted">{[s.emirate, s.address].filter(Boolean).join(" · ")}{s.latitude ? ` · GPS set (${s.radiusMeters} m)` : " · no GPS point"}</p>
                        <Link href={`/admin/workers?client=${c.id}&site=${s.id}`} className="text-sm font-semibold text-orange hover:underline">{s.workers} worker{s.workers === 1 ? "" : "s"}</Link>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-semibold text-navy">Check-in settings · {s.checkinMode === "both" ? "workers + supervisor" : s.checkinMode === "self" ? "workers (GPS)" : "supervisor only"}{s.requireSelfie ? " · selfie" : ""}</summary>
                          <div className="mt-3"><SiteCheckinForm site={s} /></div>
                        </details>
                      </div>
                    </div>
                    {s.status === "active" && (
                      <form action={removeSite}>
                        <input type="hidden" name="id" value={s.id} /><input type="hidden" name="clientId" value={c.id} />
                        <button className="text-sm font-semibold text-muted hover:text-red-600" title={s.workers ? "Workers are assigned — the site will be deactivated" : "Delete site"}>{s.workers ? "Deactivate" : "Remove"}</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Add a site"><SiteForm clientId={c.id} /></Card>
        </div>
      </div>
    </>
  );
}
