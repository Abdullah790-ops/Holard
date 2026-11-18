"use client";

import { useState } from "react";
import { ActionForm, In } from "../admin/ActionForm";
import {
  replyRequest, saveAnnouncement, saveInvestorUpdate, submitClientRequest, submitEmployeeRequest, uploadInvestorDoc,
} from "@/server/portal-actions";

export function ClientRequestForm({ sites, today }: { sites: { id: string; name: string }[]; today: string }) {
  const [type, setType] = useState("new_workers");
  return (
    <div>
      <div role="tablist" aria-label="Request type" className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-mist p-1">
        {([["new_workers", "Request workers"], ["replacement", "Replacement"], ["complaint", "Complaint"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={type === k} onClick={() => setType(k)}
            className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${type === k ? "bg-white text-navy shadow" : "text-muted"}`}>{l}</button>
        ))}
      </div>
      <ActionForm key={type} action={submitClientRequest} className="grid gap-4 sm:grid-cols-2" submit="Send request" resetOnOk>
        <input type="hidden" name="type" value={type} />
        <In label="Site" name="siteId" options={sites.map((s) => ({ value: s.id, label: s.name }))} required={type === "new_workers"} />
        {type === "new_workers" && (
          <>
            <In label="Role needed" name="category" required options={["Warehouse Helper", "General Helper", "Cleaner", "Driver", "Technician", "Labourer", "Supervisor", "Hospitality Staff", "Other"].map((v) => ({ value: v, label: v }))} />
            <In label="Number of workers" name="quantity" type="number" required />
            <In label="Start date" name="startDate" type="date" required defaultValue={today} />
          </>
        )}
        {type === "replacement" && <In label="Worker DS code to replace (optional)" name="workerDs" placeholder="e.g. DS045" />}
        <In label={type === "new_workers" ? "Details (shift, skills, duration)" : "Details"} name="details" type="textarea" rows={4} required={type !== "new_workers"} className="sm:col-span-2" />
      </ActionForm>
    </div>
  );
}

export function EmployeeHelpForm() {
  return (
    <ActionForm action={submitEmployeeRequest} className="grid gap-4" submit="Send to Holard HR" resetOnOk>
      <In label="Topic" name="type" required defaultValue="complaint" options={[{ value: "complaint", label: "Complaint" }, { value: "salary", label: "Salary question" }, { value: "accommodation", label: "Accommodation / transport" }, { value: "documents", label: "Documents (visa, ID, letter)" }, { value: "other", label: "Other" }]} />
      <In label="Subject" name="subject" required placeholder="Short title" />
      <In label="Tell us more" name="details" type="textarea" rows={5} required />
    </ActionForm>
  );
}

export function ReplyForm({ id, status, reply }: { id: string; status: string; reply: string | null }) {
  return (
    <ActionForm action={replyRequest} className="grid gap-3 sm:grid-cols-4" submit="Save reply">
      <input type="hidden" name="id" value={id} />
      <In label="Status" name="status" defaultValue={status} options={[{ value: "new", label: "New" }, { value: "in_progress", label: "In progress" }, { value: "resolved", label: "Resolved" }, { value: "closed", label: "Closed" }]} />
      <In label="Reply (shown to the requester)" name="reply" type="textarea" rows={2} defaultValue={reply} className="sm:col-span-3" />
    </ActionForm>
  );
}

export function AnnouncementForm() {
  return (
    <ActionForm action={saveAnnouncement} className="grid gap-4 sm:grid-cols-3" submit="Publish announcement" resetOnOk>
      <In label="Title" name="title" required className="sm:col-span-2" />
      <In label="Who sees it" name="audience" defaultValue="all" options={[{ value: "all", label: "Everyone with a login" }, { value: "employees", label: "Employees (workers)" }, { value: "supervisors", label: "Supervisors" }, { value: "clients", label: "Clients" }, { value: "investors", label: "Investors" }]} />
      <In label="Message" name="body" type="textarea" rows={4} required className="sm:col-span-2" />
      <In label="Hide after (optional)" name="expiresOn" type="date" />
    </ActionForm>
  );
}

export function InvestorDocForm() {
  return (
    <ActionForm action={uploadInvestorDoc} className="grid gap-4 sm:grid-cols-3" submit="Upload document" resetOnOk>
      <In label="Title" name="title" required placeholder="e.g. Financial summary Q3 2026" />
      <In label="Category" name="category" defaultValue="Financial summary" options={["Trade licence", "Financial summary", "Contract", "Company profile", "Pitch deck", "Other"].map((v) => ({ value: v, label: v }))} />
      <In label="File (PDF, image or Word)" name="file" type="file" required accept=".pdf,.doc,.docx,image/*" />
      <In label="Note (optional)" name="notes" className="sm:col-span-2" />
      <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-navy"><input type="checkbox" name="isVisible" className="h-5 w-5 accent-orange" />Visible to investors now</label>
    </ActionForm>
  );
}

export function InvestorUpdateForm({ month }: { month: string }) {
  return (
    <ActionForm action={saveInvestorUpdate} className="grid gap-4 sm:grid-cols-3" submit="Save update" resetOnOk>
      <In label="Month" name="month" type="month" required defaultValue={month} />
      <In label="Title" name="title" required className="sm:col-span-2" placeholder="e.g. October 2026 update" />
      <In label="Letter to investors" name="body" type="textarea" rows={8} required className="sm:col-span-3" />
      <label className="flex items-center gap-2 text-sm font-semibold text-navy"><input type="checkbox" name="publish" className="h-5 w-5 accent-orange" />Publish now</label>
    </ActionForm>
  );
}
