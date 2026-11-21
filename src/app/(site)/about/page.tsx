import type { Metadata } from "next";
import Image from "next/image";
import { Award, FileText, HandHeart, Handshake, Medal, RefreshCcw, ShieldCheck, Target, UserRound } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { StatsCounter } from "@/components/StatsCounter";
import { CtaBanner } from "@/components/CtaBanner";
import { mission, profileNumbers, site, team, timeline, values, vision } from "@/lib/site";

export const metadata: Metadata = {
  title: "About HOLARD Consulting | Vision, Mission & Team",
  description: "HOLARD Consulting: the UAE's trusted manpower partner. Our vision, mission, values and the team behind 500+ deployed workers. DED licensed, 24/7 support.",
};

const VALUE_ICONS = [Medal, Handshake, RefreshCcw, ShieldCheck];

export default function About() {
  return (
    <>
      <PageHero image="/images/about-hero.jpg" eyebrow="About Holard" title="Built In The UAE. Built For The UAE." sub={site.tagline + "."} crumbs={[{ label: "About Us" }]} />

      <section className="section bg-white">
        <div className="container-site grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Our Story" title="From 8 Workers To 500+." />
            <div className="mt-6 space-y-5 text-lg text-muted">
              <p>HOLARD was founded in 2020 in the UAE by promoters with <strong className="text-ink">10+ years of UAE manpower industry experience</strong> — with one simple promise: treat workers with respect, and deliver for clients every single day.</p>
              <p>Today more than 500 workers support client operations across warehouses, facilities, construction sites, and hotels.</p>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src="/images/provided/about-team.jpg" alt="A diverse team standing together in their workplace" fill quality={90} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
        </div>
        <div className="container-site mt-16">
          <p className="mb-4 font-heading text-lg font-bold text-navy">HOLARD Consulting in numbers</p>
          <StatsCounter items={profileNumbers} />
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading center eyebrow="Vision & Mission" title="Our Purpose & Direction." />
          <div className="relative mt-12 aspect-[21/8] overflow-hidden rounded-3xl">
            <Image src="/images/provided/about-purpose-team.jpg" alt="Team collaborating on a shared purpose" fill quality={90} sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 to-transparent" />
          </div>
          <div className="relative -mt-16 grid gap-6 px-4 md:grid-cols-2 lg:-mt-24 lg:px-10">
            {[{ icon: Target, t: "Our Vision", d: vision }, { icon: HandHeart, t: "Our Mission", d: mission }].map(({ icon: I, t, d }) => (
              <div key={t} className="flex flex-col items-start rounded-3xl border border-line bg-white p-8 text-left shadow-xl lg:p-10">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-orange text-white"><I className="h-8 w-8" aria-hidden /></span>
                <h2 className="h3 mt-6 text-navy lg:text-[28px]">{t}</h2>
                <p className="mt-4 text-lg text-muted">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center font-heading text-xl font-semibold text-navy">Guided by trust, compliance, and excellence in every step.</p>
        </div>
      </section>

      {/* Values & Culture */}
      <section className="section bg-navy text-white">
        <div className="container-site">
          <SectionHeading light center eyebrow="Values & Culture" title="What We Stand For." sub="Founded by promoters with 10+ years of UAE manpower industry experience." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => {
              const I = VALUE_ICONS[i];
              return (
                <div key={v.t} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                  <span className="grid h-14 w-14 place-items-center rounded-xl bg-orange text-white"><I className="h-7 w-7" aria-hidden /></span>
                  <h3 className="mt-5 font-heading text-xl font-bold uppercase tracking-wide">{v.t}</h3>
                  <p className="mt-2 text-white/70">{v.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading center eyebrow="Our Journey" title="Six Years Of Growth." />
          <ol className="relative mt-16 grid gap-10 md:grid-cols-5 md:gap-6">
            <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-0.5 bg-line md:block" />
            {timeline.map((t, i) => (
              <li key={t.year} className="relative">
                <span className={`relative grid h-11 w-11 place-items-center rounded-full font-heading text-sm font-bold ${i === timeline.length - 1 ? "bg-orange text-white" : "bg-navy text-white"}`}>{t.year.slice(2)}</span>
                <p className="mt-5 font-heading text-3xl font-extrabold text-navy">{t.year}</p>
                <h3 className="mt-1 font-heading text-lg font-bold text-ink">{t.t}</h3>
                <p className="mt-2 text-muted">{t.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team */}
      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Our Team" title="The People Behind Holard." />
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            {team.map((m) => (
              <figure key={m.name} className="overflow-hidden rounded-3xl bg-white">
                <div className="relative aspect-[4/5] bg-navy">
                  {m.photo ? (
                    <Image src={m.photo} alt={`${m.name}, ${m.role}`} fill quality={90} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover object-top" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-white/30 font-heading text-3xl font-extrabold text-white/80">
                        {m.name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/, "").split(" ").map((w) => w[0]).slice(0, 2).join("") || <UserRound className="h-10 w-10" aria-hidden />}
                      </span>
                    </span>
                  )}
                </div>
                <figcaption className="p-4 sm:p-5">
                  <p className="font-heading text-base font-bold leading-snug text-navy sm:text-lg">{m.name}</p>
                  <p className="mt-1 text-sm font-semibold text-orange">{m.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Licences & Compliance" title="Fully Licensed. Fully Compliant." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: FileText, t: "DED Licensed", d: `${site.legalName}, Dubai — licensed by the Department of Economy & Tourism.` },
              { icon: ShieldCheck, t: "UAE Labour Law", d: "Contracts, leave and gratuity aligned with Federal Labour Law." },
              { icon: Award, t: "WPS Registered", d: "All salaries paid through the Wage Protection System." },
            ].map(({ icon: I, t, d }) => (
              <div key={t} className="flex gap-5 rounded-2xl border border-[#c6d4e6] p-7">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mist text-navy"><I className="h-6 w-6" aria-hidden /></span>
                <div><h3 className="font-heading text-lg font-bold text-navy">{t}</h3><p className="mt-1 text-muted">{d}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Certificate copy available on request</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
