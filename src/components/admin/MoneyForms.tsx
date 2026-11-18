"use client";

import { ActionForm, In } from "./ActionForm";
import { adjustLine, createPayroll, savePayrollSettings } from "@/server/admin/payroll-actions";
import { addInvoiceLine, createInvoice, recordPayment, saveInvoiceNotes } from "@/server/admin/invoice-actions";

type Opt = { id: string; name: string };

export function CreatePayrollForm({ clients, month }: { clients: Opt[]; month: string }) {
  return (
    <ActionForm action={createPayroll} className="grid gap-4 sm:grid-cols-3" submit="Calculate payroll">
      <In label="Salary month" name="month" type="month" required defaultValue={month} />
      <In label="Workers" name="clientId" options={clients.map((c) => ({ value: c.id, label: `${c.name} only` }))} hint="Empty = all workers not yet in a payroll this month" />
    </ActionForm>
  );
}

export function AdjustLineForm({ line }: { line: { id: string; allowances: string; otherDeductions: string; note: string | null } }) {
  return (
    <ActionForm action={adjustLine} className="grid gap-3 sm:grid-cols-4" submit="Save">
      <input type="hidden" name="lineId" value={line.id} />
      <In label="Allowances / bonus (AED)" name="allowances" type="number" step="0.01" defaultValue={Number(line.allowances) || ""} />
      <In label="Other deductions (AED)" name="otherDeductions" type="number" step="0.01" defaultValue={Number(line.otherDeductions) || ""} />
      <In label="Note on payslip" name="note" defaultValue={line.note} className="sm:col-span-2" placeholder="e.g. Food allowance, damaged uniform" />
    </ActionForm>
  );
}

export function CreateInvoiceForm({ clients, month }: { clients: Opt[]; month: string }) {
  return (
    <ActionForm action={createInvoice} className="grid gap-4 sm:grid-cols-3" submit="Create invoice from attendance">
      <In label="Client" name="clientId" required options={clients.map((c) => ({ value: c.id, label: c.name }))} />
      <In label="Month" name="month" type="month" required defaultValue={month} />
    </ActionForm>
  );
}

export function AddInvoiceLineForm({ id }: { id: string }) {
  return (
    <ActionForm action={addInvoiceLine} className="grid gap-3 sm:grid-cols-4" submit="Add line" resetOnOk>
      <input type="hidden" name="id" value={id} />
      <In label="Description" name="description" required className="sm:col-span-3" placeholder="e.g. Transport for extra shift, or discount" />
      <In label="Amount (AED, minus for discount)" name="amount" type="number" step="0.01" required />
    </ActionForm>
  );
}

export function InvoiceNotesForm({ id, notes }: { id: string; notes: string | null }) {
  return (
    <ActionForm action={saveInvoiceNotes} className="grid gap-3" submit="Save notes">
      <input type="hidden" name="id" value={id} />
      <In label="Notes printed on the invoice" name="notes" type="textarea" rows={3} defaultValue={notes} placeholder="e.g. PO number, contract reference" />
    </ActionForm>
  );
}

export function PaymentForm({ id, balance, today }: { id: string; balance: number; today: string }) {
  return (
    <ActionForm action={recordPayment} className="grid gap-3 sm:grid-cols-2" submit="Record payment" resetOnOk>
      <input type="hidden" name="id" value={id} />
      <In label="Amount (AED)" name="amount" type="number" step="0.01" required defaultValue={balance.toFixed(2)} />
      <In label="Date received" name="date" type="date" required defaultValue={today} />
      <In label="Method" name="method" defaultValue="Bank transfer" options={["Bank transfer", "Cheque", "Cash", "Other"].map((m) => ({ value: m, label: m }))} />
      <In label="Reference" name="reference" placeholder="Bank ref / cheque no." />
    </ActionForm>
  );
}

export function PayrollInvoiceSettingsForm({ p, i }: {
  p: { dayBasis: number; establishmentId: string; employerRoutingCode: string };
  i: { vatRate: number; paymentTermsDays: number; companyName: string; companyTrn: string; companyAddress: string; bankDetails: string };
}) {
  return (
    <ActionForm action={savePayrollSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" submit="Save payroll & invoice settings">
      <In label="Daily rate for deductions" name="dayBasis" defaultValue={String(p.dayBasis)} options={[{ value: "30", label: "Basic ÷ 30 (calendar days)" }, { value: "26", label: "Basic ÷ 26 (working days)" }]} />
      <In label="Employer establishment ID (MOL, 13 digits)" name="establishmentId" defaultValue={p.establishmentId} hint="Needed for the WPS SIF file" />
      <In label="Employer bank routing code (9 digits)" name="employerRoutingCode" defaultValue={p.employerRoutingCode} hint="From your WPS bank / exchange house" />
      <In label="VAT rate (%)" name="vatRate" type="number" step="0.01" defaultValue={i.vatRate} />
      <In label="Default payment terms (days)" name="paymentTermsDays" type="number" defaultValue={i.paymentTermsDays} />
      <In label="Company name on invoices" name="companyName" defaultValue={i.companyName} />
      <In label="Company TRN (15 digits)" name="companyTrn" defaultValue={i.companyTrn} hint="Shown as TAX INVOICE when set" />
      <In label="Company address" name="companyAddress" defaultValue={i.companyAddress} className="lg:col-span-2" />
      <In label="Bank details printed on invoices" name="bankDetails" type="textarea" rows={3} defaultValue={i.bankDetails} className="sm:col-span-2 lg:col-span-3" placeholder={"Bank: …\nAccount name: …\nIBAN: AE…"} />
    </ActionForm>
  );
}
