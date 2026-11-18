"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase, Building2, ClipboardList, FileSpreadsheet, Inbox, LayoutDashboard, Menu, ScrollText, UserCog, Users, X, CalendarCheck, Receipt, Wallet, CheckSquare, Settings, CalendarRange, MessageSquareWarning, Megaphone, LineChart,
} from "lucide-react";

const groups = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Workforce",
    items: [
      { href: "/admin/workers", label: "Workers", icon: Users },
      { href: "/admin/clients", label: "Clients & Sites", icon: Building2 },
      { href: "/admin/candidates", label: "Candidates", icon: ClipboardList },
      { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
    ],
  },
  {
    title: "Attendance",
    items: [
      { href: "/admin/attendance", label: "Daily Attendance", icon: CalendarCheck },
      { href: "/admin/attendance/sheet", label: "Monthly Sheet", icon: CalendarRange },
      { href: "/admin/approvals", label: "Approvals", icon: CheckSquare },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/admin/payroll", label: "Payroll & WPS", icon: Wallet },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    title: "Portals",
    items: [
      { href: "/admin/requests", label: "Requests & Complaints", icon: MessageSquareWarning },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/investors", label: "Investor Portal", icon: LineChart },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/inbox", label: "Inbox", icon: Inbox },
      { href: "/admin/users", label: "Users & Access", icon: UserCog },
      { href: "/admin/workers/import", label: "Bulk Import", icon: FileSpreadsheet },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
];

export function Sidebar({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) =>
    href === "/admin" ? path === "/admin"
      : href === "/admin/workers" ? path.startsWith("/admin/workers") && !path.startsWith("/admin/workers/import")
      : href === "/admin/attendance" ? path === "/admin/attendance" || path.startsWith("/admin/attendance/mark")
      : path.startsWith(href);

  const nav = (
    <nav aria-label="Admin" className="space-y-7">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">{g.title}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((it) => {
              const I = it.icon;
              const soon = (it as { soon?: string }).soon;
              if (soon) {
                return (
                  <li key={it.label}>
                    <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-white/35" aria-disabled>
                      <I className="h-5 w-5" aria-hidden />{it.label}
                      <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{soon}</span>
                    </span>
                  </li>
                );
              }
              const on = active(it.href);
              const b = badges[it.href];
              return (
                <li key={it.label}>
                  <Link href={it.href} aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${on ? "bg-orange text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                    <I className="h-5 w-5" aria-hidden />{it.label}
                    {!!b && <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${on ? "bg-white text-orange" : "bg-orange text-white"}`}>{b}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-navy lg:hidden" aria-label="Open menu" aria-expanded={open}>
        <Menu className="h-6 w-6" />
      </button>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto bg-navy px-3 pb-8 pt-24 lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-navy px-3 pb-8 pt-5">
            <button type="button" onClick={() => setOpen(false)} className="mb-4 ml-auto grid h-10 w-10 place-items-center rounded-lg text-white" aria-label="Close menu"><X className="h-6 w-6" /></button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
