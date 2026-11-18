import { PageHero } from "./PageHero";

export function LegalPage({ title, updated = "9 November 2026", children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero image="/images/blog-wps.jpg" eyebrow="Legal" title={title} sub={`Last updated: ${updated}`} crumbs={[{ label: title }]} />
      <section className="section bg-white">
        <div className="container-site prose-legal max-w-3xl">
          <p className="rounded-xl bg-mist p-5 text-sm">Draft for review. This page will be finalised after review by qualified UAE legal counsel.</p>
          {children}
        </div>
      </section>
    </>
  );
}
