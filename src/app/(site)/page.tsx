import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, CheckCircle2, Quote } from "lucide-react";
import { homeFaqs, homeServiceCards, howItWorks, industries, site, whyHolard } from "@/lib/site";
import { TrustBar } from "@/components/TrustBar";
import { ClientStrip } from "@/components/ClientStrip";
import { SectionHeading } from "@/components/SectionHeading";
import { Icon } from "@/components/Icon";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { Faq } from "@/components/Faq";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "Manpower, Recruitment & HR Support in the UAE | HOLARD",
  description: "Manpower supply, recruitment and HR support for logistics, construction, hospitality and other employers across the UAE.",
};

const caseStudies = [
  { client: "UAE Logistics Client", where: "Noon Store, UAE", headline: "120 Warehouse Helpers", tag: "Warehouse" },
  { client: "Facilities Client", where: "Multi-site facilities", headline: "24-Hour Replacement", tag: "Facilities" },
  { client: "Logistics Client", where: "Peak season", headline: "On-Time Peak Staffing", tag: "Logistics" },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-navy text-white">
        <Image src="/images/provided/home-hero-warehouse.jpg" alt="Warehouse worker wearing high-visibility safety clothing" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_18%,_var(--color-navy-3),_var(--color-navy)_58%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="container-site w-full pb-12 pt-36 lg:pb-16 lg:pt-44">
          <p className="eyebrow fade-up">{site.tagline}</p>
          <h1 className="h1 fade-up mt-6 max-w-5xl text-white">{site.h1}</h1>
          <p className="fade-up mt-7 max-w-3xl text-lg text-white/80 lg:text-xl">{site.sub}</p>
          <div className="fade-up mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/contact#hire" className="btn btn-primary min-h-14 w-full px-6 text-base sm:w-auto sm:min-h-[60px] sm:px-8 sm:text-lg">Hire Talent <ArrowRight className="h-5 w-5" aria-hidden /></Link>
            <Link href="/candidates#apply" className="btn btn-outline-light min-h-14 w-full px-6 text-base sm:w-auto sm:min-h-[60px] sm:px-8 sm:text-lg">Find a Job</Link>
          </div>
        </div>
      </section>

      <TrustBar />

      <ClientStrip />

      {/* SERVICES */}
      <section className="section bg-white">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="What We Do" title="Workforce Support, From Hiring Through HR." sub="Choose the support your operation needs, from recruitment to ongoing workforce management." />
            <Link href="/services" className="btn btn-outline shrink-0">All Services <ArrowRight className="h-5 w-5" aria-hidden /></Link>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {homeServiceCards.map((s) => (
              <Link key={s.title} href={s.href} className="group card overflow-hidden transition hover:-translate-y-1 hover:border-orange hover:shadow-xl">
                <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                  <Image src={s.image} alt={`${s.title} in a UAE workplace`} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
                  <span className="absolute bottom-5 left-5 grid h-14 w-14 place-items-center rounded-xl border border-white/20 bg-navy/75 text-orange"><Icon name={s.icon} className="h-8 w-8" /></span>
                  <ArrowUpRight className="absolute right-5 top-5 h-6 w-6 text-white transition group-hover:rotate-45" aria-hidden />
                </div>
                <div className="p-7">
                  <h3 className="h3 text-navy">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.short}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-heading font-bold text-orange">Explore service <ArrowRight className="h-4 w-4" aria-hidden /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CASE */}
      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Featured Case" title="120 Warehouse Helpers. One Noon Store. 98% Attendance." />
          <div className="mt-14 grid overflow-hidden rounded-3xl bg-navy text-white lg:grid-cols-2">
            <div className="relative min-h-[320px] overflow-hidden lg:min-h-[520px]">
              <Image src="/images/provided/home-featured-warehouse-case.jpg" alt="Warehouse aisle with a worker supporting logistics operations" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-orange">UAE Logistics Client × Noon Store</p>
              <div className="mt-6 grid grid-cols-3 gap-4 border-y border-white/15 py-6">
                {[["120", "Helpers"], ["98%", "Attendance"], ["48h", "To deploy"]].map(([n, l]) => (
                  <div key={l}><p className="font-heading text-3xl font-extrabold lg:text-4xl">{n}</p><p className="text-sm text-white/65">{l}</p></div>
                ))}
              </div>
              <Quote className="mt-8 h-10 w-10 text-orange" aria-hidden />
              <blockquote className="mt-3 font-heading text-2xl font-semibold leading-snug">“120 warehouse helpers deployed for a Noon store, with 98% daily attendance and clear monthly invoicing.”</blockquote>
              <p className="mt-5 text-white/65">— Operations Manager, UAE logistics client</p>
              <Link href="/clients#case-studies" className="btn btn-primary mt-9 self-start">Read Case Studies <ArrowRight className="h-5 w-5" aria-hidden /></Link>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {caseStudies.map((c, index) => (
              <Link key={c.client} href="/clients#case-studies" className="group relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-navy">
                <Image src={["/images/provided/home-case-construction.jpg", "/images/provided/home-case-facilities.jpg", "/images/provided/home-case-payroll.jpg"][index]} alt={`${c.tag} workforce case study`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <span className="rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wider">{c.tag}</span>
                  <p className="mt-3 font-heading text-2xl font-bold">{c.headline}</p>
                  <p className="text-white/75">{c.client} · {c.where}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY HOLARD */}
      <section className="section bg-white">
        <div className="container-site grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image src="/images/provided/home-why-team.jpg" alt="Colleagues meeting to plan workforce support" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 right-4 rounded-2xl bg-orange p-6 text-white shadow-2xl sm:-right-6 lg:p-8">
              <p className="font-heading text-5xl font-extrabold">24h</p>
              <p className="mt-1 font-semibold">Worker replacement</p>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Why Holard" title="Six Reasons UAE Leaders Choose Us." />
            <ul className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2">
              {whyHolard.map((w) => (
                <li key={w.t}>
                  <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy text-orange"><Icon name={w.icon} className="h-7 w-7" /></span>
                  <h3 className="mt-4 font-heading text-xl font-bold text-navy">{w.t}</h3>
                  <p className="mt-2 text-muted">{w.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="section bg-navy text-white">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading light eyebrow="Industries" title="Built For The Sectors That Build The UAE." />
            <Link href="/industries" className="btn btn-outline-light shrink-0">All Industries <ArrowRight className="h-5 w-5" aria-hidden /></Link>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind) => (
              <Link key={ind.slug} href={`/industries/${ind.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-navy-3 to-navy">
                <div className="absolute inset-0 grid place-items-center"><Icon name={ind.slug === "healthcare" ? "Stethoscope" : ind.slug === "it-technology" ? "Cpu" : "Building2"} className="h-16 w-16 text-white/25" /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent transition group-hover:from-navy-2" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                  <div>
                    <h3 className="font-heading text-2xl font-bold">{ind.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{ind.clientsLine}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange transition group-hover:rotate-45"><ArrowUpRight className="h-5 w-5" aria-hidden /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section bg-white">
        <div className="container-site grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Testimonials" title="Our Clients Say It Best." sub="Enterprise teams across warehouse, facilities and construction trust Holard every day." />
            <Link href="/testimonials" className="btn btn-outline mt-8">All Testimonials <ArrowRight className="h-5 w-5" aria-hidden /></Link>
          </div>
          <div className="lg:col-span-8"><TestimonialSlider count={6} /></div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading center eyebrow="How It Works" title="From Request to Payroll in 4 Steps." />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s, i) => (
              <li key={s.t} className="relative rounded-2xl bg-white p-7">
                <span className="font-heading text-5xl font-extrabold text-orange/90">0{i + 1}</span>
                <h3 className="mt-4 font-heading text-lg font-bold text-navy">{s.t}</h3>
                <p className="mt-2 text-[15px] text-muted">{s.d}</p>
                {i < howItWorks.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 text-navy/30 md:block" aria-hidden />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="FAQ" title="Quick Answers." />
            <ul className="mt-8 space-y-3 text-muted">
              {["WPS-compliant payroll", "Visa & documents handled", "Replacement within 24 hours"].map((t) => (
                <li key={t} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-orange" aria-hidden />{t}</li>
              ))}
            </ul>
            <Link href="/faq" className="btn btn-outline mt-8">View All 25 FAQs</Link>
          </div>
          <div className="lg:col-span-8"><Faq items={homeFaqs} /></div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
