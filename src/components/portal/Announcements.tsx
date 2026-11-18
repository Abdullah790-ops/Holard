import { Megaphone } from "lucide-react";
import type { Role } from "@/db/schema";
import { announcementsFor } from "@/server/portal";

export async function Announcements({ role }: { role: Role }) {
  const items = await announcementsFor(role, 3);
  if (!items.length) return null;
  return (
    <section aria-labelledby="ann-h" className="rounded-2xl border border-orange/30 bg-orange/5 p-5">
      <h2 id="ann-h" className="flex items-center gap-2 font-heading text-base font-bold text-navy"><Megaphone className="h-5 w-5 text-orange" aria-hidden />Announcements</h2>
      <ul className="mt-3 space-y-3">
        {items.map((a) => (
          <li key={a.id}>
            <p className="font-semibold text-navy">{a.title}</p>
            <p className="whitespace-pre-line text-sm text-ink">{a.body}</p>
            <p className="mt-0.5 text-xs text-muted">{new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" })}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
