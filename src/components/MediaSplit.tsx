import Image from "next/image";

export function MediaSplit({ image, alt, children, reverse = false, bg = "bg-white" }: { image: string; alt: string; children: React.ReactNode; reverse?: boolean; bg?: string }) {
  return (
    <section className={`section ${bg}`}>
      <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl ${reverse ? "lg:order-2" : ""}`}>
          <Image src={image} alt={alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
