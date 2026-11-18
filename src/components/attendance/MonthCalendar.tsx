import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Day = { s: "P" | "A" | "L" | "OFF"; ot: number } | null;
const CELL: Record<string, string> = { P: "bg-emerald-100 text-emerald-800", A: "bg-red-100 text-red-700", L: "bg-amber-100 text-amber-800", OFF: "bg-gray-100 text-gray-500" };
const WORD: Record<string, string> = { P: "Present", A: "Absent", L: "Leave", OFF: "Off" };

/** Month calendar of attendance codes. `hrefFor(month)` builds prev/next links. */
export function MonthCalendar({ month, days, today, hrefFor, weeklyOff }: { month: string; days: Day[]; today: string; hrefFor: (m: string) => string; weeklyOff?: string }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0 Sun
  const lead = (first + 6) % 7; // Monday-first
  const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const totals = days.reduce((a, d) => { if (d) { a[d.s]++; a.ot += d.ot; } return a; }, { P: 0, A: 0, L: 0, OFF: 0, ot: 0 } as Record<string, number>);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={hrefFor(prev)} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></Link>
        <p className="font-heading text-lg font-bold text-navy">{label}</p>
        {next <= today.slice(0, 7) ? <Link href={hrefFor(next)} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white" aria-label="Next month"><ChevronRight className="h-5 w-5" /></Link> : <span className="h-10 w-10" />}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted" aria-hidden>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className={weeklyOff?.startsWith(d) ? "text-orange" : ""}>{d}</div>)}
      </div>
      <ol className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }).map((_, i) => <li key={`l${i}`} aria-hidden />)}
        {days.map((d, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const future = date > today;
          return (
            <li key={i} className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${d ? CELL[d.s] : future ? "bg-white text-gray-300" : "bg-white text-gray-400"} ${date === today ? "ring-2 ring-orange" : ""}`}
              aria-label={`${i + 1}: ${d ? WORD[d.s] + (d.ot ? `, ${d.ot} h overtime` : "") : future ? "upcoming" : "not marked"}`}>
              <span className="text-[11px] opacity-70">{i + 1}</span>
              <span className="font-heading font-bold leading-none">{d ? (d.s === "OFF" ? "Off" : d.s) : ""}</span>
              {d?.ot ? <span className="text-[10px] font-bold">+{d.ot}h</span> : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span><strong className="text-emerald-700">{totals.P}</strong> present</span><span><strong className="text-red-700">{totals.A}</strong> absent</span>
        <span><strong className="text-amber-700">{totals.L}</strong> leave</span><span><strong>{totals.OFF}</strong> off</span><span><strong className="text-navy">{totals.ot}</strong> h overtime</span>
      </p>
    </div>
  );
}
