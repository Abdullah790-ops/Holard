import { desc } from "drizzle-orm";
import { FileText } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { todayDubai } from "@/server/attendance";
import { deleteInvestorDoc, publishInvestorUpdate, toggleInvestorDoc } from "@/server/portal-actions";
import { Badge, Card, fmtDateTime, PageHeader } from "@/components/admin/ui";
import { InvestorDocForm, InvestorUpdateForm } from "@/components/portal/PortalForms";

export const metadata = { title: "Investor Portal" };

export default async function Investors() {
  await requireAdmin();
  const db = await getDb();
  const [docs, updates] = await Promise.all([
    db.select().from(schema.investorDocuments).orderBy(desc(schema.investorDocuments.createdAt)),
    db.select().from(schema.investorUpdates).orderBy(desc(schema.investorUpdates.month), desc(schema.investorUpdates.createdAt)),
  ]);
  const last = new Date(`${todayDubai().slice(0, 7)}-01T00:00:00Z`); last.setUTCMonth(last.getUTCMonth() - 1);
  return (
    <>
      <PageHeader title="Investor Portal" sub="You decide what investors see. Dashboard numbers come from invoices and attendance automatically. Create investor logins in Users & Access." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card title="Upload a document"><InvestorDocForm /></Card>
          <Card title={`Documents (${docs.length})`}>
            <ul className="divide-y divide-line">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <a href={`/api/files/${d.fileId}`} target="_blank" className="flex items-center gap-2"><FileText className="h-4 w-4 text-orange" aria-hidden /><span><span className="block font-semibold text-navy">{d.title}</span><span className="text-xs text-muted">{d.category} · {fmtDateTime(d.createdAt)}</span></span></a>
                  <div className="flex items-center gap-3">
                    <Badge status={d.isVisible ? "approved" : "inactive"} label={d.isVisible ? "Visible" : "Hidden"} />
                    <form action={toggleInvestorDoc}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="visible" value={d.isVisible ? "0" : "1"} /><button className="text-sm font-semibold text-navy hover:text-orange">{d.isVisible ? "Hide" : "Show to investors"}</button></form>
                    <form action={deleteInvestorDoc}><input type="hidden" name="id" value={d.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Delete</button></form>
                  </div>
                </li>
              ))}
              {docs.length === 0 && <li className="py-4 text-muted">No documents yet.</li>}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Monthly investor update"><InvestorUpdateForm month={last.toISOString().slice(0, 7)} /></Card>
          <Card title={`Updates (${updates.length})`}>
            <ul className="divide-y divide-line">
              {updates.map((u) => (
                <li key={u.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="font-semibold text-navy">{u.title}</p><p className="text-xs text-muted">{u.month}</p></div>
                    <div className="flex items-center gap-3">
                      <Badge status={u.isPublished ? "approved" : "new"} label={u.isPublished ? "Published" : "Draft"} />
                      <form action={publishInvestorUpdate}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="publish" value={u.isPublished ? "0" : "1"} /><button className="text-sm font-semibold text-navy hover:text-orange">{u.isPublished ? "Unpublish" : "Publish"}</button></form>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{u.body}</p>
                </li>
              ))}
              {updates.length === 0 && <li className="py-4 text-muted">No updates yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
