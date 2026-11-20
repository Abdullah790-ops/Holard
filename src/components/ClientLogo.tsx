import Image from "next/image";
import { Building2 } from "lucide-react";

const logos: Record<string, string> = {
  "Farnek": "/images/clients/farnek.webp",
  "EFS": "/images/clients/efs.webp",
  "Ceva Logistics": "/images/clients/ceva-logistics.webp",
  "Duserve": "/images/clients/duserve.webp",
  "World Star": "/images/clients/world-star.webp",
  "IDC Technologies": "/images/clients/idc-technologies.webp",
  "Marmoom Manpower": "/images/clients/marmoom.webp",
  "Adecco": "/images/clients/adecco.webp",
};

export function ClientLogo({ name, className = "" }: { name: string; className?: string }) {
  const src = logos[name];
  return (
    <span className={`grid h-16 w-24 shrink-0 place-items-center rounded-xl border border-line bg-white p-2 ${className}`}>
      {src ? <Image src={src} alt={`${name} logo`} width={112} height={64} sizes="112px" className="max-h-full max-w-full object-contain" /> : <Building2 className="h-7 w-7 text-navy/45" aria-label={`${name} logo unavailable`} />}
    </span>
  );
}
