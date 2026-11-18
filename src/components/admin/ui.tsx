import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PageHeader({ title, sub, actions, back }: { title: string; sub?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-navy"><ChevronLeft className="h-4 w-4" aria-hidden />{back.label}</Link>}
        <h1 className="font-heading text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 lg:px-6">
          <h2 className="font-heading text-base font-bold text-navy">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5 lg:p-6">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone = "default" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" | "brand" }) {
  const dot = { default: "bg-navy/30", good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500", brand: "bg-orange" }[tone];
  return (
    <div className="rounded-2xl border border-line bg-white p-5 lg:p-6">
      <p className="flex items-center gap-2 text-sm font-medium text-muted"><span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />{label}</p>
      <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-navy tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

const badgeTone: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  leave: "bg-amber-50 text-amber-800 ring-amber-600/20",
  terminated: "bg-gray-100 text-gray-600 ring-gray-500/20",
  inactive: "bg-gray-100 text-gray-600 ring-gray-500/20",
  disabled: "bg-gray-100 text-gray-600 ring-gray-500/20",
  new: "bg-blue-50 text-blue-700 ring-blue-600/20",
  interviewed: "bg-violet-50 text-violet-700 ring-violet-600/20",
  selected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  deployed: "bg-navy text-white ring-navy",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-600/20",
  done: "bg-gray-100 text-gray-600 ring-gray-500/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  expired: "bg-red-50 text-red-700 ring-red-600/20",
  d7: "bg-red-50 text-red-700 ring-red-600/20",
  d15: "bg-orange/10 text-orange-dark ring-orange/30",
  d30: "bg-amber-50 text-amber-800 ring-amber-600/20",
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  missing: "bg-gray-100 text-gray-600 ring-gray-500/20",
};
const badgeLabel: Record<string, string> = { leave: "On leave", in_progress: "In progress", d7: "≤ 7 days", d15: "≤ 15 days", d30: "≤ 30 days", ok: "Valid", missing: "Missing" };

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeTone[status] ?? badgeTone.done}`}>
      {label ?? badgeLabel[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
    </span>
  );
}

export function Empty({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <p className="font-heading text-lg font-bold text-navy">{title}</p>
      {sub && <p className="mx-auto mt-1 max-w-md text-muted">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Table({ head, children, minWidth = 760 }: { head: React.ReactNode[]; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wider text-muted">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, makeHref }: { page: number; pages: number; total: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return <p className="mt-4 text-sm text-muted">{total.toLocaleString()} result{total === 1 ? "" : "s"}</p>;
  const cls = "grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy hover:border-navy";
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-muted">{total.toLocaleString()} results · page {page} of {pages}</p>
      <div className="flex gap-2">
        {page > 1 ? <Link className={cls} href={makeHref(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Link> : <span className={`${cls} opacity-40`} aria-hidden><ChevronLeft className="h-4 w-4" /></span>}
        {page < pages ? <Link className={cls} href={makeHref(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Link> : <span className={`${cls} opacity-40`} aria-hidden><ChevronRight className="h-4 w-4" /></span>}
      </div>
    </nav>
  );
}

export function Field({ label, name, error, children, hint, className = "" }: { label: string; name: string; error?: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${name}-err`} className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" }) : "—";
export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) : "—";
export const dsCode = (n: number) => `DS${String(n).padStart(3, "0")}`;
export const aed = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "—" : `AED ${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
