import { Plus } from "lucide-react";

export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-lg font-semibold text-navy lg:text-xl [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist text-navy transition group-open:rotate-45 group-open:bg-orange group-open:text-white">
              <Plus className="h-5 w-5" aria-hidden />
            </span>
          </summary>
          <p className="mt-4 max-w-3xl text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
