import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { Badge, dsCode, Empty, fmtDateTime, PageHeader } from "@/components/admin/ui";
import { ReplyForm } from "@/components/portal/PortalForms";

export const metadata = { title: "Requests & Complaints" };
const TYPE: Record<string, string> = { new_workers: "Workers request", replacement: "Replacement", complaint: "Complaint", salary: "Salary question", accommodation: "Accommodation", documents: "Documents", other: "Other" };
const TONE: Record<string, string> = { new: "new", in_progress: "in_progress", resolved: "approved", closed: "done" };

export default async function Requests({ searchParams }: { searchParams: Promise<{ from?: string; status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = await getDb();
  const r = schema.portalRequests;
  const rows = await db.select({ r, client: schema.clients.name, site: schema.sites.name, ds: schema.workers.dsNumber, worker: schema.workers.fullName, by: schema.users.name })
    .from(r).leftJoin(schema.clients, eq(r.clientId, schema.clients.id)).leftJoin(schema.sites, eq(r.siteId, schema.sites.id))
    .leftJoin(schema.workers, eq(r.workerId, schema.workers.id)).leftJoin(schema.users, eq(r.createdBy, schema.users.id))
    .where(sp.status ? eq(r.status, sp.status as "new") : undefined).orderBy(desc(r.createdAt)).limit(200);
  const filtered = rows.filter((x) => !sp.from || (sp.from === "clients" ? !!x.r.clientId : !x.r.clientId));
  const tab = (k: Record<string, string>, label: string) => {
    const on = (sp.from ?? "") === (k.from ?? "") && (sp.status ?? "") === (k.status ?? "");
    return <Link key={label} href={`?${new URLSearchParams(k)}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-navy text-white" : "bg-white text-navy hover:bg-line"}`}>{label}</Link>;
  };
  return (
    <>
      <PageHeader title="Requests & Complaints" sub="From the client portal (workers, replacements, complaints) and the employee help desk." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{tab({}, "All")}{tab({ status: "new" }, "New")}{tab({ from: "clients" }, "From clients")}{tab({ from: "employees" }, "From employees")}{tab({ status: "resolved" }, "Resolved")}</div>
      {filtered.length === 0 ? <Empty title="Nothing here" sub="New portal requests appear here." /> : (
        <ul className="space-y-3">
          {filtered.map(({ r: q, client, site, ds, worker, by }) => (
            <li key={q.id} className={`rounded-2xl border bg-white p-5 ${q.status === "new" ? "border-orange/40" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange">{TYPE[q.type]} · <span className="font-mono">{q.reference}</span></p>
                  <p className="mt-1 font-heading text-lg font-bold text-navy">{q.subject}</p>
                  <p className="text-sm text-muted">{client ? `${client}${site ? ` · ${site}` : ""} · by ${by ?? "client"}` : `Employee ${ds ? dsCode(ds) : ""} ${worker ?? ""}`}{q.workerId && client ? ` · worker ${ds ? dsCode(ds) : ""} ${worker ?? ""}` : ""} · {fmtDateTime(q.createdAt)}{q.startDate ? ` · start ${q.startDate}` : ""}</p>
                </div>
                <Badge status={TONE[q.status]} label={q.status.replace("_", " ")} />
              </div>
              {q.details && <p className="mt-3 whitespace-pre-line rounded-xl bg-mist/60 px-4 py-2.5 text-sm">{q.details}</p>}
              <div className="mt-4 border-t border-line pt-4"><ReplyForm id={q.id} status={q.status} reply={q.reply} /></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
