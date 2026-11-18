import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { requireUser, ROLE_LABEL } from "@/server/auth";
import { logout } from "@/server/auth-actions";
import { openApprovalCount } from "@/server/approvals";
import { PortalNav } from "@/components/attendance/PortalNav";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: { default: "My Portal | HOLARD", template: "%s | HOLARD" }, robots: { index: false } };

const TABS: Record<string, { href: string; label: string }[]> = {
  employee: [{ href: "/portal", label: "Today" }, { href: "/portal/attendance", label: "Attendance" }, { href: "/portal/payslips", label: "Payslips" }, { href: "/portal/requests", label: "Leave & Requests" }, { href: "/portal/profile", label: "My Profile" }, { href: "/portal/help", label: "Help" }],
  supervisor: [{ href: "/portal", label: "Today" }, { href: "/portal/mark", label: "Mark Attendance" }, { href: "/portal/approvals", label: "Approvals" }],
  client_admin: [{ href: "/portal", label: "Overview" }, { href: "/portal/team", label: "Our Workers" }, { href: "/portal/sheet", label: "Attendance Sheet" }, { href: "/portal/invoices", label: "Invoices" }, { href: "/portal/service", label: "Requests" }],
  investor: [{ href: "/portal", label: "Dashboard" }, { href: "/portal/reports", label: "Documents & Updates" }],
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/account/password");
  if (user.role === "super_admin") redirect("/admin");
  const tabs = TABS[user.role] ?? [];
  const badge = user.role === "supervisor" ? await openApprovalCount(user) : 0;
  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo href="/portal" height={40} />
          <div className="flex items-center gap-3">
            <div className="text-right"><p className="max-w-[160px] truncate text-sm font-semibold text-navy">{user.name}</p><p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p></div>
            <form action={logout}><button className="grid h-10 w-10 place-items-center rounded-lg border border-line text-navy" aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button></form>
          </div>
        </div>
        {tabs.length > 0 && <PortalNav tabs={[...tabs]} badges={{ "/portal/approvals": badge }} />}
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}
