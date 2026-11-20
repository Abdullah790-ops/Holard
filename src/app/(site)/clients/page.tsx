import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { ClientLogo } from "@/components/ClientLogo";
import { Stars } from "@/components/Stars";
import { CtaBanner } from "@/components/CtaBanner";
import { clients } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Clients | Workforce Partners Across the UAE | HOLARD",
  description: "HOLARD supports logistics, facilities, construction, and other employers across the UAE with workforce services.",
};

const cases = [
  { client: "UAE Logistics Client", title: "120 Warehouse Helpers at a Noon Store",
    challenge: "A fast-growing Noon store operation needed a large, reliable warehouse team with daily attendance visibility.",
    solution: "Holard deployed 120 warehouse helpers with an on-site supervisor, daily attendance reporting and one monthly invoice.",
    results: [["120", "Helpers deployed"], ["98%", "Daily attendance"], ["1", "Monthly invoice"]] },
  { client: "Facilities Client", title: "Facilities Staff With 24-Hour Replacement",
    challenge: "Multi-site facility contracts with strict SLAs — any absence affects service quality.",
    solution: "Holard supplied trained cleaners and helpers with a guaranteed 24-hour replacement promise.",
    results: [["24h", "Replacement"], ["Multi-site", "Coverage"], ["WPS", "Compliant payroll"]] },
  { client: "Logistics Client", title: "On-Time Warehouse Staff For Peak Season",
    challenge: "Peak season volumes required warehouse staff to be ready on a fixed date.",
    solution: "Holard shortlisted in 48 hours and deployed the full team on schedule with transport arranged.",
    results: [["48h", "Shortlist"], ["On time", "Peak deployment"], ["24h", "Replacement"]] },
];

export default function Clients() {
  return (
    <>
      <PageHero image={null} eyebrow="Our Clients" title="Workforce partners across the UAE." sub="We support logistics, facilities, construction, and other employers with practical staffing services." crumbs={[{ label: "Our Clients" }]} />
      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Client Portfolio" title="Who We Work With." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <div key={c.name} className="rounded-2xl border border-line p-7 transition hover:border-orange hover:shadow-xl">
                <div className="flex items-center gap-4">
                  <ClientLogo name={c.name} />
                  <div><h3 className="font-heading text-xl font-bold text-navy">{c.name}</h3><p className="text-sm font-semibold text-orange">{c.industry}</p></div>
                </div>
                <p className="mt-5 text-muted"><span className="font-semibold text-ink">We supply: </span>{c.supplies}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="case-studies" className="section scroll-mt-20 bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Case Studies" title="Results That Speak." />
          <div className="mt-14 space-y-8">
            {cases.map((c, i) => (
              <article key={c.client} className="grid overflow-hidden rounded-3xl bg-white lg:grid-cols-2">
                <div className={`relative grid min-h-[300px] place-items-center bg-[radial-gradient(ellipse_at_70%_20%,_var(--color-navy-3),_var(--color-navy)_72%)] ${i % 2 ? "lg:order-2" : ""}`}><p className="font-heading text-4xl font-extrabold text-white/20">{c.title}</p></div>
                <div className="p-8 sm:p-12">
                  <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-orange">{c.client}</p>
                  <h3 className="mt-3 font-heading text-2xl font-bold text-navy lg:text-3xl">{c.title}</h3>
                  <dl className="mt-6 space-y-4">
                    <div><dt className="font-semibold text-ink">Challenge</dt><dd className="text-muted">{c.challenge}</dd></div>
                    <div><dt className="font-semibold text-ink">Solution</dt><dd className="text-muted">{c.solution}</dd></div>
                  </dl>
                  <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
                    {c.results.map(([n, l]) => <div key={l}><p className="font-heading text-2xl font-extrabold text-navy lg:text-3xl">{n}</p><p className="text-sm text-muted">{l}</p></div>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="In Their Words" title="What Our Clients Say." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <figure key={c.name} className="flex flex-col rounded-2xl bg-mist p-7">
                <Quote className="h-8 w-8 text-orange" aria-hidden />
                <blockquote className="mt-3 flex-1 text-lg text-ink">“{c.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3"><ClientLogo name={c.name} className="h-12 w-20" /><div><p className="font-heading font-bold text-navy">{c.name}</p><Stars /></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
