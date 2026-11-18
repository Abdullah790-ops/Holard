import { eq } from "drizzle-orm";
import { FileText, UserRound } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getDb, schema } from "@/db";
import { DOC_TYPES } from "@/db/schema";
import { DOC_LABEL, daysUntil, expiryState } from "@/server/admin/workers";
import { listShifts } from "@/server/attendance";

export const metadata = { title: "My Profile" };
const STATE: Record<string, [string, string]> = { ok: ["Valid", "bg-emerald-50 text-emerald-700"], d30: ["Expires within 30 days", "bg-amber-50 text-amber-800"], d15: ["Expires within 15 days", "bg-orange/10 text-orange-dark"], d7: ["Expires within 7 days", "bg-red-50 text-red-700"], expired: ["Expired", "bg-red-100 text-red-800"], missing: ["Not on file", "bg-gray-100 text-gray-600"] };

/** Employee sees only their own record (workerId comes from the session, never from the URL). */
export default async function Profile() {
  const user = await requireUser(["employee"]);
  if (!user.workerId) return null;
  const db = await getDb();
  const [row] = await db.select({ w: schema.workers, client: schema.clients.name, site: schema.sites.name }).from(schema.workers)
    .leftJoin(schema.clients, eq(schema.workers.clientId, schema.clients.id)).leftJoin(schema.sites, eq(schema.workers.siteId, schema.sites.id))
    .where(eq(schema.workers.id, user.workerId));
  const docs = await db.select().from(schema.workerDocuments).where(eq(schema.workerDocuments.workerId, user.workerId));
  const shifts = await listShifts();
  const w = row.w;
  const shift = shifts.find((s) => s.id === w.shiftId) ?? shifts.find((s) => s.isDefault);
  const alerts = docs.filter((d) => ["expired", "d7", "d15", "d30"].includes(expiryState(d.expiryDate)));
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-5 sm:p-7">
        <div className="flex items-center gap-4">
          {w.photoFileId
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={`/api/files/${w.photoFileId}`} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            : <span className="grid h-20 w-20 place-items-center rounded-2xl bg-mist text-navy/40"><UserRound className="h-9 w-9" aria-hidden /></span>}
          <div><h1 className="font-heading text-2xl font-extrabold text-navy">{w.fullName}</h1><p className="font-mono font-bold text-orange">DS{String(w.dsNumber).padStart(3, "0")}</p></div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {[["Job", w.jobTitle], ["Client", row.client], ["Site", row.site], ["Shift", shift ? `${shift.name} ${shift.startTime}–${shift.endTime}` : null], ["Joined", w.joiningDate], ["Phone", w.phone], ["Nationality", w.nationality], ["Emergency contact", [w.emergencyName, w.emergencyPhone].filter(Boolean).join(" · ") || null]].map(([k, v]) => (
            <div key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold text-navy">{v || "—"}</dd></div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-muted">Something wrong? Tell Holard HR in Help — only HR can change your details.</p>
      </section>
      <section className="rounded-3xl bg-white p-5 sm:p-7">
        <h2 className="font-heading text-lg font-bold text-navy">My documents</h2>
        {alerts.length > 0 && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{alerts.length} document{alerts.length === 1 ? "" : "s"} expiring soon — Holard HR will contact you for renewal.</p>}
        <ul className="mt-4 divide-y divide-line">
          {DOC_TYPES.map((t) => {
            const d = docs.find((x) => x.type === t);
            const st = expiryState(d?.expiryDate ?? null);
            const n = daysUntil(d?.expiryDate ?? null);
            const [label, tone] = STATE[st];
            return (
              <li key={t} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><p className="font-semibold text-navy">{DOC_LABEL[t]}</p><p className="text-sm text-muted">{d?.number ?? "—"}{d?.expiryDate ? ` · expires ${d.expiryDate}${n !== null && n >= 0 ? ` (${n} days)` : ""}` : ""}</p></div>
                <div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>{d?.fileId && <a href={`/api/files/${d.fileId}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-orange"><FileText className="h-4 w-4" aria-hidden />View</a>}</div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
