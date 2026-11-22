import { site } from "@/lib/site";

/** Persistent WhatsApp contact control. */
export function ConsultFloat() {
  const contactHref = site.whatsappHref ?? (site.whatsappNumber ? `https://wa.me/${site.whatsappNumber.replace(/\D/g, "")}` : null);
  return (
    <a href={contactHref} target="_blank" rel="noopener noreferrer" aria-label={`Chat with HOLARD on WhatsApp${site.whatsappNumber ? ` at ${site.whatsappNumber}` : ""}`}
      className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] p-3.5 font-heading text-sm font-bold text-white shadow-lg transition hover:bg-[#1eae55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:px-5 cursor-pointer">
      <svg viewBox="0 0 448 512" className="h-6 w-6 shrink-0 fill-current" aria-hidden="true">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.5 32 1.9 131.6 1.9 254c0 39.1 10.2 77.3 29.6 110.9L0 480l117.8-30.9c32.4 17.7 68.9 27 106 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115.9-67.1-157.9zM223.9 438.7c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.9 18.3 18.7-68.2-4.4-7C49 322.4 39.4 288.6 39.4 254c0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.5 54.1s57.1 81.2 57.1 130.5c0 101.7-85.9 184.6-187.7 184.6zm101.3-138.3c-5.5-2.8-32.8-16.2-37.9-18.1-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.5-14.3 18.1-17.5 21.8-3.2 3.7-6.5 4.2-12 1.4-32.7-16.4-54.2-29.3-75.8-66.3-5.7-9.8 5.7-9.1 16.4-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.5-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.7 3.7 39.1 59.7 94.7 83.7 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 5.9-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.7z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
