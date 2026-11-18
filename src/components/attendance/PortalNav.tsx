"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav({ tabs, badges }: { tabs: { href: string; label: string }[]; badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav aria-label="Portal" className="mx-auto max-w-5xl overflow-x-auto px-4">
      <ul className="flex gap-1">
        {tabs.map((t) => {
          const on = t.href === "/portal" ? path === "/portal" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-[3px] px-3 py-3 text-sm font-semibold ${on ? "border-orange text-navy" : "border-transparent text-muted hover:text-navy"}`}>
                {t.label}{!!badges[t.href] && <span className="rounded-full bg-orange px-1.5 text-xs text-white">{badges[t.href]}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
