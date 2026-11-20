import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { blogPosts } from "@/lib/site";

export function generateStaticParams() { return blogPosts.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = blogPosts.find((x) => x.slug === slug);
  return p ? { title: `${p.title} | HOLARD`, description: p.excerpt } : {};
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = blogPosts.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <>
      <PageHero image={p.slug === "how-to-hire-helpers-in-uae" ? "/images/provided/industry-project-team.jpg" : p.slug === "uae-labour-law-update" ? "/images/blog-labour-law.jpg" : "/images/provided/industry-technology.jpg"} eyebrow={new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} title={p.title} crumbs={[{ label: "Blog", href: "/blog" }, { label: "Article" }]} />
      <article className="section bg-white">
        <div className="container-site max-w-3xl">
          <p className="lead">{p.excerpt}</p>
          <div className="space-y-6 text-lg leading-relaxed text-ink">{p.body.map((para, i) => <p key={i}>{para}</p>)}</div>
        </div>
      </article>
      <CtaBanner />
    </>
  );
}
