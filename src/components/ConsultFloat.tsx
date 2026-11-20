import Link from "next/link";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

/** Floating "Book Consultation" button (replaces WhatsApp). */
export function ConsultFloat() {
  if (site.whatsappHref) {
    return (
      <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat with HOLARD on WhatsApp"
        className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#128C7E] px-5 py-3.5 font-heading text-sm font-bold text-white shadow-lg transition hover:bg-[#0f766e]">
        <MessageCircle className="h-5 w-5" aria-hidden /><span className="hidden sm:inline">WhatsApp</span>
      </a>
    );
  }
  return (
    <Link href="/book-consultation" aria-label="Book a consultation"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3.5 font-heading text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgb(255_107_0/.7)] transition hover:bg-orange-dark">
      <CalendarCheck className="h-5 w-5" aria-hidden /><span className="hidden sm:inline">Book Consultation</span>
    </Link>
  );
}
