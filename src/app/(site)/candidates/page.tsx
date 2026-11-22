import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeDollarSign, Bus, Globe2, HeartPulse, Home, MapPin, Plane, UserRoundCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { LeadForm } from "@/components/LeadForm";
import { asc, eq } from "drizzle-orm";
import { countries, jobs as listedJobs } from "@/lib/site";
import { getDb, schema } from "@/db";

export const metadata: Metadata = {
  title: "Jobs in UAE | Apply To Join 1,000+ Talent Pool | HOLARD",
  description: "Apply for warehouse assistant, cleaner, driver, mason, general helper, bike rider and LSA nursing assistant jobs in the UAE. No recruitment fees.",
};

const benefits = [
  { icon: BadgeDollarSign, t: "On-Time Salary", d: "Paid monthly through WPS." },
  { icon: Plane, t: "Visa Provided", d: "Employment visa & Emirates ID." },
  { icon: Home, t: "Accommodation", d: "Clean, shared housing." },
  { icon: Bus, t: "Transport", d: "To and from your site." },
  { icon: HeartPulse, t: "Medical", d: "Health insurance included." },
  { icon: UserRoundCheck, t: "Application Support", d: "Our team guides you through the application process." },
];

export const revalidate = 60; // pre-built; refreshed instantly when admin edits jobs, and at least every 60 s

export default async function Candidates() {
  const db = await getDb();
  const publishedJobs = await db.select().from(schema.jobs).where(eq(schema.jobs.isPublished, true)).orderBy(asc(schema.jobs.sortOrder), asc(schema.jobs.createdAt));
  const listedRolePattern = /warehouse|cleaner|driver|mason|general helper|bike rider|nursing assistant|lsa/i;
  const jobs = [
    ...listedJobs,
    ...publishedJobs.filter((job) => !listedRolePattern.test(job.title)),
  ];
  return (
    <>
      <PageHero image="/images/provided/jobs-candidate.jpg" eyebrow="For New Candidates" title="Find your next job in the UAE." sub="Explore open roles and apply directly. We do not charge candidates an application fee." crumbs={[{ label: "For Candidates" }]}>
        <Link href="#apply" className="btn btn-primary">Apply Now</Link>
        <Link href="#jobs" className="btn btn-outline-light">See Live Jobs</Link>
      </PageHero>

      <section id="jobs" className="section scroll-mt-20 bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Live Jobs" title="Open Positions Now." />
          {jobs.length === 0 && <p className="mt-10 rounded-2xl bg-mist p-8 text-center text-muted">No open positions right now — apply below and we&apos;ll contact you when a matching job opens.</p>}
          <ul className="mt-12 divide-y divide-line overflow-hidden rounded-3xl border border-line empty:hidden">
            {jobs.map((j) => (
              <li key={j.title} className="flex flex-col gap-4 p-6 transition hover:bg-mist sm:flex-row sm:items-center sm:justify-between lg:px-8">
                <div>
                  <h3 className="font-heading text-xl font-bold text-navy">{j.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted"><span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{j.location}</span><span>{j.type}</span>{j.description && <span>{j.description}</span>}</p>
                </div>
                <div className="flex items-center gap-5">
                  <p className="font-heading text-lg font-bold text-ink">{j.salary ?? "Salary on request"}{j.salary && <span className="text-sm font-medium text-muted"> /month</span>}</p>
                  <Link href="#apply" className="btn btn-primary btn-sm">Apply</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src="/images/provided/jobs-benefits.jpg" alt="Candidate reviewing application details on a laptop" fill quality={90} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
          <div>
            <SectionHeading eyebrow="Benefits" title="Everything Taken Care Of." />
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
              {benefits.map(({ icon: I, t, d }) => (
                <li key={t} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange/10 text-orange"><I className="h-5 w-5" aria-hidden /></span>
                  <p className="mt-3 font-heading text-base font-bold leading-snug text-navy sm:text-lg">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="apply" className="section scroll-mt-20 bg-white">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Apply" title="Apply In 2 Minutes." sub="Fill the form and upload your passport. Our team will call you." />
            <div className="mt-8 rounded-2xl bg-orange/10 p-6"><p className="font-heading font-bold text-navy">No fees. Ever.</p><p className="mt-1 text-sm text-muted">Holard never asks candidates for money. If someone does in our name, please report it.</p></div>
          </div>
          <div className="rounded-3xl border border-line p-6 sm:p-10 lg:col-span-8"><LeadForm type="apply" options={{ job: [...jobs.map((j) => j.title), "Other"] }} /></div>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="container-site">
          <SectionHeading light eyebrow="We Recruit From" title="Your Country. Your Opportunity." />
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {countries.map((c) => <li key={c} className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-white/10 px-3 py-4 text-center font-heading text-base font-semibold sm:text-lg"><Globe2 className="h-6 w-6 shrink-0 text-orange" aria-hidden /><span>{c}</span></li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
