import Link from "next/link";
import { asc, ne } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { listApprovals, type Kind } from "@/server/approvals";
import { todayDubai } from "@/server/attendance";
import { Card, dsCode, PageHeader } from "@/components/admin/ui";
import { ApprovalList } from "@/components/attendance/ApprovalList";
import { RequestForms } from "@/components/attendance/RequestForms";

export const metadata = { title: "Approvals" };

export default async function Approvals({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const kind = (["leave", "overtime", "advance"] as const).find((k) => k === sp.kind) as Kind | undefined;
  const open = sp.view !== "all";
  const [items, all, workers] = await Promise.all([
    listApprovals(user, { kind, open }),
    listApprovals(user, { open: true }),
    (await getDb()).select({ id: schema.workers.id, ds: schema.workers.dsNumber, name: schema.workers.fullName }).from(schema.workers).where(ne(schema.workers.status, "terminated")).orderBy(asc(schema.workers.dsNumber)),
  ]);
  const n = (k?: Kind) => all.filter((i) => !k || i.kind === k).length;
  const tab = (k: Kind | undefined, label: string) => (
    <Link key={label} href={`?${new URLSearchParams({ ...(k ? { kind: k } : {}), ...(open ? {} : { view: "all" }) })}`}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${kind === k ? "bg-navy text-white" : "bg-white text-navy hover:bg-line"}`}>
      {label}{n(k) > 0 && <span className="ml-1.5 rounded-full bg-orange px-1.5 text-xs text-white">{n(k)}</span>}
    </Link>
  );
  return (
    <>
      <PageHeader title="Approvals" sub="Worker → Supervisor → Admin. You can approve directly when there is no supervisor." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tab(undefined, "All")}{tab("leave", "Leave")}{tab("overtime", "Overtime")}{tab("advance", "Advances")}
            <Link href={`?${new URLSearchParams({ ...(kind ? { kind } : {}), ...(open ? { view: "all" } : {}) })}`} className="ml-auto text-sm font-semibold text-orange">{open ? "Show history" : "Show only waiting"}</Link>
          </div>
          <ApprovalList items={items} mode="admin" />
        </div>
        <Card title="Create on behalf of a worker" className="h-fit">
          <RequestForms today={todayDubai()} workers={workers.map((w) => ({ id: w.id, label: `${dsCode(w.ds)} — ${w.name}` }))} />
        </Card>
      </div>
    </>
  );
}
