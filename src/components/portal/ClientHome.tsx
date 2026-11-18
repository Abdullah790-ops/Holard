import Link from "next/link";
import { ArrowRight, FileText, UsersRound } from "lucide-react";
import type { SessionUser } from "@/server/auth";
import { clientInvoices, clientOverview, clientScope } from "@/server/portal";
import { Announcements } from "./Announcements";

const aed = (n: number) => `AED ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export async function ClientHome({ user, dateLabel }: { user: SessionUser; dateLabel: string }) {
  const clientId = clientScope(user);
  const [{ client, perSite, summary }, invs] = await Promise.all([clientOverview(clientId), clientInvoices(clientId)]);
  const open = invs.filter((i) => ["sent", "partial", "overdue"].includes(i.state));
  const balance = open.reduce((a, i) => a + Number(i.total) - Number(i.paidAmount), 0);
  const overdue = invs.filter((i) => i.state === "overdue").length;
  const assigned = summary.total;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-navy">{client?.name}</h1>
        <p className="text-muted">{dateLabel} · live attendance for your sites only</p>
      </div>
      <Announcements role={user.role} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Present today", `${summary.P}`, `of ${assigned} workers`, "text-emerald-700"],
          ["Absent", `${summary.A}`, `${summary.L} on leave`, "text-red-600"],
          ["Not marked yet", `${summary.unmarked}`, "attendance in progress", "text-amber-700"],
          ["Workers on contract", `${assigned}/${client?.contractedHeadcount ?? 0}`, assigned < (client?.contractedHeadcount ?? 0) ? `${(client?.contractedHeadcount ?? 0) - assigned} short — Holard is filling` : "fully staffed", "text-navy"],
        ].map(([k, v, s, c]) => (
          <div key={k} className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-muted">{k}</p><p className={`mt-1 font-heading text-3xl font-extrabold ${c}`}>{v}</p><p className="text-xs text-muted">{s}</p></div>
        ))}
      </div>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-heading text-lg font-bold text-navy">Today by site</h2>
        <ul className="mt-3 divide-y divide-line">
          {perSite.map((s) => {
            const pct = s.total ? Math.round((s.P / s.total) * 100) : 0;
            return (
              <li key={s.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3"><Link href={`/portal/team?site=${s.id}`} className="font-semibold text-navy hover:text-orange">{s.name}</Link><span className="text-sm tabular-nums"><strong>{s.P}</strong>/{s.total} present · {s.A} absent · {s.L} leave{s.unmarked ? ` · ${s.unmarked} not marked` : ""}</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist" role="img" aria-label={`${pct}% present`}><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
              </li>
            );
          })}
          {perSite.length === 0 && <li className="py-3 text-muted">No sites yet.</li>}
        </ul>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/invoices" className="flex items-center justify-between rounded-2xl bg-navy p-5 text-white">
          <span className="flex items-center gap-3"><FileText className="h-6 w-6 text-orange" aria-hidden /><span><span className="block text-sm text-white/70">Balance due</span><strong className="font-heading text-xl">{aed(balance)}</strong>{overdue > 0 && <span className="block text-xs text-orange">{overdue} overdue</span>}</span></span>
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        <Link href="/portal/service" className="flex items-center justify-between rounded-2xl border border-line bg-white p-5">
          <span className="flex items-center gap-3"><UsersRound className="h-6 w-6 text-orange" aria-hidden /><span><span className="block font-heading font-bold text-navy">Need more workers?</span><span className="text-sm text-muted">Request workers, a replacement, or raise a complaint</span></span></span>
          <ArrowRight className="h-5 w-5 text-navy" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
