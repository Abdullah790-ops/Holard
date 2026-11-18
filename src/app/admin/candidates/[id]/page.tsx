import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, FileText, MessageCircle, UserRound } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { convertToWorker, updateCandidate } from "@/server/admin/candidate-actions";
import { Badge, Card, fmtDateTime, PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/ActionForm";

export const metadata = { title: "Candidate" };

export default async function Candidate({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = await getDb();
  const [c] = await db.select().from(schema.candidates).where(eq(schema.candidates.id, id));
  if (!c) notFound();
  const wa = c.phone ? `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${c.fullName.split(" ")[0]}, this is Holard regarding your application ${c.reference}.`)}` : null;
  const files = [["Passport", c.passportFileId], ["CV", c.cvFileId], ["Photo", c.photoFileId]] as const;
  return (
    <>
      <PageHeader title={c.fullName} sub={`${c.reference} · applied ${fmtDateTime(c.createdAt)}`} back={{ href: "/admin/candidates", label: "Candidates" }}
        actions={wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25D366] text-white hover:brightness-95"><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp</a>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Application">
          <div className="flex items-start gap-5">
            {c.photoFileId
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`/api/files/${c.photoFileId}`} alt="" className="h-24 w-24 rounded-2xl object-cover" />
              : <span className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-mist text-navy/40"><UserRound className="h-10 w-10" aria-hidden /></span>}
            <dl className="grid flex-1 gap-4 sm:grid-cols-3">
              {[["Job wanted", c.jobWanted], ["Nationality", c.nationality], ["Age", c.age], ["Phone / WhatsApp", c.phone], ["Current location", c.location], ["Experience", c.experienceYears !== null ? `${c.experienceYears} years` : null]].map(([k, v]) => (
                <div key={String(k)}><dt className="text-sm text-muted">{k}</dt><dd className="font-semibold text-navy">{v ?? "—"}</dd></div>
              ))}
            </dl>
          </div>
          <h3 className="mt-8 font-heading font-bold text-navy">Documents</h3>
          <ul className="mt-3 flex flex-wrap gap-3">
            {files.map(([label, fid]) => (
              <li key={label}>{fid
                ? <a href={`/api/files/${fid}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 font-semibold text-navy hover:border-orange"><FileText className="h-4 w-4 text-orange" aria-hidden />{label}</a>
                : <span className="inline-flex rounded-xl border border-dashed border-line px-4 py-2.5 text-muted">{label}: not uploaded</span>}</li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card title="Status">
            <div className="mb-4"><Badge status={c.status} /></div>
            {c.workerId ? (
              <Link href={`/admin/workers/${c.workerId}`} className="btn btn-navy btn-sm w-full">Open worker profile <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            ) : (
              <>
                <form action={updateCandidate} className="space-y-4">
                  <input type="hidden" name="id" value={c.id} />
                  <div>
                    <label htmlFor="status" className="field-label">Move to</label>
                    <select id="status" name="status" defaultValue={c.status} className="field">
                      <option value="new">New</option><option value="interviewed">Interviewed</option><option value="selected">Selected</option><option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div><label htmlFor="notes" className="field-label">Notes</label><textarea id="notes" name="notes" defaultValue={c.notes ?? ""} rows={4} className="field" placeholder="Interview notes, medical, visa status…" /></div>
                  <SubmitButton className="btn btn-outline btn-sm w-full">Save</SubmitButton>
                </form>
                <form action={convertToWorker} className="mt-5 border-t border-line pt-5">
                  <input type="hidden" name="id" value={c.id} />
                  <p className="mb-3 text-sm text-muted">Creates a worker with a new DS code, copies the photo and passport, and marks the candidate as Deployed.</p>
                  <SubmitButton className="btn btn-primary btn-sm w-full">Move to Worker →</SubmitButton>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
