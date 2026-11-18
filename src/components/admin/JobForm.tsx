"use client";

import { ActionForm, In } from "./ActionForm";
import { saveJob } from "@/server/admin/misc-actions";

type J = { id: string; title: string; salary: string | null; location: string | null; type: string; description: string | null; isPublished: boolean; sortOrder: number };

export function JobForm({ j }: { j?: J }) {
  return (
    <ActionForm action={saveJob} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" submit={j ? "Save" : "Post job"} resetOnOk={!j}>
      {j && <input type="hidden" name="id" value={j.id} />}
      <In label="Job title" name="title" required defaultValue={j?.title} placeholder="e.g. Warehouse Helper" />
      <In label="Salary" name="salary" defaultValue={j?.salary} placeholder="AED 1,500 – 1,800" />
      <In label="Location" name="location" defaultValue={j?.location} placeholder="Dubai" />
      <In label="Type" name="type" defaultValue={j?.type ?? "Full-time"} options={["Full-time", "Part-time", "Contract", "Temporary"].map((t) => ({ value: t, label: t }))} />
      <In label="Short description (optional)" name="description" defaultValue={j?.description} className="sm:col-span-2 lg:col-span-3" />
      <In label="Order" name="sortOrder" type="number" defaultValue={j?.sortOrder ?? 0} hint="Lower shows first" />
      <label className="col-span-full flex items-center gap-2 text-sm font-semibold text-navy">
        <input type="checkbox" name="isPublished" defaultChecked={j?.isPublished ?? true} className="h-5 w-5 accent-orange" /> Show on website
      </label>
    </ActionForm>
  );
}
