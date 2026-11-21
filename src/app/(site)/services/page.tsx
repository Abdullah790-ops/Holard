import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { SectionHeading } from "@/components/SectionHeading";
import { services } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services | HR Consulting, Recruitment & Staffing UAE | HOLARD",
  description: "Explore HR consulting, permanent recruitment, manpower supply, warehouse staffing, construction contracts, payroll, hospitality, healthcare, driver, and facilities staffing.",
};

export default function Services() {
  return (
    <>
      <PageHero image="/images/svc-manpower.jpg" eyebrow="Our Services" title="Workforce support for every stage of hiring." sub="Explore HR consulting, recruitment, and contract staffing services shaped around your organisation." crumbs={[{ label: "Services" }]} />
      <section className="section bg-white">
        <div className="container-site space-y-20 lg:space-y-28">
          {services.map((s, i) => (
            <div key={s.slug} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy shadow-[0_24px_60px_-32px_rgba(8,24,51,0.55)] ${i % 2 ? "lg:order-2" : ""}`}>
                {s.image ? <Image src={s.image} alt={`${s.title} team at work`} fill quality={90} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 hover:scale-[1.03]" /> : <div className="grid h-full place-items-center"><span className="text-6xl font-extrabold text-white/30">0{i + 1}</span></div>}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/20 via-transparent to-white/5" />
              </div>
              <div>
                <p className="font-heading text-6xl font-extrabold text-orange/25">0{i + 1}</p>
                <h2 className="h2 mt-2 text-navy">{s.title}</h2>
                <p className="lead mt-5">{s.short}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.items.slice(0, 6).map((it) => <li key={it.t} className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-navy">{it.t}</li>)}
                </ul>
                <Link href={`/services/${s.slug}`} className="btn btn-primary mt-8">Explore {s.title} <ArrowRight className="h-5 w-5" aria-hidden /></Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Testimonials" title="Trusted By UAE Enterprise." />
          <div className="mt-12"><TestimonialSlider count={9} /></div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
