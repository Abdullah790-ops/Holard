import { asc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { getSetting, listShifts } from "@/server/attendance";
import { assignShift, deleteShift } from "@/server/admin/settings-actions";
import { Card, PageHeader } from "@/components/admin/ui";
import { GeneralSettingsForm, ShiftForm } from "@/components/admin/SettingsForms";
import { PayrollInvoiceSettingsForm } from "@/components/admin/MoneyForms";
import { payrollSettings } from "@/server/payroll";
import { invoiceSettings } from "@/server/invoicing";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireAdmin();
  const db = await getDb();
  const [pay, inv] = await Promise.all([payrollSettings(), invoiceSettings()]);
  const [shifts, att, leave, ot, sites, usage] = await Promise.all([
    listShifts(), getSetting("attendance"), getSetting("leave"), getSetting("overtime"),
    db.select({ id: schema.sites.id, name: schema.sites.name, client: schema.clients.name }).from(schema.sites).innerJoin(schema.clients, eq(schema.sites.clientId, schema.clients.id)).where(eq(schema.sites.status, "active")).orderBy(asc(schema.clients.name), asc(schema.sites.name)),
    db.select({ shiftId: schema.workers.shiftId, n: sql<number>`count(*)::int` }).from(schema.workers).groupBy(schema.workers.shiftId),
  ]);
  const used = Object.fromEntries(usage.map((u) => [u.shiftId ?? "none", u.n]));
  return (
    <>
      <PageHeader title="Settings" sub="Shifts, weekly off, leave and overtime rules. Site GPS and check-in rules are set on each client's page." />
      <div className="space-y-6">
        <Card title="Payroll, WPS & invoices"><PayrollInvoiceSettingsForm p={pay} i={inv} /></Card>
        <Card title="General"><GeneralSettingsForm weeklyOff={att.weeklyOff} annualDays={leave.annualDays} normalMultiplier={ot.normalMultiplier} nightMultiplier={ot.nightMultiplier} /></Card>
        <Card title="Shifts">
          <p className="mb-4 text-sm text-muted">Workers without a shift use the default shift ({used.none ?? 0} workers). Late = check-in after start time + grace minutes.</p>
          <div className="space-y-3">
            {shifts.map((s) => (
              <details key={s.id} className="group rounded-xl border border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span><strong className="text-navy">{s.name}</strong> <span className="text-muted">· {s.startTime}–{s.endTime} · {Number(s.standardHours)} h{s.isDefault ? " · default" : ""} · {used[s.id] ?? 0} workers</span></span>
                  <span className="text-sm font-semibold text-orange group-open:hidden">Edit</span>
                </summary>
                <div className="border-t border-line p-4">
                  <ShiftForm s={s} />
                  {!s.isDefault && !used[s.id] && <form action={deleteShift} className="mt-3"><input type="hidden" name="id" value={s.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Delete shift</button></form>}
                </div>
              </details>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-mist/60 p-4"><p className="mb-3 font-semibold text-navy">Add a shift</p><ShiftForm /></div>
        </Card>
        <Card title="Assign a shift to a whole site">
          <form action={assignShift} className="flex flex-wrap gap-3">
            <label htmlFor="as-site" className="sr-only">Site</label>
            <select id="as-site" name="siteId" required className="field !min-h-[44px] !w-auto flex-1 !py-2 text-sm"><option value="">Choose site…</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.client} · {s.name}</option>)}</select>
            <label htmlFor="as-shift" className="sr-only">Shift</label>
            <select id="as-shift" name="shiftId" className="field !min-h-[44px] !w-auto !py-2 text-sm"><option value="">Default shift</option>{shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}</select>
            <button className="btn btn-navy btn-sm">Assign to all workers at site</button>
          </form>
        </Card>
      </div>
    </>
  );
}
