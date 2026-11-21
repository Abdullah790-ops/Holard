import Link from "next/link";
import { Mail, MapPin, Phone, CalendarCheck, Clock, MessageCircle } from "lucide-react";
import { industries, services, site } from "@/lib/site";
import { Logo } from "./Logo";

const Social = ({ href, label, d }: { href: string | null; label: string; d: string }) => {
  const className = "grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition";
  const icon = <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden><path d={d} /></svg>;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`${className} hover:bg-orange`}>{icon}</a>
  ) : (
    <span role="img" aria-label={`${label} link coming soon`} title={`${label} link coming soon`} className={`${className} cursor-default opacity-80`}>{icon}</span>
  );
};

const WhatsAppSocial = ({ href }: { href: string | null }) => {
  const className = "grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-[#128C7E]";
  const icon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.1-4.5a8.5 8.5 0 1 1 16.4-4Z" />
      <path d="M8.1 7.7c.2-.4.4-.6.8-.6h.6c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.1.4 0 .6.5.8 1.2 1.5 2 2 .2.1.4.2.6 0l.7-.6c.2-.2.4-.2.6-.1l1.8.8c.3.1.4.3.4.5v.6c0 .4-.2.7-.6.8-.6.3-1.5.3-2.5 0-1.1-.4-2.3-1.1-3.4-2.2-1.1-1.1-1.8-2.3-2.2-3.4-.3-.9-.3-1.7.1-2.3Z" />
    </svg>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={className}>{icon}</a>
  ) : (
    <span role="img" aria-label="WhatsApp link coming soon" title="WhatsApp link coming soon" className={`${className} cursor-default opacity-80`}>{icon}</span>
  );
};

const icons = {
  linkedin: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm6.5 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-3.95v-11z",
  instagram: "M12 2.2c3.2 0 3.6 0 4.8.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.8s0 3.6-.07 4.8c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.8.07s-3.6 0-4.8-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2zm0 4.86a4.94 4.94 0 1 0 0 9.88 4.94 4.94 0 0 0 0-9.88zm0 8.15a3.21 3.21 0 1 1 0-6.42 3.21 3.21 0 0 1 0 6.42zm5.14-9.5a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z",
  facebook: "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.55V4.45c-.27-.04-1.19-.12-2.26-.12-2.24 0-3.77 1.37-3.77 3.87v2.3H8v3h2.52V21h2.98z",
  twitter: "M23.95 4.57a10 10 0 0 1-2.83.78 4.93 4.93 0 0 0 2.17-2.72 9.86 9.86 0 0 1-3.13 1.2 4.92 4.92 0 0 0-8.39 4.48A13.98 13.98 0 0 1 1.64 3.16a4.92 4.92 0 0 0 1.52 6.57 4.9 4.9 0 0 1-2.23-.62v.06a4.93 4.93 0 0 0 3.95 4.83 4.94 4.94 0 0 1-2.22.08 4.93 4.93 0 0 0 4.6 3.42A9.87 9.87 0 0 1 0 19.54a13.93 13.93 0 0 0 7.55 2.21c9.05 0 14-7.5 14-14v-.64a10 10 0 0 0 2.46-2.54z",
  tiktok: "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.59-2.6 2.6 2.6 0 0 1 3.4-2.47V9.67a5.68 5.68 0 0 0-6.5 5.64A5.7 5.7 0 0 0 9.86 21a5.68 5.68 0 0 0 5.68-5.69V9.01a7.33 7.33 0 0 0 4.29 1.38V7.3s-1.88.09-3.23-1.48z",
};

const footerServiceLabels: Record<string, string> = {
  "hr-consulting": "HR Consulting",
  recruitment: "Recruitment",
  "manpower-solution": "Manpower Supply",
  "warehouse-logistics-staffing": "Warehouse Staffing",
  "construction-contract-staffing": "Construction Staffing",
  "payroll-hr-outsourcing": "Payroll & HR",
  "hospitality-staffing": "Hospitality Staffing",
  "healthcare-staffing": "Healthcare Staffing",
  "drivers-transport-staffing": "Transport Staffing",
  "cleaning-facilities-staffing": "Cleaning & Facilities",
};

const footerIndustryLabels: Record<string, string> = {
  "warehouse-logistics": "Logistics",
  "construction-real-estate": "Construction",
  "hospitality-hotels": "Hospitality",
  "oil-gas-industrial": "Oil & Gas",
  healthcare: "Healthcare",
  "it-technology": "IT & Technology",
};

export function Footer() {
  const col = "font-heading text-sm font-bold uppercase tracking-[0.16em] text-white";
  const link = "text-white/70 transition hover:text-orange";
  return (
    <footer className="border-t-4 border-orange bg-navy text-white">
      <div className="container-site grid gap-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-3">
          <Logo light height={72} />
          <p className="mt-6 max-w-sm font-heading text-xl font-semibold leading-snug text-white">{site.tagline}</p>
          <p className="mt-4 max-w-sm text-white/65">Manpower supply, recruitment and HR consulting across the UAE since 2020.</p>
          <div className="mt-6 flex gap-3">
            {site.social.linkedin && <Social href={site.social.linkedin} label="LinkedIn" d={icons.linkedin} />}
            <Social href={site.social.facebook} label="Facebook" d={icons.facebook} />
            <Social href={site.social.instagram} label="Instagram" d={icons.instagram} />
            <Social href={site.social.twitter} label="Twitter" d={icons.twitter} />
            <WhatsAppSocial href={site.whatsappHref} />
            {site.social.tiktok && <Social href={site.social.tiktok} label="TikTok" d={icons.tiktok} />}
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-4 lg:col-span-6">
          <div>
            <h3 className={col}>Company</h3>
            <ul className="mt-5 space-y-3">
              <li><Link className={link} href="/about">About</Link></li>
              <li><Link className={link} href="/clients">Our Clients</Link></li>
              <li><Link className={link} href="/testimonials">Testimonials</Link></li>
              <li><Link className={link} href="/careers">Careers</Link></li>
              <li><Link className={link} href="/blog">Blog</Link></li>
              <li><Link className={link} href="/faq">FAQ</Link></li>
              <li><Link className={link} href="/investors">Investors</Link></li>
              <li><Link className={link} href="/contact">Contact</Link></li>
              <li><Link className={link} href="/book-consultation">Book Consultation</Link></li>
            </ul>
          </div>
          <div className="sm:col-span-2">
            <h3 className={col}>Services</h3>
            <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
              {services.map((s) => <li key={s.slug}><Link className={`${link} leading-snug`} href={`/services/${s.slug}`}>{footerServiceLabels[s.slug] ?? s.title}</Link></li>)}
              <li><Link className={`${link} leading-snug`} href="/candidates">For Candidates</Link></li>
              <li><Link className={`${link} leading-snug`} href="/employee-portal">Employee Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className={col}>Industries</h3>
            <ul className="mt-5 space-y-3">
              {industries.map((s) => <li key={s.slug}><Link className={link} href={`/industries/${s.slug}`}>{footerIndustryLabels[s.slug] ?? s.title}</Link></li>)}
            </ul>
          </div>
        </div>
        <div className="lg:col-span-3">
          <h3 className={col}>Get in touch</h3>
          <ul className="mt-5 space-y-4 text-white/80">
            {site.phone && <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden /><a href={site.phoneHref ?? `tel:${site.phone}`} className="hover:text-orange">{site.phone}</a></li>}
            {site.whatsappHref && <li className="flex gap-3"><MessageCircle className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden /><a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-orange">WhatsApp</a></li>}
            <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden /><a href={`mailto:${site.email}`} className="hover:text-orange">{site.email}</a></li>
            <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden />{site.address}</li>
            <li className="flex gap-3"><Clock className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden />{site.hours}</li>
          </ul>
          <Link href="/book-consultation" className="btn btn-primary mt-7 w-full sm:w-auto">
            <CalendarCheck className="h-5 w-5" aria-hidden /> Book Consultation
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-4 py-6 text-sm text-white/60 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 {site.legalName}. All rights reserved. <span className="ml-2 font-semibold text-white">Made in UAE 🇦🇪</span></p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
            <li><Link href="/replacement-policy" className="hover:text-white">Replacement Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
