const TYPE: Record<string, string> = { new_workers: "Workers request", replacement: "Replacement", complaint: "Complaint", salary: "Salary question", accommodation: "Accommodation / transport", documents: "Documents", other: "Other" };
const STATUS: Record<string, [string, string]> = { new: ["Sent", "bg-blue-50 text-blue-700"], in_progress: ["In progress", "bg-amber-50 text-amber-800"], resolved: ["Resolved", "bg-emerald-50 text-emerald-700"], closed: ["Closed", "bg-gray-100 text-gray-600"] };

type R = { r: { id: string; reference: string; type: string; subject: string; details: string | null; status: string; reply: string | null; createdAt: Date; startDate: string | null }; siteName: string | null };

export function RequestList({ items }: { items: R[] }) {
  if (!items.length) return <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">No requests yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map(({ r, siteName }) => {
        const [label, tone] = STATUS[r.status] ?? STATUS.new;
        return (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange">{TYPE[r.type] ?? r.type} · <span className="font-mono">{r.reference}</span></p>
                <p className="mt-1 font-heading font-bold text-navy">{r.subject}</p>
                <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })}{siteName ? ` · ${siteName}` : ""}{r.startDate ? ` · start ${r.startDate}` : ""}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>
            </div>
            {r.details && <p className="mt-3 whitespace-pre-line text-sm">{r.details}</p>}
            {r.reply && <div className="mt-3 rounded-xl bg-mist p-3 text-sm"><p className="text-xs font-bold text-navy">Reply from Holard</p><p className="whitespace-pre-line">{r.reply}</p></div>}
          </li>
        );
      })}
    </ul>
  );
}
