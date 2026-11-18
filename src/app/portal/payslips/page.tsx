import { and, desc, eq, ne } from "drizzle-orm";
import { FileText } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getDb, schema } from "@/db";

export const metadata = { title: "My Payslips" };
const n = (v: string) => Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function MyPayslips() {
  const user = await requireUser(["employee"]);
  if (!user.workerId) return null;
  const db = await getDb();
  const slips = await db.select({ l: schema.payrollLines, status: schema.payrollRuns.status }).from(schema.payrollLines)
    .innerJoin(schema.payrollRuns, eq(schema.payrollLines.runId, schema.payrollRuns.id))
    .where(and(eq(schema.payrollLines.workerId, user.workerId), ne(schema.payrollRuns.status, "draft")))
    .orderBy(desc(schema.payrollLines.month));
  return (
    <div className="rounded-3xl bg-white p-5 sm:p-8">
      <h1 className="font-heading text-2xl font-extrabold text-navy">My payslips</h1>
      <p className="mt-1 text-sm text-muted">Salary is paid through WPS. Tap a month to open the PDF.</p>
      {slips.length === 0 ? <p className="mt-6 rounded-2xl bg-mist p-6 text-center text-muted">No payslips yet. They appear here once your salary is approved.</p> : (
        <ul className="mt-6 space-y-3">
          {slips.map(({ l, status }) => (
            <li key={l.id}>
              <a href={`/api/payslips/${l.id}`} target="_blank" className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4 hover:border-navy">
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-mist text-orange"><FileText className="h-5 w-5" aria-hidden /></span>
                  <span><span className="block font-heading font-bold text-navy">{new Date(`${l.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</span>
                  <span className="text-xs text-muted">{l.presentDays} days present{Number(l.otHours) ? ` · ${Number(l.otHours)} h overtime` : ""}{status === "paid" ? " · Paid" : " · Approved"}</span></span>
                </span>
                <span className="text-right"><span className="block text-xs text-muted">Net</span><span className="font-heading text-lg font-extrabold text-navy">AED {n(l.net)}</span></span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
