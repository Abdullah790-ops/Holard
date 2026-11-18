"use client";

import { useState } from "react";
import { ActionForm, In } from "../admin/ActionForm";
import { applyAdvance, applyLeave, applyOvertime } from "@/server/attendance-actions";

const TABS = [["leave", "Leave"], ["overtime", "Overtime"], ["advance", "Salary advance"]] as const;

/** Worker requests. When `workers` is given (supervisor/admin), a worker picker is shown. */
export function RequestForms({ today, workers, initial = "leave" }: { today: string; workers?: { id: string; label: string }[]; initial?: string }) {
  const [tab, setTab] = useState(initial);
  const picker = workers && <In label="Worker" name="workerId" required options={workers.map((w) => ({ value: w.id, label: w.label }))} className="sm:col-span-2" />;
  return (
    <div>
      <div role="tablist" aria-label="Request type" className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-mist p-1">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${tab === k ? "bg-white text-navy shadow" : "text-muted"}`}>{l}</button>
        ))}
      </div>
      {tab === "leave" && (
        <ActionForm action={applyLeave} className="grid gap-4 sm:grid-cols-2" submit="Send leave request" resetOnOk>
          {picker}
          <In label="Type" name="type" required defaultValue="annual" options={[{ value: "annual", label: "Annual leave" }, { value: "sick", label: "Sick leave" }, { value: "emergency", label: "Emergency leave" }, { value: "unpaid", label: "Unpaid leave" }]} className="sm:col-span-2" />
          <In label="From" name="startDate" type="date" required defaultValue={today} />
          <In label="To" name="endDate" type="date" required defaultValue={today} />
          <In label="Reason" name="reason" type="textarea" rows={3} className="sm:col-span-2" hint="Required for sick, emergency and unpaid leave" />
          <In label="Medical certificate / document (optional)" name="attachment" type="file" accept=".pdf,image/*" className="sm:col-span-2" />
        </ActionForm>
      )}
      {tab === "overtime" && (
        <ActionForm action={applyOvertime} className="grid gap-4 sm:grid-cols-2" submit="Send overtime request" resetOnOk>
          {picker}
          <In label="Date" name="date" type="date" required defaultValue={today} />
          <In label="Extra hours" name="hours" type="number" step="0.5" required placeholder="e.g. 2" />
          <In label="Reason / work done" name="reason" type="textarea" rows={3} className="sm:col-span-2" />
        </ActionForm>
      )}
      {tab === "advance" && (
        <ActionForm action={applyAdvance} className="grid gap-4 sm:grid-cols-2" submit="Send advance request" resetOnOk>
          {picker}
          <In label="Amount (AED)" name="amount" type="number" required placeholder="e.g. 500" />
          <In label="Repay over (months)" name="repaymentMonths" defaultValue="1" options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} month${n > 1 ? "s" : ""}` }))} />
          <In label="Reason" name="reason" type="textarea" rows={3} required className="sm:col-span-2" />
          <p className="text-xs text-muted sm:col-span-2">Approved advances are deducted from your salary in equal monthly parts.</p>
        </ActionForm>
      )}
    </div>
  );
}
