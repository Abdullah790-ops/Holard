import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { MediaSplit } from "@/components/MediaSplit";
import { SectionHeading } from "@/components/SectionHeading";
import { LeadForm } from "@/components/LeadForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Careers at HOLARD | Join Our Office Team",
  description: "Join the HOLARD office team in Sharjah & Dubai — recruitment, operations, HR & payroll and business development roles.",
};

const roles = [
  { t: "Recruitment Coordinator", d: "Screen candidates, schedule interviews and manage the talent pool." },
  { t: "Operations Supervisor", d: "Lead site supervisors, attendance and replacements." },
  { t: "HR & Payroll Executive", d: "Run WPS payroll, visas and worker documentation." },
  { t: "Business Development Manager", d: "Win and grow enterprise client accounts." },
];

export default function Careers() {
  return (
    <>
      <PageHero image={null} eyebrow="Careers" title="Build The Company That Builds The UAE." sub="Office roles at Holard. Looking for a worker job? Visit our For Candidates page." crumbs={[{ label: "Careers" }]}>
        <Link href="/candidates" className="btn btn-outline-light">Worker jobs →</Link>
      </PageHero>
      <MediaSplit image={null} alt="Office team photo awaiting approved original">
        <SectionHeading eyebrow="Why Join" title="Fast Growth. Real Impact." sub="We're scaling from 500 to 2,000 workers. Every person in our office directly shapes how hundreds of workers and enterprise clients experience Holard." />
      </MediaSplit>
      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Open Roles" title="We're Hiring." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {roles.map((r) => <div key={r.t} className="rounded-2xl bg-white p-7"><h3 className="font-heading text-xl font-bold text-navy">{r.t}</h3><p className="mt-2 text-muted">{r.d}</p><p className="mt-4 text-sm font-semibold text-orange">Sharjah / Dubai · Full-time</p></div>)}
          </div>
        </div>
      </section>
      <section className="section bg-white">
        <div className="container-site max-w-4xl">
          <SectionHeading eyebrow="Apply" title="Send Your CV." />
          <div className="mt-10 rounded-3xl border border-line p-6 sm:p-10"><LeadForm type="careers" /></div>
        </div>
      </section>
    </>
  );
}
