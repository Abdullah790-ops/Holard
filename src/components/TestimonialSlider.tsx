"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { clients } from "@/lib/site";
import { ClientLogo } from "./ClientLogo";
import { Stars } from "./Stars";

export function TestimonialSlider({ count = 6 }: { count?: number }) {
  const items = clients.slice(0, count);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [paused, items.length]);
  const c = items[i];
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}>
      <figure className="relative rounded-3xl bg-navy p-8 text-white sm:p-12 lg:p-16" aria-live="polite">
        <Quote className="h-12 w-12 text-orange" aria-hidden />
        <Stars />
        <blockquote className="mt-6 font-heading text-2xl font-semibold leading-snug sm:text-3xl lg:text-[38px] lg:leading-[1.25]">
          “{c.quote}”
        </blockquote>
        <figcaption className="mt-10 flex items-center gap-4">
          <ClientLogo name={c.name} tone="dark" className="h-16 w-28" />
          <div>
            <p className="font-heading text-lg font-bold">{c.name}</p>
            <p className="text-white/65">{c.role} · {c.industry}</p>
          </div>
        </figcaption>
      </figure>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2" role="tablist" aria-label="Choose testimonial">
          {items.map((t, k) => (
            <button key={t.name} role="tab" aria-selected={k === i} aria-label={t.name} onClick={() => setI(k)}
              className={`h-2.5 rounded-full transition-all ${k === i ? "w-10 bg-orange" : "w-2.5 bg-navy/20 hover:bg-navy/40"}`} />
          ))}
        </div>
        <div className="flex gap-3">
          <button aria-label="Previous testimonial" onClick={() => setI((i - 1 + items.length) % items.length)} className="grid h-12 w-12 place-items-center rounded-full border-2 border-navy text-navy transition hover:bg-navy hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
          <button aria-label="Next testimonial" onClick={() => setI((i + 1) % items.length)} className="grid h-12 w-12 place-items-center rounded-full bg-orange text-white transition hover:bg-orange-dark"><ArrowRight className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  );
}
