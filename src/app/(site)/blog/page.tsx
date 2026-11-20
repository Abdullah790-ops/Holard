import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { blogPosts } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog & News | UAE Hiring, Labour Law & WPS Guides | HOLARD",
  description: "Guides for UAE employers: how to hire helpers, labour law updates, WPS explained and more from the HOLARD team.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function Blog() {
  return (
    <>
      <PageHero image="/images/face-worker-2.jpg" eyebrow="Blog & News" title="Insights For UAE Employers." sub="Hiring guides, labour law updates and workforce tips." crumbs={[{ label: "Blog" }]} />
      <section className="section bg-white">
        <div className="container-site grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_70%_20%,_var(--color-navy-3),_var(--color-navy)_72%)]"><span className="font-heading text-2xl font-bold text-white/30">Workforce insight</span></div>
              <div className="p-7">
                <p className="text-sm font-semibold text-orange">{fmt(p.date)}</p>
                <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-navy">{p.title}</h2>
                <p className="mt-3 text-muted">{p.excerpt}</p>
                <p className="mt-5 flex items-center gap-1 font-heading font-bold text-navy">Read article <ArrowUpRight className="h-5 w-5 text-orange transition group-hover:rotate-45" aria-hidden /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
