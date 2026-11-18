import { asc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { deleteJob } from "@/server/admin/misc-actions";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { JobForm } from "@/components/admin/JobForm";

export const metadata = { title: "Jobs" };

export default async function Jobs() {
  await requireAdmin();
  const db = await getDb();
  const jobs = await db.select().from(schema.jobs).orderBy(asc(schema.jobs.sortOrder), asc(schema.jobs.createdAt));
  return (
    <>
      <PageHeader title="Jobs" sub="Live jobs shown on the “For New Candidates” page." actions={<a href="/candidates#jobs" target="_blank" className="btn btn-outline btn-sm">View on website</a>} />
      <Card title="Post a new job" className="mb-6"><JobForm /></Card>
      <div className="space-y-3">
        {jobs.map((j) => (
          <details key={j.id} className="group rounded-2xl border border-line bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <div><p className="font-heading font-bold text-navy">{j.title}</p><p className="text-sm text-muted">{[j.salary, j.location, j.type].filter(Boolean).join(" · ")}</p></div>
              <div className="flex items-center gap-3">{j.isPublished ? <Badge status="active" label="Live" /> : <Badge status="inactive" label="Draft" />}<span className="text-sm font-semibold text-orange group-open:hidden">Edit</span></div>
            </summary>
            <div className="border-t border-line p-5">
              <JobForm j={j} />
              <form action={deleteJob} className="mt-4"><input type="hidden" name="id" value={j.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Delete job</button></form>
            </div>
          </details>
        ))}
        {jobs.length === 0 && <p className="text-muted">No jobs yet.</p>}
      </div>
    </>
  );
}
