import type { Metadata } from "next";
import { CalendarCheck, Clock, Mail, PhoneCall } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Consultation | HOLARD Consulting",
  description: "Book a free consultation with HOLARD Consulting about manpower supply, recruitment or HR consulting in the UAE. Choose a date and we'll call you back.",
};

const steps = [
  { icon: CalendarCheck, t: "Choose a time", d: "Pick a date and time that suits you." },
  { icon: PhoneCall, t: "We call you back", d: "Our team confirms the meeting by phone or email." },
  { icon: Clock, t: "Talk to an expert", d: "Discuss roles, sites, shifts, timelines and pricing." },
];

export default function BookConsultation() {
  return (
    <>
      <PageHero image="/images/about-story.jpg" eyebrow="Book a Consultation" title="Let's Plan Your Workforce Together." sub="Free, no-obligation consultation about manpower supply, recruitment or HR consulting." crumbs={[{ label: "Book a Consultation" }]} />
      <section className="section bg-white">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="h3 text-navy">How it works</h2>
            <ol className="mt-6 space-y-6">
              {steps.map(({ icon: I, t, d }, i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange text-white"><I className="h-6 w-6" aria-hidden /></span>
                  <div><p className="font-heading font-bold text-navy">{i + 1}. {t}</p><p className="text-muted">{d}</p></div>
                </li>
              ))}
            </ol>
            <div className="mt-10 rounded-2xl bg-mist p-6 text-sm">
              <p className="font-semibold text-navy">Prefer email?</p>
              <a href={`mailto:${site.email}`} className="mt-1 inline-flex items-center gap-2 font-semibold text-orange"><Mail className="h-4 w-4" aria-hidden />{site.email}</a>
              <p className="mt-3 text-muted">Working hours: {site.hours}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-line p-6 sm:p-10 lg:col-span-8">
            <h2 className="h3 mb-6 text-navy">Request your consultation</h2>
            <LeadForm type="consultation" />
          </div>
        </div>
      </section>
    </>
  );
}
