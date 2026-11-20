import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCheck, CheckCircle2, Quote, UserCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { HireSection } from "@/components/HireSection";
import { industries, services } from "@/lib/site";

export function generateStaticParams() { return industries.map((s) => ({ slug: s.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = industries.find((x) => x.slug === slug);
  return s ? {
    title: `${s.title} Manpower Supply UAE | HOLARD`,
    description: `${s.short} HOLARD supplies ${s.workers.slice(0, 3).join(", ").toLowerCase()} and more across the UAE — shortlist in 48 hours, replacement in 24 hours.`,
  } : {};
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = industries.find((x) => x.slug === slug);
  if (!ind) notFound();
  return (
    <>
      <PageHero image={ind.image} eyebrow="Industry" title={`${ind.title} Manpower`} sub={ind.short} crumbs={[{ label: "Industries", href: "/industries" }, { label: ind.title }]}>
        <Link href="#hire" className="btn btn-primary">Hire Workers <ArrowRight className="h-5 w-5" aria-hidden /></Link>
      </PageHero>

      <section className="section bg-white">
        <div className="container-site grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="What We Supply" title="Workers Ready For Your Site." />
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {ind.workers.map((w) => <li key={w} className="flex items-center gap-3 rounded-xl bg-mist px-5 py-4 font-heading font-semibold text-navy"><UserCheck className="h-5 w-5 text-orange" aria-hidden />{w}</li>)}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Why Holard" title={`Why ${ind.title.split(" ")[0]} Leaders Choose Us.`} />
            <ul className="mt-10 space-y-5">
              {ind.why.map((w) => <li key={w} className="flex gap-4 text-lg"><CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-orange" aria-hidden />{w}</li>)}
              <li className="flex gap-4 text-lg"><CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-orange" aria-hidden />WPS payroll, visa and documents fully handled</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container-site grid overflow-hidden rounded-3xl bg-white lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="eyebrow">{ind.example.client === "Workforce planning" ? "Workforce Planning" : "Client Example"}</p>
            <h2 className="h3 mt-4 text-navy lg:text-3xl">{ind.example.client}</h2>
            {ind.example.client !== "Workforce planning" && <Quote className="mt-6 h-10 w-10 text-orange" aria-hidden />}
            <p className="mt-3 text-xl leading-relaxed text-ink">{ind.example.text}</p>
            <p className="mt-6 text-sm font-semibold text-muted">{ind.example.client === "Workforce planning" ? "Common settings:" : "Also trusted by:"} {ind.clientsLine}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {services.map((s) => <Link key={s.slug} href={`/services/${s.slug}`} className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white">{s.title}</Link>)}
            </div>
          </div>
          <div className="relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden bg-navy p-8 text-white sm:p-12 lg:p-14">
            <div className="absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full border-[48px] border-white/[0.04]" />
            <div className="absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-orange/15 blur-3xl" />
            <div>
              <p className="eyebrow text-orange">On-site deployment</p>
              <h3 className="mt-4 max-w-md font-heading text-3xl font-extrabold leading-tight sm:text-4xl">A clear plan for every shift.</h3>
              <p className="mt-4 max-w-md leading-relaxed text-white/70">Roles, attendance, and day-to-day coordination are shaped around the work your site needs done.</p>
            </div>
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <span className="text-sm font-semibold text-white/70">Workforce scope</span>
                <span className="rounded-full bg-orange/15 px-3 py-1 text-xs font-bold text-orange">{ind.workers.length} role types</span>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {ind.workers.slice(0, 4).map((worker) => <li key={worker} className="flex items-center gap-2.5 text-sm font-medium text-white/90"><CheckCheck className="h-4 w-4 shrink-0 text-orange" aria-hidden />{worker}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HireSection title={`Hire ${ind.title} Workers`} defaults={{ industry: ind.title }} />
    </>
  );
}
