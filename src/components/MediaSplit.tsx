import Image from "next/image";
import { Building2 } from "lucide-react";

export function MediaSplit({ image, alt, children, reverse = false, bg = "bg-white" }: { image?: string | null; alt: string; children: React.ReactNode; reverse?: boolean; bg?: string }) {
  return (
    <section className={`section ${bg}`}>
      <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${reverse ? "lg:order-2" : ""}`}>
          {image ? <Image src={image} alt={alt} fill quality={90} sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_70%_20%,_var(--color-navy-3),_var(--color-navy)_72%)]"><Building2 className="h-20 w-20 text-white/25" aria-hidden /></div>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
