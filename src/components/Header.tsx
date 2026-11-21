"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, LogIn } from "lucide-react";
import { nav } from "@/lib/site";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenSub(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Transparent over dark heroes; solid once scrolled.
  const solid = scrolled || open;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "bg-white/95 shadow-[0_8px_30px_-12px_rgb(10_25_49/.18)] backdrop-blur" : "bg-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-5 md:px-8">
        <span className="origin-left">
          <Logo light={!solid} height={68} />
        </span>

        <nav aria-label="Main" className="hidden min-[1360px]:block">
          <ul className="flex items-center">
            {nav.map((item) => (
              <li key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-[14.5px] font-semibold transition ${
                    solid ? "text-ink hover:text-orange" : "text-white/90 hover:text-white"
                  } ${isActive(item.href) ? "!text-orange" : ""}`}
                >
                  {item.label}
                  {item.children && <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" aria-hidden />}
                </Link>
                {item.children && (
                  <div className="invisible absolute left-1/2 top-full w-[360px] -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="rounded-2xl border border-line bg-white p-3 shadow-2xl">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block rounded-xl px-4 py-3 transition hover:bg-mist">
                            <span className="block font-heading text-[15px] font-semibold text-navy">{c.label}</span>
                            <span className="mt-0.5 block text-[13px] leading-snug text-muted">{c.desc}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={`hidden items-center gap-1.5 whitespace-nowrap text-[15px] font-semibold sm:flex ${solid ? "text-navy hover:text-orange" : "text-white hover:text-white/80"}`}
          >
            <LogIn className="h-4 w-4" aria-hidden /> Login
          </Link>
          <Link href="/contact#hire" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Hire Workers
          </Link>
          <button
            type="button"
            className={`grid h-10 w-10 place-items-center rounded-lg sm:h-11 sm:w-11 min-[1360px]:hidden ${solid ? "text-navy" : "text-white"}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6 sm:h-7 sm:w-7" /> : <Menu className="h-6 w-6 sm:h-7 sm:w-7" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="mobile-menu-enter h-[calc(100dvh-5rem)] overflow-y-auto border-t border-line bg-white sm:h-[calc(100dvh-5rem)] min-[1360px]:hidden">
          <nav aria-label="Mobile" className="container-site py-6">
            <ul className="divide-y divide-line">
              {nav.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-4 font-heading text-lg font-semibold text-navy"
                        aria-expanded={openSub === item.label}
                        onClick={() => setOpenSub(openSub === item.label ? null : item.label)}
                      >
                        {item.label}
                        <ChevronDown className={`h-5 w-5 transition ${openSub === item.label ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      {openSub === item.label && (
                        <ul className="mb-4 space-y-1 rounded-xl bg-mist p-2">
                          <li><Link href={item.href} className="block rounded-lg px-3 py-2.5 font-semibold text-orange">All {item.label}</Link></li>
                          {item.children.map((c) => (
                            <li key={c.href}><Link href={c.href} className="block rounded-lg px-3 py-2.5 text-ink hover:bg-white">{c.label}</Link></li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} className="block py-4 font-heading text-lg font-semibold text-navy">{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3">
              <Link href="/contact#hire" className="btn btn-primary w-full">Hire Talent</Link>
              <Link href="/login" className="btn btn-outline w-full">Login</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
