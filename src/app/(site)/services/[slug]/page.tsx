import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { Faq } from "@/components/Faq";
import { Icon } from "@/components/Icon";
import { services, site } from "@/lib/site";
import serviceCopy from "@/lib/service-correction-copy.json";

type PageContent = {
  slug: string; title: string; subtitle: string; intro: string; audience: string;
  cards: { title: string; body: string }[];
  why: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  industries: string[];
  faqs: { q: string; a: string }[];
  buttons: string[]; cta: string; wordCount: number; roles?: string[];
};
const contentBySlug = serviceCopy as Record<string, PageContent>;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  return service ? { title: service.metaTitle, description: service.metaDescription } : {};
}

function splitParagraphs(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text];
  if (sentences.length < 2) return [text];
  let middle = 0;
  let length = 0;
  const target = text.length / 2;
  while (middle < sentences.length - 1 && length + sentences[middle].length < target) {
    length += sentences[middle].length;
    middle += 1;
  }
  return [sentences.slice(0, middle + 1).join("").trim(), sentences.slice(middle + 1).join("").trim()];
}

const cardIcons = ["FileCheck2", "Users", "CalendarCheck", "ShieldCheck", "WalletCards", "BadgeCheck"];
const whyIcons = [BadgeCheck, Clock3, ShieldCheck, CheckCircle2];
const manpowerRates = [
  { role: "General / Warehouse Helper", daily: "On request", monthly: "On request" },
  { role: "Cleaner", daily: "On request", monthly: "On request" },
  { role: "Driver (Light Vehicle)", daily: "On request", monthly: "On request" },
  { role: "Technician", daily: "On request", monthly: "On request" },
];

function industryPresentation(label: string) {
  const value = label.toLowerCase();
  if (value.includes("health") || value.includes("clinic") || value.includes("hospital")) return { icon: "Stethoscope", detail: "Healthcare and patient support teams" };
  if (value.includes("construction") || value.includes("infrastructure") || value.includes("civil") || value.includes("fit-out")) return { icon: "HardHat", detail: "Project sites and infrastructure teams" };
  if (value.includes("oil") || value.includes("gas") || value.includes("industrial") || value.includes("manufactur")) return { icon: "Factory", detail: "Industrial, energy and production operations" };
  if (value.includes("hotel") || value.includes("hospitality") || value.includes("restaurant") || value.includes("catering") || value.includes("event") || value.includes("club")) return { icon: "Hotel", detail: "Guest services, hotels and food operations" };
  if (value.includes("logistic") || value.includes("warehouse") || value.includes("distribution") || value.includes("e-commerce") || value.includes("3pl") || value.includes("storage")) return { icon: "Warehouse", detail: "Warehousing, fulfilment and distribution" };
  if (value.includes("clean") || value.includes("facilit") || value.includes("building service")) return { icon: "Sparkles", detail: "Facilities, buildings and cleaning teams" };
  if (value.includes("technology") || value.includes("it &") || value.includes("professional")) return { icon: "Cpu", detail: "Technology and professional roles" };
  if (value.includes("retail") || value.includes("office") || value.includes("business")) return { icon: "Store", detail: "Retail, office and customer-facing teams" };
  return { icon: "Building2", detail: "Workforce support for day-to-day operations" };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  const content = contentBySlug[slug];
  if (!service || !content) notFound();

  const isRecruitment = slug === "recruitment";
  const introParagraphs = splitParagraphs(content.intro);
  const ctaText = content.cta.replace(/\s*Buttons:.*$/i, "").trim();
  const ctaTitle = ctaText.includes("?") ? ctaText.slice(0, ctaText.indexOf("?") + 1) : ctaText;
  const ctaDescription = ctaText.includes("?") ? ctaText.slice(ctaText.indexOf("?") + 1).trim() : "Share your requirement and our team will follow up.";
  const primaryCta = content.buttons[0] ?? "Request Staff";
  const primaryHref = slug === "hr-consulting" ? "/book-consultation" : "/contact#hire";
  const whatsappHref = site.whatsappHref ?? (site.whatsappNumber ? `https://wa.me/${site.whatsappNumber.replace(/\D/g, "")}` : null);

  return (
    <>
      <PageHero image={service.image} eyebrow="Workforce Services" title={content.title} sub={content.subtitle} crumbs={[{ label: "Services", href: "/services" }, { label: content.title }]}>
        <Link href={primaryHref} className="btn btn-primary">{primaryCta}<ArrowRight className="h-5 w-5" aria-hidden /></Link>
        {isRecruitment && <Link href="/candidates#apply" className="btn btn-outline-light">Upload Your CV</Link>}
        {!isRecruitment && content.buttons[1]?.toLowerCase().includes("whatsapp") && whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-outline-light">Talk on WhatsApp</a>
        )}
      </PageHero>

      <section className="section bg-white">
        <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4"><SectionHeading eyebrow="Service Overview" title={`What ${content.title} means`} sub="A practical service scoped around the roles, people, and outcomes your organisation needs." /></div>
          <div className="space-y-4 lg:col-span-8">
            {introParagraphs.map((paragraph, index) => (
              <p key={index} className={`rounded-2xl border p-5 text-base leading-relaxed sm:p-6 sm:text-lg ${index === 0 ? "border-orange/25 border-l-4 bg-[#fff8f2] text-ink" : "border-navy/10 border-l-4 border-l-navy/50 bg-mist text-muted"}`}>
                <span className="mb-2 block font-heading text-xs font-bold uppercase tracking-[0.14em] text-orange">{index === 0 ? "Service overview" : "How the support works"}</span>
                {paragraph}
              </p>
            ))}
            <p className="rounded-2xl border border-orange/20 border-l-4 border-l-orange bg-white p-5 text-muted shadow-sm sm:p-6"><strong className="mb-2 block font-heading text-xs uppercase tracking-[0.14em] text-navy">Who it is for</strong>{content.audience}</p>
          </div>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="What We Provide" title="Support shaped around the work." sub="Each part of the service is agreed with your team so responsibilities and next steps are clear." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.cards.map((card, index) => (
              <article key={card.title} className="rounded-2xl border border-line bg-white p-7 transition hover:-translate-y-1 hover:border-orange hover:shadow-xl">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-orange"><Icon name={cardIcons[index % cardIcons.length]} className="h-6 w-6" /></span>
                <h3 className="mt-5 font-heading text-xl font-bold text-navy">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {slug === "manpower-solution" && <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Indicative Rates" title="Manpower rates at a glance." sub="Clear starting information for common roles. Request a quote for your exact site and shift requirements." />
          <div className="mt-10 overflow-hidden rounded-3xl border border-line shadow-sm">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup><col className="w-[40%]" /><col className="w-[28%]" /><col className="w-[32%]" /></colgroup>
              <thead className="bg-navy text-white">
                <tr>
                  <th scope="col" className="px-3 py-5 font-heading text-sm font-bold sm:px-6 sm:py-6 sm:text-base">Role</th>
                  <th scope="col" className="px-2 py-5 text-center font-heading text-sm font-bold sm:px-4 sm:py-6 sm:text-base">Per Day<br />(AED)</th>
                  <th scope="col" className="px-2 py-5 text-center font-heading text-sm font-bold sm:px-4 sm:py-6 sm:text-base">Per Month<br />(AED)</th>
                </tr>
              </thead>
              <tbody>
                {manpowerRates.map((rate, index) => <tr key={rate.role} className={`${index % 2 === 0 ? "bg-[#fff7f0]" : "bg-white"} border-t border-line`}>
                  <th scope="row" className="break-words px-3 py-5 font-heading text-sm font-semibold leading-snug text-navy sm:px-6 sm:py-6 sm:text-base">{rate.role}</th>
                  <td className="break-words px-2 py-5 text-center text-sm leading-relaxed text-ink sm:px-4 sm:py-6 sm:text-base">{rate.daily}</td>
                  <td className="break-words px-2 py-5 text-center font-heading text-sm font-bold leading-relaxed text-navy sm:px-4 sm:py-6 sm:text-base">{rate.monthly}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted">Example: 120 helpers × AED 3,500 = AED 420,000 / month. Per-day rate based on 26 working days. All rates exclude VAT.</p>
        </div>
      </section>}

      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow={`Why Choose Us For ${content.title}`} title="A clear, accountable way to work." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {content.why.map((item, index) => {
              const WhyIcon = whyIcons[index % whyIcons.length];
              return <article key={item.title} className="flex gap-4 rounded-2xl border border-line p-6 sm:p-7">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange"><WhyIcon className="h-6 w-6" aria-hidden /></span>
                <div><h3 className="font-heading text-lg font-bold text-navy">{item.title}</h3><p className="mt-2 leading-relaxed text-muted">{item.body}</p></div>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="container-site">
          <SectionHeading light eyebrow="How It Works" title="Four steps from brief to delivery." />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.steps.map((step, index) => <li key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="font-heading text-4xl font-extrabold text-orange">0{index + 1}</span>
              <h3 className="mt-4 font-heading text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
            </li>)}
          </ol>
        </div>
      </section>

      {content.roles && <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Roles We Recruit" title="Professional and operational roles." />
          <div className="mt-8 flex flex-wrap gap-3">{content.roles.map((role) => <span key={role} className="rounded-full bg-mist px-5 py-3 font-semibold text-navy">{role}</span>)}</div>
        </div>
      </section>}

      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Industries We Serve" title="Experience across different work settings." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.industries.map((industry) => {
              const presentation = industryPresentation(industry);
              return <li key={industry} className="flex min-h-24 items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-orange"><Icon name={presentation.icon} className="h-6 w-6" /></span>
                <span className="min-w-0"><span className="block font-heading font-bold leading-snug text-navy">{industry}</span><span className="mt-1 block text-sm leading-snug text-muted">{presentation.detail}</span></span>
              </li>;
            })}
          </ul>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4"><SectionHeading eyebrow="FAQs" title="Questions, answered." /></div>
          <div className="lg:col-span-8"><Faq items={content.faqs} /></div>
        </div>
      </section>

      <section className="section bg-navy text-white">
        <div className="container-site flex flex-col items-start justify-between gap-8 rounded-3xl bg-navy-2 p-8 sm:p-12 lg:flex-row lg:items-center">
          <div className="max-w-3xl"><p className="eyebrow text-orange">Next Step</p><h2 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">{ctaTitle}</h2><p className="mt-4 text-white/75">{ctaDescription}</p></div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href={primaryHref} className="btn btn-primary">{primaryCta}<ArrowRight className="h-5 w-5" aria-hidden /></Link>
            {isRecruitment && <Link href="/candidates#apply" className="btn btn-outline-light">Upload Your CV</Link>}
            {!isRecruitment && whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-outline-light">WhatsApp Us</a>}
          </div>
        </div>
      </section>
    </>
  );
}
