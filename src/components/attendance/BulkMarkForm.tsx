"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Loader2, MapPinOff, Clock } from "lucide-react";
import { bulkMark } from "@/server/attendance-actions";
import { useKeepAction } from "../useKeepAction";

export type MarkRow = {
  workerId: string; ds: string; name: string; job: string | null; site: string | null;
  status: "P" | "A" | "L" | "OFF" | null; ot: number; checkIn: string | null; late: boolean; outside: boolean; source: string | null;
};
type FormState = { error?: string; ok?: string } | undefined;

const OPTS = [
  { v: "P", label: "P", title: "Present", on: "bg-emerald-600 text-white border-emerald-600" },
  { v: "A", label: "A", title: "Absent", on: "bg-red-600 text-white border-red-600" },
  { v: "L", label: "L", title: "Leave", on: "bg-amber-500 text-white border-amber-500" },
  { v: "OFF", label: "Off", title: "Weekly off", on: "bg-gray-500 text-white border-gray-500" },
] as const;

export function BulkMarkForm({ rows, date, readOnlyLeave = true }: { rows: MarkRow[]; date: string; readOnlyLeave?: boolean }) {
  const [state, onSubmit, pending] = useKeepAction(bulkMark, undefined as FormState);
  const [val, setVal] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.workerId, r.status ?? ""])));
  const [q, setQ] = useState("");
  const shown = useMemo(() => rows.filter((r) => !q || `${r.ds} ${r.name}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const counts = Object.values(val).reduce<Record<string, number>>((a, v) => ((a[v || "none"] = (a[v || "none"] ?? 0) + 1), a), {});
  const markAll = (s: string) => setVal((cur) => Object.fromEntries(rows.map((r) => [r.workerId, cur[r.workerId] && cur[r.workerId] !== "" ? cur[r.workerId] : s])));

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="date" value={date} />
      <div className="sticky top-16 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-mist/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <button type="button" onClick={() => markAll("P")} className="btn btn-navy btn-sm"><CheckCheck className="h-4 w-4" aria-hidden />Mark unmarked as Present</button>
        <label htmlFor="mark-q" className="sr-only">Search worker</label>
        <input id="mark-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or DS…" className="field !min-h-[40px] !w-48 !py-1.5 text-sm" />
        <p className="text-sm text-muted" aria-live="polite">
          <strong className="text-emerald-700">{counts.P ?? 0} P</strong> · <strong className="text-red-700">{counts.A ?? 0} A</strong> · <strong className="text-amber-700">{counts.L ?? 0} L</strong> · {counts.OFF ?? 0} Off · {counts.none ?? 0} not marked
        </p>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm ml-auto">{pending ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : `Save attendance`}</button>
      </div>
      {state?.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{state.ok}</p>}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((r) => {
          const v = val[r.workerId] ?? "";
          const hidden = !shown.includes(r);
          const lockedLeave = readOnlyLeave && r.source === "leave";
          return (
            <li key={r.workerId} className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center ${hidden ? "hidden" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy"><span className="mr-2 font-mono text-xs text-orange">{r.ds}</span>{r.name}</p>
                <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  <span>{r.job ?? "—"}{r.site ? ` · ${r.site}` : ""}</span>
                  {r.checkIn && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />In {r.checkIn}{r.late && <strong className="text-orange-dark"> late</strong>}</span>}
                  {r.outside && <span className="inline-flex items-center gap-1 font-semibold text-red-600"><MapPinOff className="h-3 w-3" aria-hidden />outside site</span>}
                  {lockedLeave && <span className="font-semibold text-amber-700">Approved leave</span>}
                </p>
              </div>
              <fieldset className="flex items-center gap-1.5" disabled={lockedLeave}>
                <legend className="sr-only">Attendance for {r.name}</legend>
                <input type="hidden" name={`s_${r.workerId}`} value={v} />
                {OPTS.map((o) => (
                  <button key={o.v} type="button" title={o.title} aria-pressed={v === o.v} onClick={() => setVal((c) => ({ ...c, [r.workerId]: c[r.workerId] === o.v ? "" : o.v }))}
                    className={`h-11 min-w-11 rounded-lg border-2 px-2 font-heading text-sm font-bold transition disabled:opacity-50 ${v === o.v ? o.on : "border-line bg-white text-muted hover:border-navy"}`}>{o.label}</button>
                ))}
                <label className="ml-2 flex items-center gap-1 text-xs text-muted">OT
                  <input name={`ot_${r.workerId}`} type="number" inputMode="decimal" min={0} max={12} step={0.5} defaultValue={r.ot || ""} disabled={v !== "P"}
                    className="field !h-11 !min-h-0 !w-16 !px-2 !py-1 text-center text-sm disabled:bg-mist" aria-label={`Overtime hours for ${r.name}`} />
                </label>
              </fieldset>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-4 py-10 text-center text-muted">No active workers at this site.</li>}
      </ul>
    </form>
  );
}
