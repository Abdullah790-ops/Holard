import type { Metadata } from "next";
import { ArrowRight, Download, FileLock2, Lock, Repeat, Scaling, TrendingUp, Users, Building2, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { BarChart } from "@/components/BarChart";
import { Faq } from "@/components/Faq";
import { LeadForm } from "@/components/LeadForm";
import { faqGroups } from "@/lib/site";

export const metadata: Metadata = {
  title: "Investor Portal | Invest In The Workforce Behind UAE's Empire | HOLARD",
  description: "HOLARD: since 2020, 500 active workers, 9 enterprise clients and recurring monthly revenue. Request investor access to view approved business reports.",
};

const workers = [
  { label: "2020", value: 8 }, { label: "2021", value: 50 }, { label: "2025", value: 300 },
  { label: "2026", value: 500 }, { label: "2027", value: 2000, projected: true },
];
const RATE = 3500;
const runRate = workers.map((w) => ({ ...w, value: (w.value * RATE) / 1_000_000 }));

export default function Investors() {
  return (
    <>
      <PageHero image="/images/investor-hero.jpg" eyebrow="Investor Portal" title="Invest in workforce services across the UAE." sub="Recurring monthly revenue. Enterprise clients. A scalable model built on people." crumbs={[{ label: "Investor Portal" }]}>
        <Link href="#access" className="btn btn-primary">Request Investor Access <ArrowRight className="h-5 w-5" aria-hidden /></Link>
        <Link href="/login" className="btn btn-outline-light"><Lock className="h-5 w-5" aria-hidden /> Investor Login</Link>
      </PageHero>

      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Why Invest" title="A Business Built On Recurring Demand." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: CalendarCheck, t: "Since 2020", d: "Six years of operating history in the UAE." },
              { icon: Users, t: "500 Active Workers", d: "Deployed today across enterprise sites." },
              { icon: Building2, t: "9 Enterprise Clients", d: "Logistics, facilities, construction, and service-sector employers." },
              { icon: Repeat, t: "Recurring Monthly Revenue", d: "Clients pay per worker, every month." },
              { icon: TrendingUp, t: "1,000+ Talent Pool", d: "Ready supply to meet new demand fast." },
              { icon: Scaling, t: "Scalable Model", d: "Same platform from 500 to 5,000 workers." },
            ].map(({ icon: I, t, d }) => (
              <div key={t} className="rounded-2xl bg-mist p-7"><I className="h-8 w-8 text-orange" aria-hidden /><h3 className="mt-5 font-heading text-xl font-bold text-navy">{t}</h3><p className="mt-2 text-muted">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Growth" title="From 8 To 500. Next: 2,000." />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <BarChart title="Active workers" unit="Workers, year end" note="2027 = target" data={workers} />
            <BarChart title="Monthly revenue run-rate" unit="AED millions / month" note="Illustrative: workers × AED 3,500" data={runRate}
              format={(n) => (n < 1 ? n.toFixed(2) : n.toFixed(1))} />
          </div>
          <p className="mt-4 text-sm text-muted">Revenue chart is illustrative, derived from worker numbers at the example rate of AED 3,500 per worker per month. Verified financials are shared with approved investors in the private portal.</p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Business Model" title="How Holard Makes Money." sub="Clients pay one monthly rate per deployed worker. That rate covers salary, visa, housing, transport, medical and our operating margin." />
          </div>
          <div className="rounded-3xl bg-navy p-8 text-white sm:p-12">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-orange">Example · UAE Logistics Client</p>
            <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-heading text-3xl font-extrabold sm:text-4xl">
              <span>120 helpers</span><span className="text-orange">×</span><span>AED 3,500</span>
            </div>
            <div className="my-6 h-px bg-white/15" />
            <p className="font-heading text-5xl font-extrabold sm:text-6xl">AED 420,000</p>
            <p className="mt-2 text-white/70">per month, from one client contract</p>
          </div>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Documents" title="Company Profile & Pitch Deck." sub="Shared with verified investors after access is approved." />
            <ul className="mt-8 space-y-3">
              {["Company Profile (PDF)", "Pitch Deck (PDF)"].map((d) => (
                <li key={d}><a href="#access" className="flex items-center justify-between rounded-xl bg-white px-5 py-4 font-heading font-semibold text-navy transition hover:shadow-lg"><span className="flex items-center gap-3"><FileLock2 className="h-5 w-5 text-orange" aria-hidden />{d}</span><Download className="h-5 w-5 text-muted" aria-hidden /></a></li>
              ))}
            </ul>
          </div>
          <div id="access" className="scroll-mt-24 rounded-3xl bg-white p-6 sm:p-10 lg:col-span-7">
            <h2 className="h3 text-navy">Request Investor Access</h2>
            <p className="mb-6 mt-2 text-muted">Every request is verified by our team before a login is issued. Investors see business numbers only — never worker personal data.</p>
            <LeadForm type="investor" />
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><SectionHeading eyebrow="FAQ" title="Investor Questions." /></div>
          <div className="lg:col-span-8"><Faq items={faqGroups[2].items} /></div>
        </div>
      </section>
    </>
  );
}
