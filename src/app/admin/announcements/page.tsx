import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { deleteAnnouncement } from "@/server/portal-actions";
import { Card, fmtDateTime, PageHeader } from "@/components/admin/ui";
import { AnnouncementForm } from "@/components/portal/PortalForms";

export const metadata = { title: "Announcements" };
const AUD: Record<string, string> = { all: "Everyone", employees: "Employees", supervisors: "Supervisors", clients: "Clients", investors: "Investors" };

export default async function Announcements() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select().from(schema.announcements).orderBy(desc(schema.announcements.createdAt)).limit(100);
  return (
    <>
      <PageHeader title="Announcements" sub="Shown on the home screen of the portals. (WhatsApp / SMS broadcast comes in Phase 2E.)" />
      <Card title="New announcement" className="mb-6"><AnnouncementForm /></Card>
      <ul className="space-y-3">
        {rows.map((a) => (
          <li key={a.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-heading text-lg font-bold text-navy">{a.title}</p><p className="text-sm text-muted">To {AUD[a.audience]} · {fmtDateTime(a.createdAt)}{a.expiresOn ? ` · until ${a.expiresOn}` : ""}</p></div>
              <form action={deleteAnnouncement}><input type="hidden" name="id" value={a.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Delete</button></form>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm">{a.body}</p>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-muted">No announcements yet.</li>}
      </ul>
    </>
  );
}
