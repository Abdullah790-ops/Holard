"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, Upload } from "lucide-react";
import { importAction } from "@/server/admin/import-actions";
import { SubmitButton } from "./ActionForm";

export function ImportForm() {
  const [s, action] = useActionState(importAction, undefined);
  const r = s?.report;

  if (s?.done !== undefined) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
        <h2 className="h3 mt-4 text-navy">{s.done.toLocaleString()} workers imported</h2>
        <p className="mt-2 text-muted">DS codes were assigned automatically.</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/admin/workers" className="btn btn-primary btn-sm">View workers</Link><Link href="/admin/workers/import" className="btn btn-outline btn-sm" onClick={() => location.reload()}>Import another file</Link></div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <form action={action} className="rounded-2xl border border-line bg-white p-6 lg:p-8">
          <h2 className="font-heading text-lg font-bold text-navy">1. Upload your Excel file</h2>
          <p className="mt-1 text-sm text-muted">We check every row first. Nothing is saved until you confirm.</p>
          <label htmlFor="file" className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-mist/60 px-6 py-10 text-center hover:border-orange">
            <Upload className="h-8 w-8 text-orange" aria-hidden />
            <span className="font-semibold text-navy">Choose .xlsx file</span>
            <span className="text-sm text-muted">Max 5 MB · 2,000 rows</span>
            <input id="file" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="mt-2 text-sm" />
          </label>
          {s?.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{s.error}</p>}
          <div className="mt-5"><SubmitButton>Check file</SubmitButton></div>
        </form>

        {r && (
          <section className="rounded-2xl border border-line bg-white p-6 lg:p-8" aria-live="polite">
            <h2 className="font-heading text-lg font-bold text-navy">2. Review</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-mist p-4"><p className="font-heading text-2xl font-extrabold text-navy">{r.total}</p><p className="text-sm text-muted">Rows found</p></div>
              <div className="rounded-xl bg-emerald-50 p-4"><p className="font-heading text-2xl font-extrabold text-emerald-700">{r.valid}</p><p className="text-sm text-muted">Ready</p></div>
              <div className="rounded-xl bg-red-50 p-4"><p className="font-heading text-2xl font-extrabold text-red-700">{r.errors.length}</p><p className="text-sm text-muted">With errors</p></div>
            </div>
            {r.unknownHeaders.length > 0 && <p className="mt-4 text-sm text-muted">Ignored columns: {r.unknownHeaders.join(", ")}</p>}
            {r.errors.length > 0 ? (
              <div className="mt-5">
                <p className="flex items-center gap-2 font-semibold text-red-700"><AlertTriangle className="h-5 w-5" aria-hidden />Fix these rows in Excel and upload again:</p>
                <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto rounded-xl bg-red-50/60 p-4 text-sm">
                  {r.errors.map((e, i) => <li key={i}><strong>{e.row ? `Row ${e.row}:` : ""}</strong> {e.message}</li>)}
                </ul>
              </div>
            ) : r.token ? (
              <>
                <div className="mt-5 overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-mist/60 text-xs uppercase text-muted"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Job</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Site</th><th className="px-3 py-2">Visa expiry</th></tr></thead>
                    <tbody className="divide-y divide-line">{r.preview.map((p) => <tr key={p.row}><td className="px-3 py-2">{p.row}</td><td className="px-3 py-2 font-medium">{p.fullName}</td><td className="px-3 py-2">{p.jobTitle ?? "—"}</td><td className="px-3 py-2">{p.client ?? "—"}</td><td className="px-3 py-2">{p.site ?? "—"}</td><td className="px-3 py-2">{p.visaExpiry ?? "—"}</td></tr>)}</tbody>
                  </table>
                </div>
                {r.valid > r.preview.length && <p className="mt-2 text-sm text-muted">…and {r.valid - r.preview.length} more.</p>}
                <form action={action} className="mt-5">
                  <input type="hidden" name="token" value={r.token} />
                  <SubmitButton className="btn btn-primary">Import {r.valid.toLocaleString()} workers</SubmitButton>
                </form>
              </>
            ) : <p className="mt-4 text-muted">No worker rows found in the file.</p>}
          </section>
        )}
      </div>
      <aside className="h-fit rounded-2xl border border-line bg-white p-6">
        <h2 className="font-heading text-lg font-bold text-navy">Use the template</h2>
        <p className="mt-2 text-sm text-muted">Same columns as the Workers module: name, nationality, job, client, site, phone, salary, and all four documents with expiry dates.</p>
        <a href="/api/admin/workers/template" className="btn btn-navy btn-sm mt-5"><Download className="h-4 w-4" aria-hidden />Download template</a>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>• Client and Site names must already exist.</li>
          <li>• Dates as YYYY-MM-DD or DD/MM/YYYY.</li>
          <li>• Your own column names like “Name”, “Mobile”, “Designation” are recognised too.</li>
        </ul>
      </aside>
    </div>
  );
}
