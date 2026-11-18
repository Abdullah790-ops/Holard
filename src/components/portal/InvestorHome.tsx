import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SessionUser } from "@/server/auth";
import { investorLibrary, investorMetrics } from "@/server/portal";
import { BarChart } from "@/components/BarChart";
import { Announcements } from "./Announcements";

const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`;
const mLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

/** Investors see business numbers only — never worker names, documents or salaries. */
export async function InvestorHome({ user }: { user: SessionUser }) {
  const [m, lib] = await Promise.all([investorMetrics(), investorLibrary()]);
  const latest = lib.updates[0];
  const shown = (xs: { label: string; value: number }[]) => xs.slice(-6).map((x) => ({ label: mLabel(x.label), value: x.value }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-navy">Investor dashboard</h1>
        <p className="text-muted">Live from the HOLARD system · updated {new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })} (Dubai)</p>
        {m.hasDemo && <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Includes DEMO data — not real company figures</p>}
      </div>
      <Announcements role={user.role} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Revenue (latest month)", m.lastRevenue ? aed(m.lastRevenue.value) : "—", m.lastRevenue ? `${mLabel(m.lastRevenue.label)} · before VAT` : "no invoices yet"],
          ["Active workers", m.activeWorkers.toLocaleString(), "today"],
          ["Active clients", String(m.activeClients), "with workers deployed"],
          ["Invoices paid", aed(m.paid), `${aed(m.pending)} pending${m.overdue ? ` · ${aed(m.overdue)} overdue` : ""}`],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-muted">{k}</p><p className="mt-1 font-heading text-2xl font-extrabold text-navy">{v}</p><p className="text-xs text-muted">{s}</p></div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Revenue by month" unit="AED, before VAT" note="invoices issued · last 6 months" data={shown(m.revenue)} format={(n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)))} />
        <BarChart title="Workers deployed by month" unit="Workers with at least one day present" note="last 6 months" data={shown(m.workersByMonth)} />
      </div>
      <Link href="/portal/reports" className="flex items-center justify-between rounded-2xl bg-navy p-5 text-white">
        <span><span className="block text-sm text-white/70">{latest ? `Latest update · ${mLabel(latest.month)}` : "Documents & monthly updates"}</span><strong className="font-heading text-lg">{latest?.title ?? `${lib.docs.length} document${lib.docs.length === 1 ? "" : "s"} available`}</strong></span>
        <ArrowRight className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  );
}
