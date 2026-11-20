import type { Metadata } from "next";
import { ExternalLink, Quote } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { ClientLogo } from "@/components/ClientLogo";
import { Stars } from "@/components/Stars";
import { LeadForm } from "@/components/LeadForm";
import { CtaBanner } from "@/components/CtaBanner";
import { and, desc, eq } from "drizzle-orm";
import { clients, workerTestimonials } from "@/lib/site";
import { getDb, schema } from "@/db";

export const metadata: Metadata = {
  title: "Testimonials | What Clients & Workers Say About HOLARD",
  description: "Read feedback from workforce clients and workers across the UAE.",
};

export const revalidate = 60; // pre-built; refreshed instantly when admin approves a review, and at least every 60 s

export default async function Testimonials() {
  const db = await getDb();
  const reviews = await db.select().from(schema.enquiries)
    .where(and(eq(schema.enquiries.type, "review"), eq(schema.enquiries.status, "approved")))
    .orderBy(desc(schema.enquiries.createdAt)).limit(12);
  return (
    <>
      <PageHero image="/images/why-holard.jpg" eyebrow="Testimonials" title="Hear from clients and workers." sub="Feedback from the teams and people who work with us." crumbs={[{ label: "Testimonials" }]} />
      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading eyebrow="Clients" title="Enterprise Clients." />
          <div className="mt-12 columns-1 gap-5 md:columns-2 lg:columns-3">
            {clients.map((c, i) => (
              <figure key={c.name} className={`mb-5 break-inside-avoid rounded-2xl p-8 ${i === 0 ? "bg-navy text-white" : "bg-mist"}`}>
                <Stars />
                <blockquote className={`mt-5 font-heading font-semibold leading-snug ${i === 0 ? "text-2xl" : "text-xl"}`}>“{c.quote}”</blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <ClientLogo name={c.name} className="h-16 w-28" />
                  <div><p className="font-heading font-bold">{c.name}</p><p className={`text-sm ${i === 0 ? "text-white/65" : "text-muted"}`}>{c.role}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container-site">
          <SectionHeading eyebrow="Workers" title="Our People." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {workerTestimonials.map((w) => (
              <figure key={w.name} className="rounded-2xl bg-white p-8">
                <span className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-navy font-heading text-xl font-bold text-white">{w.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
                <Stars />
                <blockquote className="mt-4 text-lg">“{w.quote}”</blockquote>
                <figcaption className="mt-5"><p className="font-heading font-bold text-navy">{w.name}</p><p className="text-sm text-muted">{w.role}</p></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section bg-white">
          <div className="container-site">
            <SectionHeading eyebrow="Reviews" title="Latest Reviews." />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => {
                const d = r.data as Record<string, string | number>;
                return (
                  <figure key={r.id} className="rounded-2xl border border-line p-7">
                    <Stars n={Math.min(5, Math.max(1, Number(d.rating) || 5))} />
                    <blockquote className="mt-4 text-lg">“{String(d.message ?? "")}”</blockquote>
                    <figcaption className="mt-5"><p className="font-heading font-bold text-navy">{r.name}</p>{r.company && <p className="text-sm text-muted">{r.company}</p>}</figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section bg-white">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Google Reviews" title="Reviews On Google." sub="See and leave reviews on our Google Business profile." />
            <div className="mt-8 rounded-2xl border border-line p-8">
              <p className="font-heading text-xl font-bold text-navy">Holard on Google</p><p className="mt-2 text-muted">Read verified reviews from clients and workers, or share your own experience.</p>
              {/* TODO: replace with live Google Reviews widget once the Place ID is provided. */}
              <a href="https://www.google.com/maps/search/Holard+UAE" target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-6">See Google Reviews <ExternalLink className="h-4 w-4" aria-hidden /></a>
            </div>
            <Quote className="mt-10 h-10 w-10 text-orange" aria-hidden />
          </div>
          <div className="rounded-3xl bg-mist p-6 sm:p-10">
            <h2 className="h3 text-navy">Leave A Review</h2>
            <p className="mb-6 mt-2 text-muted">Reviews are published after approval by our team.</p>
            <LeadForm type="review" />
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
