import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { SectionHeading } from "@/components/SectionHeading";
import { Icon } from "@/components/Icon";
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
              <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_70%_20%,_var(--color-navy-3),_var(--color-navy)_72%)] ${i % 2 ? "lg:order-2" : ""}`}>
                <Icon name={s.icon} className="h-24 w-24 text-white/30" />
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
