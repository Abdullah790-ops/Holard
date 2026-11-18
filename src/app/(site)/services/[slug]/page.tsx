import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Globe2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { HireSection } from "@/components/HireSection";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { CtaBanner } from "@/components/CtaBanner";
import { countries, industries, services } from "@/lib/site";

export function generateStaticParams() { return services.map((s) => ({ slug: s.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = services.find((x) => x.slug === slug);
  return s ? { title: s.metaTitle, description: s.metaDescription } : {};
}

const pricing = [
  { role: "General / Warehouse Helper", day: "135", month: "3,500", featured: true },
  { role: "Cleaner", day: "On request", month: "On request" },
  { role: "Driver (Light Vehicle)", day: "On request", month: "On request" },
  { role: "Technician", day: "On request", month: "On request" },
];

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = services.find((x) => x.slug === slug);
  if (!s) notFound();
  const isRecruit = s.slug === "recruitment";
  const isManpower = s.slug === "manpower-solution";
  return (
    <>
      <PageHero image={s.image} eyebrow={s.title} title={s.h1} sub={s.intro} crumbs={[{ label: "Services", href: "/services" }, { label: s.title }]}>
        <Link href="#hire" className="btn btn-primary">{isRecruit ? "Post Your Requirement" : isManpower ? "Hire Workers" : "Book a Consultation"} <ArrowRight className="h-5 w-5" aria-hidden /></Link>
      </PageHero>

      {isManpower && (
        <section className="section bg-white">
          <div className="container-site">
            <SectionHeading eyebrow="How It Works" title="You Pay Per Worker. We Handle Everything." />
            <div className="mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {["Visa", "Salary", "Accommodation", "Transport", "Medical", "Replacement"].map((t) => (
                <div key={t} className="rounded-2xl bg-mist p-6 text-center"><Check className="mx-auto h-8 w-8 text-orange" aria-hidden /><p className="mt-3 font-heading font-bold text-navy">{t}</p></div>
              ))}
            </div>
            <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy p-8 text-white lg:flex-row lg:items-center lg:p-12">
              <div><p className="font-heading text-3xl font-extrabold lg:text-4xl">50–500 workers in 48–72 hours.</p><p className="mt-2 text-white/70">Our deployment capacity from a 1,000+ vetted talent pool.</p></div>
              <Link href="#hire" className="btn btn-primary shrink-0">Check Availability</Link>
            </div>
          </div>
        </section>
      )}

      <section className={`section ${isManpower ? "bg-mist" : "bg-white"}`}>
        <div className="container-site">
          <SectionHeading eyebrow={isRecruit || isManpower ? "Categories" : "What We Do"} title={isRecruit ? "Roles We Recruit." : isManpower ? "Workers We Supply." : "Complete HR Support."} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {s.items.map((it) => (
              <div key={it.t} className="rounded-2xl border border-line bg-white p-7 transition hover:border-orange hover:shadow-xl">
                <span className="block h-1 w-10 rounded bg-orange" />
                <h3 className="mt-5 font-heading text-lg font-bold text-navy">{it.t}</h3>
                <p className="mt-2 text-[15px] text-muted">{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isRecruit && (
        <>
          <section className="section bg-navy text-white">
            <div className="container-site">
              <SectionHeading light eyebrow="Source Countries" title="Talent From 10 Countries." />
              <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {countries.map((c) => <li key={c} className="flex items-center gap-3 rounded-xl bg-white/5 px-5 py-4 font-heading font-semibold"><Globe2 className="h-5 w-5 text-orange" aria-hidden />{c}</li>)}
              </ul>
            </div>
          </section>
          <section className="section bg-white">
            <div className="container-site">
              <SectionHeading eyebrow="Process" title="Requirement To Deployment." />
              <ol className="mt-12 grid gap-5 md:grid-cols-5">
                {["Requirement", "Shortlist in 48 Hours", "Interview", "Medical / Visa", "Deploy"].map((t, i) => (
                  <li key={t} className="rounded-2xl bg-mist p-7"><span className="font-heading text-4xl font-extrabold text-orange">0{i + 1}</span><p className="mt-3 font-heading text-lg font-bold text-navy">{t}</p></li>
                ))}
              </ol>
            </div>
          </section>
        </>
      )}

      {isManpower && (
        <section className="section bg-white">
          <div className="container-site">
            <SectionHeading eyebrow="Pricing" title="Simple, Transparent Rates." sub="Indicative rates per worker. Final pricing depends on role, shift, location and contract length." />
            <div className="mt-12 overflow-hidden rounded-3xl border border-line">
              <table className="w-full text-left">
                <thead className="bg-navy text-white"><tr><th className="p-5 font-heading lg:p-6">Role</th><th className="p-5 font-heading lg:p-6">Per Day (AED)</th><th className="p-5 font-heading lg:p-6">Per Month (AED)</th></tr></thead>
                <tbody>
                  {pricing.map((p) => (
                    <tr key={p.role} className={`border-t border-line ${p.featured ? "bg-orange/5" : ""}`}>
                      <td className="p-5 font-semibold text-navy lg:p-6">{p.role}</td>
                      <td className="p-5 lg:p-6">{p.day}</td>
                      <td className="p-5 font-heading text-lg font-bold lg:p-6">{p.month}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted">Example: 120 helpers × AED 3,500 = AED 420,000 / month. Per-day rate based on 26 working days. All rates exclude VAT.</p>
          </div>
        </section>
      )}

      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Industries We Serve" title="Where We Deploy." />
          <div className="mt-10 flex flex-wrap gap-3">
            {industries.map((i) => <Link key={i.slug} href={`/industries/${i.slug}`} className="rounded-full border-2 border-navy px-5 py-2.5 font-heading font-semibold text-navy transition hover:bg-navy hover:text-white">{i.title}</Link>)}
          </div>
          <div className="mt-14"><TestimonialSlider count={9} /></div>
        </div>
      </section>

      <HireSection title={isRecruit ? "Post Your Requirement" : isManpower ? "Hire Workers Now" : "Book An HR Consultation"} />
      <CtaBanner />
    </>
  );
}
