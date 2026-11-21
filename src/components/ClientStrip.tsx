import Image from "next/image";

const clientLogos = [
  { name: "Ceva Logistics", image: "/images/clients/logos/ceva-logistics.png" },
  { name: "Duserve Facilities Management", image: "/images/clients/logos/duserve.png" },
  { name: "EFS Facilities Services", image: "/images/clients/logos/efs.png" },
  { name: "World Star Holding", image: "/images/clients/logos/world-star.png" },
  { name: "Adecco", image: "/images/clients/logos/adecco.png" },
  { name: "Farnek", image: "/images/clients/logos/farnek.png" },
  { name: "IDC Technologies", image: "/images/clients/logos/idc-technologies.png" },
  { name: "Marmoom Manpower Supply", image: "/images/clients/logos/marmoom.png" },
];

export function ClientStrip({ title = "Trusted by enterprise clients across the UAE" }: { title?: string }) {
  const row = [...clientLogos, ...clientLogos];
  return (
    <section aria-label="Our clients" className="border-b border-line bg-white py-12">
      <p className="container-site text-center text-sm font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="marquee-wrap relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <ul className="animate-marquee flex w-max items-center gap-14 pr-14">
          {row.map((client, i) => (
            <li key={`${client.name}-${i}`} aria-hidden={i >= clientLogos.length} className="flex h-14 w-36 shrink-0 items-center justify-center rounded-lg bg-white px-3">
              <Image src={client.image} alt={i < clientLogos.length ? client.name : ""} width={144} height={56} quality={90} sizes="144px" className="h-full w-full object-contain" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
