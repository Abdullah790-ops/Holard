import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { industries } from "@/lib/site";

export const metadata: Metadata = {
  title: "Industries | Workforce Support for Six UAE Sectors | HOLARD",
  description: "HOLARD provides workforce and recruitment support for logistics, construction, hospitality, oil and gas, healthcare, and technology employers across the UAE.",
};

export default function Industries() {
  return (
    <>
      <PageHero image="/images/logistics-port.jpg" eyebrow="Industries" title="Workforce support for essential UAE industries." sub="Six sectors. One workforce partner." crumbs={[{ label: "Industries" }]} />
      <section className="section bg-white">
        <div className="container-site grid gap-6 md:grid-cols-2">
          {industries.map((ind, i) => (
            <Link key={ind.slug} href={`/industries/${ind.slug}`} className="group card overflow-hidden transition hover:shadow-2xl">
              <div className="relative aspect-[16/9] overflow-hidden bg-navy">
                <Image src={ind.image ?? "/images/ind-industrial.jpg"} alt={`${ind.title} workplace`} fill quality={90} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
                {i === 0 && <span className="absolute left-5 top-5 rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Main sector</span>}
              </div>
              <div className="flex items-start justify-between gap-6 p-7 lg:p-9">
                <div>
                  <h2 className="h3 text-navy lg:text-[26px]">{ind.title}</h2>
                  <p className="mt-2 text-muted">{ind.short}</p>
                  <p className="mt-4 text-sm font-semibold text-orange">{ind.clientsLine}</p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy text-white transition group-hover:rotate-45 group-hover:bg-orange"><ArrowUpRight className="h-5 w-5" aria-hidden /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
