import type { Metadata } from "next";
import { LoginCard } from "./LoginCard";
import { redirect } from "next/navigation";
import { getUser, HOME_BY_ROLE } from "@/server/auth";
import { needsSetup } from "@/server/setup-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Login | HOLARD Portal", description: "Sign in to the HOLARD client, employee, investor or admin portal.", robots: { index: false } };

export default async function Login() {
  const user = await getUser();
  if (user) redirect(HOME_BY_ROLE[user.role]);
  if (await needsSetup()) redirect("/setup");
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[radial-gradient(ellipse_at_72%_10%,_var(--color-navy-3),_var(--color-navy)_60%)] pb-16 pt-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-2">
        <div className="text-white">
          <p className="eyebrow">Holard Portal</p>
          <h1 className="h1 mt-5">One Login. Your Whole Workforce.</h1>
          <p className="mt-6 max-w-lg text-lg text-white/75">Clients see their workers, attendance and invoices. Employees see payslips, leave and documents. Investors see approved business numbers.</p>
        </div>
        <LoginCard />
      </div>
    </section>
  );
}
