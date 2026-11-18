import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Quote, UserCheck } from "lucide-react";
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
          <div className="relative min-h-[300px]"><Image src={ind.image} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div>
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="eyebrow">Client Example</p>
            <h2 className="h3 mt-4 text-navy lg:text-3xl">{ind.example.client}</h2>
            <Quote className="mt-6 h-10 w-10 text-orange" aria-hidden />
            <p className="mt-3 text-xl leading-relaxed text-ink">{ind.example.text}</p>
            <p className="mt-6 text-sm font-semibold text-muted">Also trusted by: {ind.clientsLine}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {services.map((s) => <Link key={s.slug} href={`/services/${s.slug}`} className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white">{s.title}</Link>)}
            </div>
          </div>
        </div>
      </section>

      <HireSection title={`Hire ${ind.title} Workers`} defaults={{ industry: ind.title }} />
    </>
  );
}
