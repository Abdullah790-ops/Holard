import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow, title, sub, image, crumbs = [], children,
}: {
  eyebrow?: string; title: string; sub?: string; image?: string | null;
  crumbs?: { label: string; href?: string }[]; children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      {image && <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />}
      <div className={`absolute inset-0 -z-10 ${image ? "bg-gradient-to-r from-navy via-navy/90 to-navy/45" : "bg-[radial-gradient(ellipse_at_top_right,_var(--color-navy-3),_var(--color-navy)_65%)]"}`} />
      <div className="container-site pb-20 pt-36 lg:pb-28 lg:pt-48">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span aria-current="page" className="text-white">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow fade-up">{eyebrow}</p>}
        <h1 className="h1 fade-up mt-5 max-w-4xl text-white">{title}</h1>
        {sub && <p className="fade-up mt-6 max-w-2xl text-lg text-white/80 lg:text-xl">{sub}</p>}
        {children && <div className="fade-up mt-9 flex flex-wrap gap-4">{children}</div>}
      </div>
    </section>
  );
}
