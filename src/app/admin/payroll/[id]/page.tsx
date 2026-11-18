import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Download, FileSpreadsheet, FileText, Lock, RefreshCw } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { buildSif, getRun, payrollSettings } from "@/server/payroll";
import { approvePayroll, deletePayroll, markPayrollPaid, recalculatePayroll, removeLine } from "@/server/admin/payroll-actions";
import { aed, Badge, dsCode, PageHeader, Stat } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/ActionForm";
import { AdjustLineForm } from "@/components/admin/MoneyForms";

export const metadata = { title: "Payroll" };
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const n = (v: string | number) => Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function PayrollRun({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; issues?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const run = await getRun(id);
  if (!run) notFound();
  const draft = run.status === "draft";
  const sif = buildSif(run, await payrollSettings());
  const issues = run.lines.filter((l) => l.unmarkedDays > 0 || !Number(l.basic) || !l.iban || !l.personId || !l.routingCode);
  const q = sp.q?.toLowerCase();
  const shown = run.lines.filter((l) => (!q || `ds${String(l.dsNumber).padStart(3, "0")} ${l.fullName}`.toLowerCase().includes(q)) && (!sp.issues || issues.includes(l)));
  const sum = (k: "otPay" | "absenceDeduction" | "advanceDeduction" | "allowances") => run.lines.reduce((a, l) => a + Number(l[k]), 0);
  return (
    <>
      <PageHeader title={`Payroll · ${monthLabel(run.month)}`} sub={`${run.clientName ?? "All workers"} · ${run.workers} workers`} back={{ href: "/admin/payroll", label: "Payroll" }}
        actions={<>
          <a href={`/api/admin/payroll/${id}/excel`} className="btn btn-outline btn-sm"><FileSpreadsheet className="h-4 w-4" aria-hidden />Excel</a>
          <a href={`/api/admin/payroll/${id}/payslips`} target="_blank" className="btn btn-outline btn-sm"><FileText className="h-4 w-4" aria-hidden />{draft ? "Preview payslips" : "All payslips (PDF)"}</a>
          {!draft && <a href={`/api/admin/payroll/${id}/sif`} className={`btn btn-sm ${sif.problems.length ? "btn-outline" : "btn-primary"}`}><Download className="h-4 w-4" aria-hidden />WPS SIF file</a>}
        </>} />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <Badge status={draft ? "new" : run.status === "approved" ? "in_progress" : "approved"} label={run.status === "draft" ? "Draft — can be changed" : run.status === "approved" ? "Approved — locked, payslips published" : "Paid"} />
        {draft && (
          <>
            <form action={recalculatePayroll}><input type="hidden" name="id" value={id} /><SubmitButton className="btn btn-outline btn-sm"><RefreshCw className="h-4 w-4" aria-hidden />Recalculate from attendance</SubmitButton></form>
            <form action={approvePayroll}><input type="hidden" name="id" value={id} /><SubmitButton className="btn btn-primary btn-sm"><Lock className="h-4 w-4" aria-hidden />Approve &amp; lock</SubmitButton></form>
            <form action={deletePayroll} className="ml-auto"><input type="hidden" name="id" value={id} /><button className="text-sm font-semibold text-red-600 hover:underline">Delete draft</button></form>
          </>
        )}
        {run.status === "approved" && <form action={markPayrollPaid}><input type="hidden" name="id" value={id} /><SubmitButton className="btn btn-navy btn-sm">Mark salaries as paid</SubmitButton></form>}
        <p className="text-sm text-muted">{draft ? "Approving locks the figures, deducts advances and makes payslips visible to workers." : "Download the WPS file and upload it to your bank / exchange house."}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Net salaries" value={aed(run.net)} tone="brand" />
        <Stat label="Gross" value={aed(run.gross)} />
        <Stat label="Overtime pay" value={aed(sum("otPay"))} />
        <Stat label="Absence deductions" value={aed(sum("absenceDeduction"))} tone="bad" />
        <Stat label="Advances recovered" value={aed(sum("advanceDeduction"))} tone="warn" />
      </div>

      {(issues.length > 0 || sif.problems.length > 0) && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-5 w-5" aria-hidden />{issues.length} worker{issues.length === 1 ? "" : "s"} need attention</p>
          <p className="mt-1 text-amber-900/80">Unmarked attendance days are not deducted — mark them (Attendance) and recalculate. Missing bank / person ID blocks the WPS file — add them on the worker profile.</p>
          {sif.problems.length > 0 && <><p className="mt-3 font-semibold text-amber-900">WPS file {draft ? "will be blocked" : "is blocked"} until these are fixed{draft ? " — fix them on the worker profile, then Recalculate" : ""}:</p><ul data-testid="wps-problems" className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-amber-900">{sif.problems.map((p) => <li key={p}>{p}</li>)}</ul></>}
          <Link href={sp.issues ? "?" : "?issues=1"} className="mt-2 inline-block font-semibold text-orange">{sp.issues ? "Show all workers" : "Show only these workers"}</Link>
        </div>
      )}

      <form className="mt-5 flex gap-2"><label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Search name or DS…" className="field !min-h-[44px] !max-w-xs !py-2 text-sm" />{sp.issues && <input type="hidden" name="issues" value="1" />}<button className="btn btn-navy btn-sm">Search</button></form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wider text-muted">
            <tr>{["Worker", "Basic", "P / A / L / UL", "OT h", "OT pay", "+ Allow.", "− Absence", "− Advance", "− Other", "Net", ""].map((h) => <th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.slice(0, 300).map((l) => (
              <tr key={l.id} className="align-top">
                <td className="px-3 py-2.5">
                  <details className="group">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="mr-1.5 font-mono text-xs font-semibold text-orange">{dsCode(l.dsNumber)}</span><span className="font-semibold text-navy">{l.fullName}</span>
                      <span className="block text-xs text-muted">{l.clientName ?? "In pool"}{l.siteName ? ` · ${l.siteName}` : ""}{l.unmarkedDays ? <strong className="text-amber-700"> · {l.unmarkedDays} not marked</strong> : null}{l.note ? ` · ${l.note}` : ""}</span>
                      {draft && <span className="text-xs font-semibold text-orange group-open:hidden">Adjust</span>}
                    </summary>
                    {draft && <div className="mt-3 w-[680px] rounded-xl bg-mist/60 p-3"><AdjustLineForm line={l} /><form action={removeLine} className="mt-2"><input type="hidden" name="lineId" value={l.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Remove worker from this payroll</button></form></div>}
                  </details>
                </td>
                <td className="px-3 py-2.5 tabular-nums">{n(l.basic)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{l.presentDays} / <span className={l.absentDays ? "font-semibold text-red-600" : ""}>{l.absentDays}</span> / {l.paidLeaveDays} / {l.unpaidLeaveDays}</td>
                <td className="px-3 py-2.5 tabular-nums">{Number(l.otHours) || "—"}</td>
                <td className="px-3 py-2.5 tabular-nums">{Number(l.otPay) ? n(l.otPay) : "—"}</td>
                <td className="px-3 py-2.5 tabular-nums">{Number(l.allowances) ? n(l.allowances) : "—"}</td>
                <td className="px-3 py-2.5 tabular-nums text-red-700">{Number(l.absenceDeduction) ? n(l.absenceDeduction) : "—"}</td>
                <td className="px-3 py-2.5 tabular-nums text-amber-700">{Number(l.advanceDeduction) ? n(l.advanceDeduction) : "—"}</td>
                <td className="px-3 py-2.5 tabular-nums">{Number(l.otherDeductions) ? n(l.otherDeductions) : "—"}</td>
                <td className="px-3 py-2.5 font-heading font-bold tabular-nums text-navy">{n(l.net)}</td>
                <td className="px-3 py-2.5"><a href={`/api/payslips/${l.id}`} target="_blank" className="text-xs font-semibold text-orange hover:underline">Payslip</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length > 300 && <p className="mt-2 text-sm text-muted">Showing 300 of {shown.length}. Search to find others.</p>}
      <p className="mt-3 text-xs text-muted">P present · A absent · L paid leave · UL unpaid leave. Absence = (A + UL) × basic ÷ {run.lines[0]?.dayBasis ?? 30}. OT pay = OT hours × the worker&apos;s OT rate (or basic ÷ 30 ÷ shift hours × 1.25).</p>
    </>
  );
}
