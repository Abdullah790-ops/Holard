import Link from "next/link";
import { Download, FileSpreadsheet, Plus, Search } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { filterOptions, listWorkers, expiryState, type WorkerFilters } from "@/server/admin/workers";
import { Badge, dsCode, Empty, PageHeader, Pagination, Table, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Workers" };

type SP = Promise<Record<string, string | undefined>>;

export default async function Workers({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const f: WorkerFilters = { q: sp.q, client: sp.client, site: sp.site, nationality: sp.nationality, job: sp.job, status: sp.status, expiry: sp.expiry, page: Number(sp.page) || 1 };
  const [{ rows, total, page, pages }, opts] = await Promise.all([listWorkers(f), filterOptions()]);
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
    return `?${p}`;
  };
  const exportQs = qs({ page: "" }).slice(1);
  const sel = "field !min-h-[44px] !py-2 text-sm";
  const filtered = Object.entries(sp).some(([k, v]) => k !== "page" && v);

  return (
    <>
      <PageHeader title="Workers" sub={`${total.toLocaleString()} worker${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}`}
        actions={<>
          <a href={`/api/admin/workers/export?${exportQs}`} className="btn btn-outline btn-sm"><Download className="h-4 w-4" aria-hidden />Export Excel</a>
          <Link href="/admin/workers/import" className="btn btn-outline btn-sm"><FileSpreadsheet className="h-4 w-4" aria-hidden />Bulk import</Link>
          <Link href="/admin/workers/new" className="btn btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden />Add worker</Link>
        </>} />

      <form className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8" role="search">
        <div className="relative sm:col-span-2">
          <label htmlFor="q" className="sr-only">Search</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="q" name="q" defaultValue={sp.q} placeholder="Name, DS code or phone" className={`${sel} pl-9`} />
        </div>
        <select name="client" defaultValue={sp.client ?? ""} className={sel} aria-label="Client">
          <option value="">All clients</option><option value="none">Not assigned</option>
          {opts.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="site" defaultValue={sp.site ?? ""} className={sel} aria-label="Site">
          <option value="">All sites</option>
          {opts.sites.filter((s) => !sp.client || s.clientId === sp.client).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="nationality" defaultValue={sp.nationality ?? ""} className={sel} aria-label="Nationality">
          <option value="">All nationalities</option>{opts.nationalities.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select name="job" defaultValue={sp.job ?? ""} className={sel} aria-label="Job">
          <option value="">All jobs</option>{opts.jobs.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className={sel} aria-label="Status">
          <option value="">Any status</option><option value="active">Active</option><option value="leave">On leave</option><option value="terminated">Terminated</option>
        </select>
        <select name="expiry" defaultValue={sp.expiry ?? ""} className={sel} aria-label="Document expiry">
          <option value="">Any expiry</option><option value="expired">Expired docs</option><option value="7">Expiring ≤ 7 days</option><option value="15">Expiring ≤ 15 days</option><option value="30">Expiring ≤ 30 days</option>
        </select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-8">
          <button className="btn btn-navy btn-sm">Apply filters</button>
          {filtered && <Link href="/admin/workers" className="btn btn-sm text-muted hover:text-navy">Clear</Link>}
        </div>
      </form>

      {rows.length === 0 ? (
        <Empty title={filtered ? "No workers match these filters" : "No workers yet"} sub={filtered ? "Try clearing a filter." : "Add your first worker or bulk-import from Excel."}
          action={!filtered && <Link href="/admin/workers/import" className="btn btn-primary btn-sm">Bulk import from Excel</Link>} />
      ) : (
        <>
          <Table head={["DS code", "Name", "Job", "Client / Site", "Nationality", "Visa expiry", "Status"]}>
            {rows.map((w) => {
              const vs = expiryState(w.visaExpiry);
              return (
                <tr key={w.id} className="hover:bg-mist/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{dsCode(w.dsNumber)}</td>
                  <td className="px-4 py-3"><Link href={`/admin/workers/${w.id}`} className="font-semibold text-navy hover:text-orange">{w.fullName}</Link><p className="text-xs text-muted">{w.phone ?? ""}</p></td>
                  <td className="px-4 py-3">{w.jobTitle ?? "—"}</td>
                  <td className="px-4 py-3">{w.clientName ?? <span className="text-muted">In pool</span>}<p className="text-xs text-muted">{w.siteName ?? ""}</p></td>
                  <td className="px-4 py-3">{w.nationality ?? "—"}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-2">{fmtDate(w.visaExpiry)}{vs !== "ok" && vs !== "missing" && <Badge status={vs} />}</span></td>
                  <td className="px-4 py-3"><Badge status={w.status} /></td>
                </tr>
              );
            })}
          </Table>
          <Pagination page={page} pages={pages} total={total} makeHref={(p) => qs({ page: p })} />
        </>
      )}
    </>
  );
}
