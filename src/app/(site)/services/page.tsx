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
  title: "Services | Manpower Supply, Recruitment & HR Consulting UAE | HOLARD",
  description: "HOLARD services: manpower supply from 50 to 500 workers, recruitment from 10 countries with 48-hour shortlists, and UAE HR consulting.",
};

export default function Services() {
  return (
    <>
      <PageHero image="/images/svc-manpower.jpg" eyebrow="Our Services" title="One Partner For Your Entire Workforce." sub="HR consulting, recruitment and full manpower supply — all under one roof, all UAE compliant." crumbs={[{ label: "Services" }]} />
      <section className="section bg-white">
        <div className="container-site space-y-20 lg:space-y-28">
          {services.map((s, i) => (
            <div key={s.slug} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${i % 2 ? "lg:order-2" : ""}`}>
                <Image src={s.image} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
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
