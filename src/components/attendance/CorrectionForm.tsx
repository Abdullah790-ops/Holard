"use client";

import { ActionForm, In } from "../admin/ActionForm";
import { correctAttendance } from "@/server/attendance-actions";

export function CorrectionForm({ workerId, date, cur }: { workerId: string; date: string; cur: { status: string | null; checkIn: string | null; checkOut: string | null; ot: number } }) {
  return (
    <ActionForm action={correctAttendance} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6" submit="Save correction">
      <input type="hidden" name="workerId" value={workerId} />
      <input type="hidden" name="date" value={date} />
      <In label="Status" name="status" defaultValue={cur.status ?? "P"} options={[{ value: "P", label: "Present" }, { value: "A", label: "Absent" }, { value: "L", label: "Leave" }, { value: "OFF", label: "Off" }]} />
      <In label="Check-in" name="checkIn" type="time" defaultValue={cur.checkIn} />
      <In label="Check-out" name="checkOut" type="time" defaultValue={cur.checkOut} />
      <In label="Overtime (h)" name="overtime" type="number" step="0.5" defaultValue={cur.ot || ""} />
      <In label="Reason for correction" name="reason" required className="sm:col-span-2" placeholder="e.g. phone battery dead, confirmed by supervisor" />
    </ActionForm>
  );
}
