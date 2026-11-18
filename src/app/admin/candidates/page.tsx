import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Search } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { CANDIDATE_STATUS } from "@/db/schema";
import { Badge, Empty, fmtDateTime, PageHeader, Pagination, Table } from "@/components/admin/ui";

export const metadata = { title: "Candidates" };
const PAGE = 25;

export default async function Candidates({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = await getDb();
  const c = schema.candidates;
  const where: SQL[] = [];
  if (sp.status && CANDIDATE_STATUS.includes(sp.status as "new")) where.push(eq(c.status, sp.status as "new"));
  if (sp.q) { const l = `%${sp.q.replace(/[%_]/g, "")}%`; where.push(or(ilike(c.fullName, l), ilike(c.phone, l), ilike(c.reference, l))!); }
  const w = where.length ? and(...where) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [rows, [{ n }], counts] = await Promise.all([
    db.select().from(c).where(w).orderBy(desc(c.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(c).where(w),
    db.select({ s: c.status, n: count() }).from(c).groupBy(c.status),
  ]);
  const byStatus = Object.fromEntries(counts.map((r) => [r.s, r.n]));
  const total = counts.reduce((a, r) => a + r.n, 0);
  const tab = (s: string | undefined, label: string, num: number) => {
    const on = (sp.status ?? "") === (s ?? "");
    return <Link key={label} href={s ? `?status=${s}` : "?"} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-navy text-white" : "bg-white text-navy hover:bg-line"}`}>{label} <span className="opacity-60">{num}</span></Link>;
  };
  return (
    <>
      <PageHeader title="Candidates" sub="Applications from the “For New Candidates” page." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tab(undefined, "All", total)}
        {CANDIDATE_STATUS.map((s) => tab(s, s.charAt(0).toUpperCase() + s.slice(1), byStatus[s] ?? 0))}
      </div>
      <form className="mb-5 flex gap-2" role="search">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="q" className="sr-only">Search</label>
          <input id="q" name="q" defaultValue={sp.q} placeholder="Name, phone or reference" className="field !min-h-[44px] !py-2 pl-9 text-sm" />
        </div>
        <button className="btn btn-navy btn-sm">Search</button>
      </form>
      {rows.length === 0 ? <Empty title="No candidates here" sub="New applications from the website appear here automatically." /> : (
        <>
          <Table head={["Reference", "Name", "Job wanted", "Nationality", "Experience", "Location", "Applied", "Status"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-mist/50">
                <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                <td className="px-4 py-3"><Link href={`/admin/candidates/${r.id}`} className="font-semibold text-navy hover:text-orange">{r.fullName}</Link><p className="text-xs text-muted">{r.phone}</p></td>
                <td className="px-4 py-3">{r.jobWanted ?? "—"}</td>
                <td className="px-4 py-3">{r.nationality ?? "—"}</td>
                <td className="px-4 py-3">{r.experienceYears ?? "—"} yrs</td>
                <td className="px-4 py-3">{r.location ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                <td className="px-4 py-3"><Badge status={r.status} /></td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pages={Math.max(1, Math.ceil(n / PAGE))} total={n} makeHref={(p) => `?${new URLSearchParams({ ...(sp as Record<string, string>), page: String(p) })}`} />
        </>
      )}
    </>
  );
}
