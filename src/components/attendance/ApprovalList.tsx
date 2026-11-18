import { CalendarDays, Clock, FileText, Wallet } from "lucide-react";
import { approveRequest, rejectRequest, cancelRequest } from "@/server/attendance-actions";
import type { ApprovalItem } from "@/server/approvals";
import { Badge, fmtDateTime } from "../admin/ui";

const ICON = { leave: CalendarDays, overtime: Clock, advance: Wallet };
const STATUS_LABEL: Record<string, string> = { pending: "Waiting for supervisor", supervisor_approved: "Supervisor approved · waiting for admin", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" };
const TONE: Record<string, string> = { pending: "new", supervisor_approved: "in_progress", approved: "approved", rejected: "rejected", cancelled: "done" };

export function ApprovalList({ items, mode }: { items: ApprovalItem[]; mode: "admin" | "supervisor" | "worker" }) {
  if (!items.length) return <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center text-muted">Nothing here.</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const I = ICON[it.kind];
        const canDecide = (mode === "supervisor" && it.status === "pending") || (mode === "admin" && (it.status === "pending" || it.status === "supervisor_approved"));
        return (
          <li key={`${it.kind}-${it.id}`} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mist text-navy"><I className="h-5 w-5" aria-hidden /></span>
                <div>
                  {mode !== "worker" && <p className="font-semibold text-navy"><span className="mr-2 font-mono text-xs text-orange">DS{String(it.ds).padStart(3, "0")}</span>{it.name}{it.clientName && <span className="font-normal text-muted"> · {it.clientName}</span>}</p>}
                  <p className={mode === "worker" ? "font-semibold text-navy" : "text-sm text-ink"}>{it.summary}</p>
                  <p className="text-xs text-muted">Requested {fmtDateTime(it.createdAt)}</p>
                </div>
              </div>
              <Badge status={TONE[it.status]} label={STATUS_LABEL[it.status]} />
            </div>
            {it.detail && <p className="mt-3 whitespace-pre-line rounded-xl bg-mist/60 px-4 py-2.5 text-sm">{it.detail}</p>}
            {it.fileId && <a href={`/api/files/${it.fileId}`} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-orange"><FileText className="h-4 w-4" aria-hidden />Attachment</a>}
            {(it.supervisorNote || it.supervisorName) && <p className="mt-2 text-xs text-muted">Supervisor{it.supervisorName ? ` ${it.supervisorName}` : ""}: {it.supervisorNote ?? "approved"}</p>}
            {it.adminNote && <p className="mt-1 text-xs text-muted">Admin: {it.adminNote}</p>}
            {canDecide && (
              <form action={approveRequest} className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                <input type="hidden" name="kind" value={it.kind} /><input type="hidden" name="id" value={it.id} />
                <label htmlFor={`note-${it.id}`} className="sr-only">Note</label>
                <input id={`note-${it.id}`} name="note" placeholder="Note (optional)" className="field !min-h-[44px] flex-1 !py-2 text-sm" maxLength={500} />
                <div className="flex gap-2">
                  <button type="submit" formAction={approveRequest} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700">{mode === "supervisor" ? "Approve → admin" : "Approve"}</button>
                  <button type="submit" formAction={rejectRequest} className="btn btn-sm btn-outline">Reject</button>
                </div>
              </form>
            )}
            {mode === "worker" && it.status === "pending" && (
              <form action={cancelRequest} className="mt-3"><input type="hidden" name="kind" value={it.kind} /><input type="hidden" name="id" value={it.id} /><button className="text-sm font-semibold text-muted hover:text-red-600">Cancel request</button></form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
