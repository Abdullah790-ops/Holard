import { MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";

/** Persistent WhatsApp contact control; remains visible while the number is pending. */
export function ConsultFloat() {
  const contactHref = site.whatsappHref ?? (site.whatsappNumber ? `https://wa.me/${site.whatsappNumber.replace(/\D/g, "")}` : null);
  const className = "fixed bottom-5 left-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 font-heading text-sm font-bold text-white shadow-lg transition hover:bg-[#1eae55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]";
  const mark = <span className="relative grid h-6 w-6 place-items-center"><MessageCircle className="h-6 w-6" aria-hidden /><Phone className="absolute h-3 w-3" aria-hidden /></span>;

  if (contactHref) {
    return (
      <a href={contactHref} target="_blank" rel="noopener noreferrer" aria-label={`Chat with HOLARD on WhatsApp${site.whatsappNumber ? ` at ${site.whatsappNumber}` : ""}`}
        className={`${className} cursor-pointer`}>
        {mark}<span>WhatsApp</span>
      </a>
    );
  }
  return (
    <button type="button" disabled aria-label="WhatsApp number will be added" title="WhatsApp number will be added" className={`${className} cursor-not-allowed opacity-90`}>
      {mark}<span>WhatsApp</span>
    </button>
  );
}
