import { notFound } from "next/navigation";
import { Download, FileSpreadsheet, RefreshCw, Send, Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { todayDubai } from "@/server/attendance";
import { getInvoice, invNo } from "@/server/invoicing";
import { markInvoiceSent, regenerateInvoice, removeInvoiceLine, voidInvoice } from "@/server/admin/invoice-actions";
import { aed, Badge, Card, dsCode, fmtDate, PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/ActionForm";
import { AddInvoiceLineForm, InvoiceNotesForm, PaymentForm } from "@/components/admin/MoneyForms";

export const metadata = { title: "Invoice" };
const TONE: Record<string, string> = { draft: "new", sent: "in_progress", partial: "leave", overdue: "rejected", paid: "approved", void: "inactive" };
const n = (v: string | number) => Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const inv = await getInvoice(id);
  if (!inv) notFound();
  const draft = inv.status === "draft";
  const balance = Number(inv.total) - Number(inv.paidAmount);
  const bySite = inv.annex.reduce<Record<string, number>>((a, w) => ((a[w.siteName ?? "—"] = (a[w.siteName ?? "—"] ?? 0) + 1), a), {});
  return (
    <>
      <PageHeader title={`${invNo(inv.number)} · ${inv.clientName}`} sub={`${fmtDate(inv.periodStart)} – ${fmtDate(inv.periodEnd)}`} back={{ href: "/admin/invoices", label: "Invoices" }}
        actions={<>
          <a href={`/api/admin/attendance/export?month=${inv.month}&client=${inv.clientId}`} className="btn btn-outline btn-sm"><FileSpreadsheet className="h-4 w-4" aria-hidden />Attendance sheet</a>
          <a href={`/api/admin/invoices/${id}/pdf`} target="_blank" className="btn btn-primary btn-sm"><Download className="h-4 w-4" aria-hidden />{draft ? "Preview PDF" : "Invoice PDF"}</a>
        </>} />
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <Badge status={TONE[inv.state]} label={inv.state.charAt(0).toUpperCase() + inv.state.slice(1)} />
        {draft && (
          <>
            <form action={regenerateInvoice}><input type="hidden" name="id" value={id} /><SubmitButton className="btn btn-outline btn-sm"><RefreshCw className="h-4 w-4" aria-hidden />Refresh from attendance</SubmitButton></form>
            <form action={markInvoiceSent}><input type="hidden" name="id" value={id} /><SubmitButton className="btn btn-primary btn-sm"><Send className="h-4 w-4" aria-hidden />Mark as sent (lock)</SubmitButton></form>
          </>
        )}
        {inv.state !== "void" && Number(inv.paidAmount) === 0 && <form action={voidInvoice} className="ml-auto"><input type="hidden" name="id" value={id} /><button className="text-sm font-semibold text-red-600 hover:underline">Void invoice</button></form>}
        <p className="text-sm text-muted">{draft ? "Check the lines, then mark as sent. Download the PDF and attendance sheet to email the client." : `Issued ${fmtDate(inv.issueDate)} · due ${fmtDate(inv.dueDate)}`}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Lines">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr><th className="py-2 pr-3">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 pl-4 text-right">Rate</th><th className="py-2 text-right">Amount (AED)</th>{draft && <th />}</tr></thead>
                <tbody className="divide-y divide-line">
                  {inv.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 pr-3">{l.description}</td>
                      <td className="py-2.5 text-right tabular-nums">{Number(l.quantity).toLocaleString()} {l.unit !== "item" && <span className="text-muted">{l.unit}s</span>}</td>
                      <td className="py-2.5 pl-4 text-right tabular-nums">{n(l.rate)}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{n(l.amount)}</td>
                      {draft && <td className="py-2.5 pl-3 text-right"><form action={removeInvoiceLine}><input type="hidden" name="lineId" value={l.id} /><button aria-label="Remove line" className="text-muted hover:text-red-600"><Trash2 className="h-4 w-4" /></button></form></td>}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-sm">
                  <tr><td colSpan={3} className="pt-3 text-right text-muted">Subtotal</td><td className="pt-3 text-right tabular-nums">{n(inv.subtotal)}</td></tr>
                  <tr><td colSpan={3} className="text-right text-muted">VAT {Number(inv.vatRate)}%</td><td className="text-right tabular-nums">{n(inv.vatAmount)}</td></tr>
                  <tr><td colSpan={3} className="pt-1 text-right font-heading text-lg font-bold text-navy">Total</td><td className="pt-1 text-right font-heading text-lg font-bold tabular-nums text-navy">{aed(inv.total)}</td></tr>
                </tfoot>
              </table>
            </div>
            {draft && <div className="mt-5 rounded-xl bg-mist/60 p-4"><AddInvoiceLineForm id={id} /></div>}
          </Card>
          <Card title={`Annex · ${inv.annex.length} workers (DS codes)`}>
            <p className="mb-3 text-sm text-muted">{Object.entries(bySite).map(([s, c]) => `${s}: ${c}`).join(" · ")}</p>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">DS code</th><th className="py-2">Name</th><th className="py-2">Site</th><th className="py-2 text-right">Days</th><th className="py-2 text-right">OT h</th></tr></thead>
                <tbody className="divide-y divide-line">{inv.annex.map((w) => <tr key={w.id}><td className="py-1.5 font-mono text-xs font-semibold text-orange">{dsCode(w.dsNumber)}</td><td className="py-1.5">{w.fullName}</td><td className="py-1.5 text-muted">{w.siteName}</td><td className="py-1.5 text-right tabular-nums">{w.days}</td><td className="py-1.5 text-right tabular-nums">{Number(w.otHours) || ""}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Payment">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-mist p-3"><dt className="text-muted">Paid</dt><dd className="font-heading text-lg font-bold text-emerald-700">{aed(inv.paidAmount)}</dd></div>
              <div className="rounded-xl bg-mist p-3"><dt className="text-muted">Balance</dt><dd className={`font-heading text-lg font-bold ${inv.state === "overdue" ? "text-red-600" : "text-navy"}`}>{aed(inv.state === "void" ? 0 : balance)}</dd></div>
            </dl>
            {inv.payments.length > 0 && (
              <ul className="mt-4 divide-y divide-line text-sm">{inv.payments.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{fmtDate(p.date)} · {p.method}{p.reference ? ` · ${p.reference}` : ""}</span><strong className="tabular-nums">{n(p.amount)}</strong></li>)}</ul>
            )}
            {!draft && inv.state !== "void" && balance > 0.004 && <div className="mt-5"><PaymentForm id={id} balance={balance} today={todayDubai()} /></div>}
            {draft && <p className="mt-4 text-sm text-muted">Mark the invoice as sent to start recording payments.</p>}
          </Card>
          <Card title="Bill to">
            <p className="font-semibold text-navy">{inv.clientName}</p>
            <p className="text-sm text-muted">{inv.clientTrn ? `TRN ${inv.clientTrn}` : "No TRN on file"}</p>
            {inv.clientAddress && <p className="mt-1 whitespace-pre-line text-sm text-muted">{inv.clientAddress}</p>}
          </Card>
          {draft ? <Card title="Notes"><InvoiceNotesForm id={id} notes={inv.notes} /></Card> : inv.notes && <Card title="Notes"><p className="whitespace-pre-line text-sm">{inv.notes}</p></Card>}
        </div>
      </div>
    </>
  );
}
