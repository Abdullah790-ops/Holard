import { FileText } from "lucide-react";
import { requireUser } from "@/server/auth";
import { clientInvoices, clientScope } from "@/server/portal";
import { invNo } from "@/server/invoicing";

export const metadata = { title: "Invoices" };
const TONE: Record<string, string> = { sent: "bg-blue-50 text-blue-700", partial: "bg-amber-50 text-amber-800", overdue: "bg-red-50 text-red-700", paid: "bg-emerald-50 text-emerald-700" };
const n = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const d = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function Invoices() {
  const user = await requireUser(["client_admin"]);
  const rows = await clientInvoices(clientScope(user));
  const balance = rows.reduce((a, r) => a + (r.state === "paid" ? 0 : Number(r.total) - Number(r.paidAmount)), 0);
  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-2xl font-extrabold text-navy">Invoices</h1><p className="text-muted">Balance due: <strong className="text-navy">AED {n(balance)}</strong></p></div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5">
            <div>
              <p className="font-mono font-bold text-navy">{invNo(r.number)}</p>
              <p className="text-sm text-muted">{new Date(`${r.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })} · issued {d(r.issueDate)} · due {d(r.dueDate)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right"><p className="font-heading text-lg font-bold text-navy">AED {n(Number(r.total))}</p>{r.state !== "paid" && <p className="text-xs text-muted">Balance AED {n(Number(r.total) - Number(r.paidAmount))}</p>}</div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[r.state] ?? ""}`}>{r.state.charAt(0).toUpperCase() + r.state.slice(1)}</span>
              <a href={`/api/portal/invoices/${r.id}`} target="_blank" className="btn btn-outline btn-sm"><FileText className="h-4 w-4" aria-hidden />PDF</a>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-muted">No invoices yet.</li>}
      </ul>
    </div>
  );
}
