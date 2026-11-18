"use client";

import { useEffect, useRef, useState } from "react";

type Stat = { value: number; prefix?: string; suffix?: string; label: string; raw?: boolean };

function Counter({ s, start }: { s: Stat; start: boolean }) {
  const [n, setN] = useState(s.raw ? s.value : 0);
  useEffect(() => {
    if (!start || s.raw) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(s.value); return; }
    let raf = 0; const t0 = performance.now(); const dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(s.value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, s]);
  return <>{s.prefix}{s.raw ? s.value : n.toLocaleString("en-US")}{s.suffix}</>;
}

export function StatsCounter({ items, dark = false }: { items: Stat[]; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStart(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4 ${dark ? "bg-white/10" : "bg-line"}`}>
      {items.map((s) => (
        <div key={s.label} className={`px-5 py-7 lg:px-8 lg:py-9 ${dark ? "bg-navy-2/80 backdrop-blur" : "bg-white"}`}>
          <p className={`font-heading text-3xl font-extrabold tracking-tight lg:text-[44px] ${dark ? "text-white" : "text-navy"}`}>
            <Counter s={s} start={start} />
          </p>
          <p className={`mt-2 text-sm font-medium lg:text-base ${dark ? "text-white/70" : "text-muted"}`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}
