import { FileText } from "lucide-react";
import { requireUser } from "@/server/auth";
import { investorLibrary } from "@/server/portal";

export const metadata = { title: "Documents & Updates" };

export default async function Reports() {
  await requireUser(["investor"]);
  const { docs, updates } = await investorLibrary();
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="lg:col-span-3">
        <h1 className="mb-3 font-heading text-2xl font-extrabold text-navy">Monthly investor updates</h1>
        {updates.length === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-muted">No updates published yet.</p> : (
          <div className="space-y-4">
            {updates.map((u) => (
              <article key={u.id} className="rounded-2xl border border-line bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-orange">{new Date(`${u.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
                <h2 className="mt-1 font-heading text-xl font-bold text-navy">{u.title}</h2>
                <div className="mt-3 whitespace-pre-line text-ink">{u.body}</div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="lg:col-span-2">
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">Documents</h2>
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id}><a href={`/api/files/${d.fileId}`} target="_blank" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 hover:border-navy"><FileText className="h-5 w-5 shrink-0 text-orange" aria-hidden /><span><span className="block font-semibold text-navy">{d.title}</span><span className="text-xs text-muted">{d.category}{d.notes ? ` · ${d.notes}` : ""}</span></span></a></li>
          ))}
          {docs.length === 0 && <li className="rounded-2xl bg-white p-6 text-center text-muted">No documents shared yet.</li>}
        </ul>
        <p className="mt-4 text-xs text-muted">Every download is recorded. Investors see business information only — never worker personal data.</p>
      </section>
    </div>
  );
}
