import { clients } from "@/lib/site";

export function ClientStrip({ title = "Trusted by enterprise clients across the UAE" }: { title?: string }) {
  const row = [...clients, ...clients];
  return (
    <section aria-label="Our clients" className="border-b border-line bg-white py-12">
      <p className="container-site text-center text-sm font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="marquee-wrap relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <ul className="animate-marquee flex w-max items-center gap-14 pr-14">
          {row.map((c, i) => (
            <li key={i} aria-hidden={i >= clients.length} className="whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight text-navy/45 transition hover:text-navy lg:text-[28px]">
              {c.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
