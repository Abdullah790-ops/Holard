import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { requireAdmin, ROLE_LABEL } from "@/server/auth";
import { logout } from "@/server/auth-actions";
import { getDb, schema } from "@/db";
import { Sidebar } from "@/components/admin/Sidebar";
import { Logo } from "@/components/Logo";
import { openApprovalCount } from "@/server/approvals";

export const metadata: Metadata = { title: { default: "Admin | HOLARD", template: "%s | HOLARD Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  if (user.mustChangePassword) redirect("/account/password");
  const db = await getDb();
  const [[cand], [inbox], approvals, [reqs]] = await Promise.all([
    db.select({ n: count() }).from(schema.candidates).where(eq(schema.candidates.status, "new")),
    db.select({ n: count() }).from(schema.enquiries).where(eq(schema.enquiries.status, "new")),
    openApprovalCount(user),
    db.select({ n: count() }).from(schema.portalRequests).where(eq(schema.portalRequests.status, "new")),
  ]);
  return (
    <div className="min-h-screen bg-mist">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-white px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Sidebar badges={{ "/admin/candidates": cand.n, "/admin/inbox": inbox.n, "/admin/approvals": approvals, "/admin/requests": reqs.n }} />
          <Logo href="/admin" height={40} />
          <span className="hidden font-heading text-sm font-semibold text-muted sm:inline">Back Office</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-semibold text-muted hover:text-navy md:block">View website</Link>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-navy">{user.name}</p>
            <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
          </div>
          <form action={logout}>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-line text-navy hover:border-navy" aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button>
          </form>
        </div>
      </header>
      <main id="main" className="px-4 pb-16 pt-24 lg:ml-64 lg:px-8">{children}</main>
    </div>
  );
}
