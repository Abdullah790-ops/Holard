"use client";

import { useState } from "react";
import { ActionForm, In, useFieldError } from "./ActionForm";
import { saveWorker } from "@/server/admin/worker-actions";

type Opt = { id: string; name: string };
type Doc = { number: string | null; expiryDate: string | null; fileId: string | null } | null;
type W = {
  id: string; fullName: string; nationality: string | null; jobTitle: string | null; clientId: string | null; siteId: string | null;
  phone: string | null; whatsapp: string | null; emergencyName: string | null; emergencyPhone: string | null; joiningDate: string | null;
  basicSalary: string | null; overtimeRate: string | null; status: string; shiftId: string | null; personId: string | null; iban: string | null; routingCode: string | null;
  docs: Record<"passport" | "emirates_id" | "visa" | "labour_card", Doc>;
};

const DOCS = [["passport", "Passport"], ["emirates_id", "Emirates ID"], ["visa", "Visa"], ["labour_card", "Labour Card"]] as const;
const NATIONALITIES = ["Kenya", "Cameroon", "Uganda", "Sierra Leone", "Chad", "India", "Nepal", "Ghana", "Bangladesh", "Philippines", "Pakistan", "Sri Lanka", "Nigeria", "Other"];
const JOBS = ["Warehouse Helper", "General Helper", "Cleaner", "Driver", "Technician", "Supervisor", "Storekeeper", "Forklift Operator", "Labourer", "Steward", "Office Staff"];

function SiteSelect({ sites, clientId, defaultValue }: { sites: (Opt & { clientId: string })[]; clientId: string; defaultValue?: string | null }) {
  const err = useFieldError("siteId");
  const list = clientId ? sites.filter((s) => s.clientId === clientId) : [];
  return (
    <div>
      <label htmlFor="siteId" className="field-label">Site</label>
      <select id="siteId" name="siteId" className="field" defaultValue={defaultValue ?? ""} key={clientId} disabled={!clientId} aria-invalid={err ? true : undefined}>
        <option value="">{clientId ? (list.length ? "—" : "No sites yet for this client") : "Select a client first"}</option>
        {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {err && <p className="mt-1 text-sm font-medium text-red-600">{err}</p>}
    </div>
  );
}

export function WorkerForm({ worker, clients, sites, shifts = [], defaults }: { worker?: W; clients: Opt[]; sites: (Opt & { clientId: string })[]; shifts?: Opt[]; defaults?: Partial<Record<string, string>> }) {
  const [clientId, setClientId] = useState(worker?.clientId ?? defaults?.clientId ?? "");
  const d = (k: keyof W) => (worker ? (worker[k] as string | null) : defaults?.[k] ?? null);
  const section = "rounded-2xl border border-line bg-white p-5 lg:p-7";
  const grid = "mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <ActionForm action={saveWorker} className="grid gap-6" submit={worker ? "Save changes" : "Create worker"}>
      {worker && <input type="hidden" name="id" value={worker.id} />}
      <fieldset className={section}>
        <legend className="sr-only">Profile</legend>
        <h2 className="font-heading text-lg font-bold text-navy">Profile</h2>
        <div className={grid}>
          <In label="Full name (as in passport)" name="fullName" required defaultValue={d("fullName")} />
          <In label="Nationality" name="nationality" defaultValue={d("nationality")} options={NATIONALITIES.map((n) => ({ value: n, label: n }))} />
          <In label="Job title" name="jobTitle" defaultValue={d("jobTitle")} options={Array.from(new Set([...JOBS, ...(d("jobTitle") ? [d("jobTitle")!] : [])])).map((n) => ({ value: n, label: n }))} />
          <In label="Phone" name="phone" type="tel" defaultValue={d("phone")} placeholder="+971 5X XXX XXXX" />
          <In label="WhatsApp" name="whatsapp" type="tel" defaultValue={d("whatsapp")} />
          <In label="Photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" hint="JPG or PNG, max 5 MB" />
          <In label="Emergency contact name" name="emergencyName" defaultValue={d("emergencyName")} />
          <In label="Emergency contact phone" name="emergencyPhone" type="tel" defaultValue={d("emergencyPhone")} />
          <In label="Status" name="status" defaultValue={d("status") ?? "active"} options={[{ value: "active", label: "Active" }, { value: "leave", label: "On leave" }, { value: "terminated", label: "Terminated" }]} />
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Assignment &amp; pay</legend>
        <h2 className="font-heading text-lg font-bold text-navy">Assignment &amp; pay</h2>
        <div className={grid}>
          <div>
            <label htmlFor="clientId" className="field-label">Client</label>
            <select id="clientId" name="clientId" className="field" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">— Not assigned (in pool) —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <SiteSelect sites={sites} clientId={clientId} defaultValue={worker?.clientId === clientId ? worker?.siteId : null} />
          <In label="Shift" name="shiftId" defaultValue={d("shiftId")} options={shifts.map((x) => ({ value: x.id, label: x.name }))} hint="Empty = default shift" />
          <In label="Joining date" name="joiningDate" type="date" defaultValue={d("joiningDate")} />
          <In label="Basic salary (AED / month)" name="basicSalary" type="number" step="0.01" defaultValue={d("basicSalary")} />
          <In label="Overtime rate (AED / hour)" name="overtimeRate" type="number" step="0.01" defaultValue={d("overtimeRate")} hint="Empty = UAE law: basic ÷ 30 ÷ hours × 1.25" />
          <In label="MOHRE person ID (14 digits)" name="personId" defaultValue={d("personId")} hint="For the WPS salary file" />
          <In label="IBAN / salary card no." name="iban" defaultValue={d("iban")} />
          <In label="Bank / agent routing code (9 digits)" name="routingCode" defaultValue={d("routingCode")} />
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Documents</legend>
        <h2 className="font-heading text-lg font-bold text-navy">Documents</h2>
        <p className="mt-1 text-sm text-muted">Alerts are raised automatically 30, 15 and 7 days before expiry. Upload PDF or image, max 5 MB.</p>
        <div className="mt-5 space-y-5">
          {DOCS.map(([t, label]) => (
            <div key={t} className="grid gap-4 rounded-xl bg-mist/70 p-4 sm:grid-cols-3">
              <In label={`${label} number`} name={`${t}_number`} defaultValue={worker?.docs[t]?.number} />
              <In label={`${label} expiry`} name={`${t}_expiry`} type="date" defaultValue={worker?.docs[t]?.expiryDate} />
              <In label={worker?.docs[t]?.fileId ? `Replace ${label} file` : `${label} file`} name={`${t}_file`} type="file" accept=".pdf,image/jpeg,image/png" />
            </div>
          ))}
        </div>
      </fieldset>
    </ActionForm>
  );
}
