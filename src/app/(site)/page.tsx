import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Quote } from "lucide-react";
import { clients, homeFaqs, howItWorks, industries, services, site, stats, whyHolard } from "@/lib/site";
import { StatsCounter } from "@/components/StatsCounter";
import { ClientStrip } from "@/components/ClientStrip";
import { SectionHeading } from "@/components/SectionHeading";
import { Icon } from "@/components/Icon";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { Faq } from "@/components/Faq";
import { CtaBanner } from "@/components/CtaBanner";

const caseStudies = [
  { client: "Al Wafiq", where: "Noon Store, UAE", headline: "120 Warehouse Helpers", img: "/images/case-alwafiq.jpg", tag: "Warehouse" },
  { client: "Farnek", where: "Multi-site facilities", headline: "24-Hour Replacement", img: "/images/case-farnek.jpg", tag: "Facilities" },
  { client: "Ceva Logistics", where: "Peak season", headline: "On-Time Peak Staffing", img: "/images/case-ceva.jpg", tag: "Logistics" },
];

export default function Home() {
  const alWafiq = clients[0];
  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-navy text-white">
        <video className="absolute inset-0 -z-20 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster="/images/hero-poster.jpg" aria-hidden>
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 via-navy/50 to-transparent" />
        <div className="container-site w-full pb-12 pt-36 lg:pb-16 lg:pt-44">
          <p className="eyebrow fade-up">{site.tagline}</p>
          <h1 className="h1 fade-up mt-6 max-w-5xl text-white lg:!text-[68px]">
            We Don&apos;t Just Supply Workers. <span className="text-orange">We Architect The Workforce</span> Behind UAE&apos;s Empire.
          </h1>
          <p className="fade-up mt-7 max-w-3xl text-lg text-white/80 lg:text-xl">{site.sub}</p>
          <div className="fade-up mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/contact#hire" className="btn btn-primary !min-h-[60px] !px-8 !text-lg">Hire 10–500 Workers <ArrowRight className="h-5 w-5" aria-hidden /></Link>
            <Link href="/candidates#apply" className="btn btn-outline-light !min-h-[60px] !px-8 !text-lg">Apply For Job</Link>
          </div>
          <div className="mt-14 lg:mt-20">
            <StatsCounter dark items={[stats[1], stats[2], stats[0], { ...stats[3], suffix: "" }]} />
          </div>
        </div>
      </section>

      <ClientStrip />

      {/* SERVICES */}
      <section className="section bg-white">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="What We Do" title="Three Ways We Power Your Business." sub="From one HR question to 500 workers on site — one partner, one invoice." />
            <Link href="/services" className="btn btn-outline shrink-0">All Services <ArrowRight className="h-5 w-5" aria-hidden /></Link>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {services.map((s, i) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={s.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 font-heading text-sm font-bold text-navy">0{i + 1}</span>
                </div>
                <div className="p-7 lg:p-8">
                  <h3 className="h3 flex items-center justify-between text-navy">{s.title}<ArrowUpRight className="h-6 w-6 text-orange transition group-hover:rotate-45" aria-hidden /></h3>
                  <p className="mt-3 text-muted">{s.short}</p>
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
            <div className="relative min-h-[320px] lg:min-h-[520px]">
              <Image src="/images/case-alwafiq.jpg" alt="Warehouse with rows of stock ready for picking" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-orange">Al Wafiq × Noon Store UAE</p>
              <div className="mt-6 grid grid-cols-3 gap-4 border-y border-white/15 py-6">
                {[["120", "Helpers"], ["98%", "Attendance"], ["48h", "To deploy"]].map(([n, l]) => (
                  <div key={l}><p className="font-heading text-3xl font-extrabold lg:text-4xl">{n}</p><p className="text-sm text-white/65">{l}</p></div>
                ))}
              </div>
              <Quote className="mt-8 h-10 w-10 text-orange" aria-hidden />
              <blockquote className="mt-3 font-heading text-2xl font-semibold leading-snug">“{alWafiq.quote}”</blockquote>
              <p className="mt-5 text-white/65">— {alWafiq.role}, {alWafiq.name}</p>
              <Link href="/clients#case-studies" className="btn btn-primary mt-9 self-start">Read Case Studies <ArrowRight className="h-5 w-5" aria-hidden /></Link>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {caseStudies.map((c) => (
              <Link key={c.client} href="/clients#case-studies" className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={c.img} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
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
              <Image src="/images/why-holard.jpg" alt="Holard technician in a hard hat working on site" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
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
              <Link key={ind.slug} href={`/industries/${ind.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={ind.image} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
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
          <SectionHeading center eyebrow="How It Works" title="From Request To Payroll In 5 Steps." />
          <ol className="mt-16 grid gap-6 md:grid-cols-5">
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
