import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Faq } from "@/components/Faq";
import { CtaBanner } from "@/components/CtaBanner";
import { faqGroups } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ | Hiring Workers, Jobs & Investing | HOLARD",
  description: "Answers to common questions from clients, workers and investors about HOLARD manpower supply, recruitment and investor access.",
};

export default function FaqPage() {
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqGroups.flatMap((g) => g.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))) };
  return (
    <>
      <PageHero image="/images/about-hero.jpg" eyebrow="FAQ" title="Questions? Answered." sub="For clients, workers and investors." crumbs={[{ label: "FAQ" }]} />
      <section className="section bg-white">
        <div className="container-site">
          <nav aria-label="FAQ sections" className="mb-14 flex flex-wrap gap-3">
            {faqGroups.map((g) => <a key={g.group} href={`#${g.group.replace(/\W+/g, "-").toLowerCase()}`} className="rounded-full bg-mist px-5 py-2.5 font-heading font-semibold text-navy hover:bg-navy hover:text-white">{g.group}</a>)}
          </nav>
          <div className="space-y-20">
            {faqGroups.map((g) => (
              <div key={g.group} id={g.group.replace(/\W+/g, "-").toLowerCase()} className="grid scroll-mt-28 gap-8 lg:grid-cols-12">
                <h2 className="h2 text-navy lg:col-span-4">{g.group}</h2>
                <div className="lg:col-span-8"><Faq items={g.items} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
