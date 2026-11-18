"use client";

import { ActionForm, In } from "./ActionForm";
import { saveGeneralSettings, saveShift, saveSiteCheckin } from "@/server/admin/settings-actions";

type Shift = { id: string; name: string; startTime: string; endTime: string; standardHours: string; graceMinutes: number; isDefault: boolean };

export function ShiftForm({ s }: { s?: Shift }) {
  return (
    <ActionForm action={saveShift} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6" submit={s ? "Save" : "Add shift"} resetOnOk={!s}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <In label="Name" name="name" required defaultValue={s?.name} placeholder="e.g. Day" />
      <In label="Start" name="startTime" type="time" required defaultValue={s?.startTime ?? "08:00"} />
      <In label="End" name="endTime" type="time" required defaultValue={s?.endTime ?? "17:00"} />
      <In label="Normal hours" name="standardHours" type="number" step="0.5" required defaultValue={s ? Number(s.standardHours) : 8} hint="Overtime after this" />
      <In label="Late after (min)" name="graceMinutes" type="number" defaultValue={s?.graceMinutes ?? 15} />
      <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-navy"><input type="checkbox" name="isDefault" defaultChecked={s?.isDefault} className="h-5 w-5 accent-orange" />Default shift</label>
    </ActionForm>
  );
}

export function GeneralSettingsForm({ weeklyOff, annualDays, normalMultiplier, nightMultiplier }: { weeklyOff: string; annualDays: number; normalMultiplier: number; nightMultiplier: number }) {
  return (
    <ActionForm action={saveGeneralSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" submit="Save settings">
      <In label="Weekly day off" name="weeklyOff" defaultValue={weeklyOff} options={["None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => ({ value: d, label: d }))} />
      <In label="Annual leave (days / year)" name="annualDays" type="number" defaultValue={annualDays} hint="UAE law: 30 after 1 year; 2/month after 6 months" />
      <In label="Overtime pay × (normal)" name="normalMultiplier" type="number" step="0.05" defaultValue={normalMultiplier} hint="UAE law: 1.25" />
      <In label="Overtime pay × (night 10pm–4am)" name="nightMultiplier" type="number" step="0.05" defaultValue={nightMultiplier} hint="UAE law: 1.5 — used in payroll (2C)" />
    </ActionForm>
  );
}

export function SiteCheckinForm({ site }: { site: { id: string; checkinMode: string; radiusMeters: number; requireSelfie: boolean; latitude: string | null; longitude: string | null } }) {
  return (
    <ActionForm action={saveSiteCheckin} className="grid gap-3 sm:grid-cols-2" submit="Save check-in settings">
      <input type="hidden" name="id" value={site.id} />
      <In label="Who marks attendance" name="checkinMode" defaultValue={site.checkinMode} className="sm:col-span-2"
        options={[{ value: "both", label: "Workers check in + supervisor can mark" }, { value: "self", label: "Workers check in themselves (GPS)" }, { value: "supervisor", label: "Supervisor marks everyone" }]} />
      <In label="Site latitude" name="latitude" type="number" step="any" defaultValue={site.latitude} hint="From Google Maps: right-click the site → copy" />
      <In label="Site longitude" name="longitude" type="number" step="any" defaultValue={site.longitude} />
      <In label="Allowed distance (metres)" name="radiusMeters" type="number" defaultValue={site.radiusMeters} />
      <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-navy"><input type="checkbox" name="requireSelfie" defaultChecked={site.requireSelfie} className="h-5 w-5 accent-orange" />Selfie required</label>
    </ActionForm>
  );
}
