import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadForm } from "@/components/LeadForm";
import { HireSection } from "@/components/HireSection";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact HOLARD | Hire Workers in Dubai & Sharjah",
  description: "Contact HOLARD in Sharjah & Dubai. Call, email info@holardhr.com or book a consultation. Mon–Sat 9 AM – 6 PM.",
};

export default function Contact() {
  const info = [
    ...(site.phone ? [{ icon: Phone, t: "Phone", v: site.phone, href: site.phoneHref ?? undefined }] : []),
    { icon: CalendarCheck, t: "Book a consultation", v: "Choose a date — we call you back", href: "/book-consultation" },
    { icon: Mail, t: "Email", v: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, t: "Office", v: site.address },
    { icon: Clock, t: "Working Hours", v: site.hours },
  ];
  return (
    <>
      <PageHero image="/images/contact-side.jpg" eyebrow="Contact" title="Let's Build Your Workforce." sub="Clients, job seekers and investors — we're one message away." crumbs={[{ label: "Contact" }]} />
      <section className="section bg-white">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src="/images/provided/contact-reception.jpg" alt="Reception area at a professional workplace" fill quality={90} sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" /></div>
            <ul className="mt-8 space-y-5">
              {info.map(({ icon: I, t, v, href }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-orange"><I className="h-5 w-5" aria-hidden /></span>
                  <div><p className="text-sm font-semibold text-muted">{t}</p>{href ? (href.startsWith("/") ? <Link href={href} className="font-heading text-lg font-semibold text-navy hover:text-orange">{v}</Link> : <a href={href} className="font-heading text-lg font-semibold text-navy hover:text-orange">{v}</a>) : <p className="font-heading text-lg font-semibold text-navy">{v}</p>}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <h2 className="h2 text-navy">Send Us A Message</h2>
            <p className="lead mb-8 mt-3">We reply within one working day.</p>
            <LeadForm type="contact" />
          </div>
        </div>
      </section>
      <section aria-label="Map" className="h-[420px] w-full bg-mist">
        <iframe title="Holard office location map" src="https://maps.google.com/maps?q=Salim%20Al%20Mazrouye%2C%20Dubai%2C%20UAE&z=14&output=embed" className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </section>
      <HireSection />
    </>
  );
}
