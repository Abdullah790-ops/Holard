import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarDays, FileText, Plane, Receipt, UserRound } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = { title: "Employee Portal | HOLARD", description: "Holard workers: view your attendance, payslips, leave balance, documents and announcements." };

export default function EmployeePortal() {
  const f = [
    { icon: UserRound, t: "My Profile", d: "DS code, client and site." },
    { icon: CalendarDays, t: "My Attendance", d: "Calendar of every working day." },
    { icon: Receipt, t: "My Salary", d: "Download payslip PDFs." },
    { icon: Plane, t: "My Leave", d: "Apply, see balance and history." },
    { icon: FileText, t: "My Documents", d: "Visa & ID with expiry alerts." },
    { icon: Bell, t: "Announcements", d: "News from Holard." },
  ];
  return (
    <>
      <PageHero image="/images/candidates-benefits.jpg" eyebrow="Employee Portal" title="Your Job. Your Salary. In Your Pocket." sub="Every Holard worker gets a private login. You only ever see your own data." crumbs={[{ label: "Employee Portal" }]}>
        <Link href="/login" className="btn btn-primary">Employee Login</Link>
      </PageHero>
      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="What You Can Do" title="Everything In One Place." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {f.map(({ icon: I, t, d }) => <div key={t} className="rounded-2xl bg-mist p-7"><I className="h-8 w-8 text-orange" aria-hidden /><h3 className="mt-4 font-heading text-xl font-bold text-navy">{t}</h3><p className="mt-1 text-muted">{d}</p></div>)}
          </div>
        </div>
      </section>
    </>
  );
}
