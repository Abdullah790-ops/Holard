import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeDollarSign, Bus, Globe2, HeartPulse, Home, MapPin, Plane, Quote } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { LeadForm } from "@/components/LeadForm";
import { asc, eq } from "drizzle-orm";
import { countries, workerTestimonials } from "@/lib/site";
import { getDb, schema } from "@/db";

export const metadata: Metadata = {
  title: "Jobs in UAE | Apply To Join 1,000+ Talent Pool | HOLARD",
  description: "Apply for helper, cleaner, driver, warehouse and technician jobs in the UAE. Visa, accommodation, transport and medical provided. Salary on time. No recruitment fees.",
};

const benefits = [
  { icon: BadgeDollarSign, t: "On-Time Salary", d: "Paid monthly through WPS." },
  { icon: Plane, t: "Visa Provided", d: "Employment visa & Emirates ID." },
  { icon: Home, t: "Accommodation", d: "Clean, shared housing." },
  { icon: Bus, t: "Transport", d: "To and from your site." },
  { icon: HeartPulse, t: "Medical", d: "Health insurance included." },
];

export const revalidate = 60; // pre-built; refreshed instantly when admin edits jobs, and at least every 60 s

export default async function Candidates() {
  const db = await getDb();
  const jobs = await db.select().from(schema.jobs).where(eq(schema.jobs.isPublished, true)).orderBy(asc(schema.jobs.sortOrder), asc(schema.jobs.createdAt));
  return (
    <>
      <PageHero image="/images/candidates-hero.jpg" eyebrow="For New Candidates" title="Join 1,000+ Talent Pool. Work With Noon, Farnek, Ceva." sub="Real jobs in the UAE with visa, housing, transport and on-time salary. Holard never charges candidates any fee." crumbs={[{ label: "For Candidates" }]}>
        <Link href="#apply" className="btn btn-primary">Apply Now</Link>
        <Link href="#jobs" className="btn btn-outline-light">See Live Jobs</Link>
      </PageHero>

      <section id="jobs" className="section scroll-mt-20 bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Live Jobs" title="Open Positions Now." />
          {jobs.length === 0 && <p className="mt-10 rounded-2xl bg-mist p-8 text-center text-muted">No open positions right now — apply below and we&apos;ll contact you when a matching job opens.</p>}
          <ul className="mt-12 divide-y divide-line overflow-hidden rounded-3xl border border-line empty:hidden">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-col gap-4 p-6 transition hover:bg-mist sm:flex-row sm:items-center sm:justify-between lg:px-8">
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src="/images/candidates-benefits.jpg" alt="Smiling Holard worker" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div>
          <div>
            <SectionHeading eyebrow="Benefits" title="Everything Taken Care Of." />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {benefits.map(({ icon: I, t, d }) => (
                <li key={t} className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange text-white"><I className="h-6 w-6" aria-hidden /></span><div><p className="font-heading text-lg font-bold text-navy">{t}</p><p className="text-muted">{d}</p></div></li>
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

      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Success Stories" title="Workers Who Joined Holard." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {workerTestimonials.map((w) => (
              <figure key={w.name} className="rounded-2xl bg-white p-7">
                <Quote className="h-8 w-8 text-orange" aria-hidden />
                <blockquote className="mt-3 text-lg">“{w.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-4"><Image src={w.photo} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" /><div><p className="font-heading font-bold text-navy">{w.name}</p><p className="text-sm text-muted">{w.role}</p></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="container-site">
          <SectionHeading light eyebrow="We Recruit From" title="Your Country. Your Opportunity." />
          <ul className="mt-12 flex flex-wrap gap-3">
            {countries.map((c) => <li key={c} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 font-heading font-semibold"><Globe2 className="h-5 w-5 text-orange" aria-hidden />{c}</li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
