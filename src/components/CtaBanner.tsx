import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export function CtaBanner({
  title = "Need 50 Workers This Week?",
  sub = "Book a free consultation. We'll call you back, understand your sites and shifts, and share availability and a quote.",
}: { title?: string; sub?: string }) {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-site">
        <div className="relative overflow-hidden rounded-3xl bg-orange px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-16 lg:py-16">
          <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-32 right-40 h-72 w-72 rounded-full bg-navy/10" />
          <div className="relative max-w-2xl">
            <h2 className="h2 text-white">{title}</h2>
            <p className="mt-4 text-lg text-white/90">{sub}</p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-4 lg:mt-0 lg:shrink-0">
            <Link href="/book-consultation" className="btn bg-white text-navy hover:bg-navy hover:text-white">
              <CalendarCheck className="h-5 w-5" aria-hidden /> Book Consultation
            </Link>
            <Link href="/contact#hire" className="btn btn-outline-light">Hire Workers</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
