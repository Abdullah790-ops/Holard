import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { blogPosts } from "@/lib/site";

export function generateStaticParams() { return blogPosts.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = blogPosts.find((x) => x.slug === slug);
  return p ? { title: `${p.title} | HOLARD`, description: p.excerpt, openGraph: { images: [p.image] } } : {};
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = blogPosts.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <>
      <PageHero image={p.image} eyebrow={new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} title={p.title} crumbs={[{ label: "Blog", href: "/blog" }, { label: "Article" }]} />
      <article className="section bg-white">
        <div className="container-site max-w-3xl">
          <p className="lead">{p.excerpt}</p>
          <div className="relative my-10 aspect-[16/9] overflow-hidden rounded-2xl"><Image src={p.image} alt="" fill sizes="768px" className="object-cover" /></div>
          <div className="space-y-6 text-lg leading-relaxed text-ink">{p.body.map((para, i) => <p key={i}>{para}</p>)}</div>
        </div>
      </article>
      <CtaBanner />
    </>
  );
}
