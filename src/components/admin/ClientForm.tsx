"use client";

import { ActionForm, In } from "./ActionForm";
import { saveClient, addSite } from "@/server/admin/client-actions";

type C = { id: string; name: string; short: string | null; trn: string | null; industry: string | null; contactName: string | null; contactPhone: string | null; contactEmail: string | null; address: string | null; contractedHeadcount: number; monthlyRate: string | null; dailyRate: string | null; billingBasis: string; otRate: string | null; paymentTermsDays: number; status: string };
const INDUSTRIES = ["Warehouse & Logistics", "Cleaning & Facilities", "Construction & Real Estate", "Hospitality & Hotels", "Oil & Gas / Industrial", "Retail & Offices", "Bulk Manpower"];

export function ClientForm({ c }: { c?: C }) {
  return (
    <ActionForm action={saveClient} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" submit={c ? "Save client" : "Create client"}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <In label="Client name" name="name" required defaultValue={c?.name} />
      <In label="Short code (logo initials)" name="short" defaultValue={c?.short} hint="e.g. AW, EFS" />
      <In label="Industry" name="industry" defaultValue={c?.industry} options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
      <In label="TRN (VAT number)" name="trn" defaultValue={c?.trn} hint="15 digits" />
      <In label="Contracted headcount" name="contractedHeadcount" type="number" defaultValue={c?.contractedHeadcount ?? 0} hint="Workers the client has ordered" />
      <In label="Status" name="status" defaultValue={c?.status ?? "active"} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
      <In label="Rate per worker / month (AED)" name="monthlyRate" type="number" step="0.01" defaultValue={c?.monthlyRate} />
      <In label="Rate per worker / day (AED)" name="dailyRate" type="number" step="0.01" defaultValue={c?.dailyRate} />
      <In label="Invoice by" name="billingBasis" defaultValue={c?.billingBasis ?? "per_day"} options={[{ value: "per_day", label: "Days present × daily rate" }, { value: "per_month", label: "Monthly rate (pro-rated)" }]} />
      <In label="Overtime billing rate (AED / hour)" name="otRate" type="number" step="0.01" defaultValue={c?.otRate} hint="Empty = overtime not billed" />
      <In label="Payment terms (days)" name="paymentTermsDays" type="number" defaultValue={c?.paymentTermsDays ?? 30} />
      <div className="hidden lg:block" />
      <In label="Contact person" name="contactName" defaultValue={c?.contactName} />
      <In label="Contact phone" name="contactPhone" type="tel" defaultValue={c?.contactPhone} />
      <In label="Contact email" name="contactEmail" type="email" defaultValue={c?.contactEmail} />
      <In label="Billing address" name="address" type="textarea" rows={2} defaultValue={c?.address} className="sm:col-span-2 lg:col-span-3" />
    </ActionForm>
  );
}

export function SiteForm({ clientId }: { clientId: string }) {
  return (
    <ActionForm action={addSite} className="grid gap-4 sm:grid-cols-2" submit="Add site" resetOnOk>
      <input type="hidden" name="clientId" value={clientId} />
      <In label="Site name" name="name" required placeholder="e.g. Noon Warehouse, Jebel Ali" />
      <In label="Emirate" name="emirate" defaultValue="Dubai" options={["Dubai", "Sharjah", "Abu Dhabi", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"].map((e) => ({ value: e, label: e }))} />
      <In label="Address / area" name="address" className="sm:col-span-2" />
      <In label="Latitude (optional)" name="latitude" type="number" step="any" hint="For GPS attendance in 2B" />
      <In label="Longitude (optional)" name="longitude" type="number" step="any" />
    </ActionForm>
  );
}
