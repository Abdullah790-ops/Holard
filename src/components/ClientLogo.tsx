import Image from "next/image";
import { Building2 } from "lucide-react";

const logos: Record<string, string> = {
  "Farnek": "/images/clients/logos/farnek.png",
  "EFS": "/images/clients/logos/efs.png",
  "Ceva Logistics": "/images/clients/logos/ceva-logistics.png",
  "Duserve": "/images/clients/logos/duserve.png",
  "World Star": "/images/clients/logos/world-star.png",
  "IDC Technologies": "/images/clients/logos/idc-technologies.png",
  "Marmoom Manpower": "/images/clients/logos/marmoom.png",
  "Adecco": "/images/clients/logos/adecco.png",
};

export function ClientLogo({ name, className = "", tone = "light" }: { name: string; className?: string; tone?: "light" | "dark" }) {
  const src = logos[name];
  return (
    <span className={`grid h-16 w-24 shrink-0 place-items-center ${tone === "dark" ? "rounded-none border-0 bg-transparent p-0" : "rounded-xl border border-line bg-white p-2"} ${className}`}>
      {src ? <Image src={src} alt={`${name} logo`} width={112} height={64} sizes="112px" className={`max-h-full max-w-full object-contain ${tone === "dark" ? "brightness-0 invert" : ""}`} /> : <Building2 className="h-7 w-7 text-navy/45" aria-label={`${name} logo unavailable`} />}
    </span>
  );
}
