import Link from "next/link";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { CalendarPlus, FileText, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { setEnquiryStatus } from "@/server/admin/misc-actions";
import { Badge, Empty, fmtDateTime, PageHeader, Pagination } from "@/components/admin/ui";

export const metadata = { title: "Inbox" };
const TYPES: Record<string, string> = { consultation: "Consultations", hire: "Hire requests", contact: "Messages", investor: "Investor access", review: "Reviews", careers: "Office job applications" };
const LABELS: Record<string, string> = { topic: "Topic", preferredDate: "Preferred date", preferredTime: "Preferred time", meeting: "Meeting type", category: "Workers needed", quantity: "Number of workers", industry: "Industry", location: "Location", message: "Message", iam: "I am", interest: "Investment interest", rating: "Rating", role: "Role" };
const PAGE = 20;

/** Pre-filled Google Calendar event for the callback (manual booking, no integration needed). */
function calendarLink(name: string | null, company: string | null, d: Record<string, string | number>) {
  const date = String(d.preferredDate ?? "").replace(/-/g, "");
  const startH = String(d.preferredTime ?? "").startsWith("Afternoon") ? 12 : String(d.preferredTime ?? "").startsWith("Late") ? 15 : 9;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dates = date ? `${date}T${pad(startH)}0000/${date}T${pad(startH)}3000` : "";
  const q = new URLSearchParams({ action: "TEMPLATE", text: `Holard consultation — ${name ?? ""}${company ? ` (${company})` : ""}`, details: `${d.topic ?? ""} · ${d.meeting ?? ""}\n${d.message ?? ""}`, ...(dates ? { dates, ctz: "Asia/Dubai" } : {}) });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export default async function Inbox({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = await getDb();
  const e = schema.enquiries;
  const w: SQL[] = [];
  if (sp.type && TYPES[sp.type]) w.push(eq(e.type, sp.type));
  if (sp.status) w.push(eq(e.status, sp.status as "new"));
  const where = w.length ? and(...w) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [rows, [{ n }], counts] = await Promise.all([
    db.select().from(e).where(where).orderBy(desc(e.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(e).where(where),
    db.select({ t: e.type, n: count() }).from(e).where(eq(e.status, "new")).groupBy(e.type),
  ]);
  const newBy = Object.fromEntries(counts.map((r) => [r.t, r.n]));
  const tab = (t: string | undefined, label: string) => {
    const on = (sp.type ?? "") === (t ?? "");
    const num = t ? newBy[t] ?? 0 : counts.reduce((a, r) => a + r.n, 0);
    return <Link key={label} href={t ? `?type=${t}` : "?"} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-navy text-white" : "bg-white text-navy hover:bg-line"}`}>{label}{num > 0 && <span className="ml-1.5 rounded-full bg-orange px-1.5 text-xs text-white">{num}</span>}</Link>;
  };
  return (
    <>
      <PageHeader title="Inbox" sub="Everything submitted through the website (except job applications, which go to Candidates)." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{tab(undefined, "All")}{Object.entries(TYPES).map(([k, v]) => tab(k, v))}</div>
      {rows.length === 0 ? <Empty title="Nothing here yet" sub="New website submissions will appear here." /> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const d = r.data as Record<string, string | number>;
            const isReview = r.type === "review";
            const isInvestor = r.type === "investor";
            return (
              <li key={r.id} className={`rounded-2xl border bg-white p-5 lg:p-6 ${r.status === "new" ? "border-orange/40" : "border-line"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-orange">{TYPES[r.type] ?? r.type} · <span className="font-mono">{r.reference}</span></p>
                    <p className="mt-1 font-heading text-lg font-bold text-navy">{r.name ?? "—"}{r.company ? <span className="font-medium text-muted"> · {r.company}</span> : null}</p>
                    <p className="text-sm text-muted">{fmtDateTime(r.createdAt)}</p>
                  </div>
                  <Badge status={r.status} />
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(d).filter(([k]) => !["name", "company", "email", "phone"].includes(k)).map(([k, v]) => (
                    <div key={k} className={k === "message" ? "sm:col-span-2 lg:col-span-3" : ""}>
                      <dt className="text-muted">{LABELS[k] ?? k}</dt>
                      <dd className="font-medium whitespace-pre-line">{k === "rating" ? <span className="inline-flex items-center gap-1">{v}<Star className="h-4 w-4 fill-orange text-orange" aria-hidden /></span> : String(v)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-orange"><Mail className="h-4 w-4" aria-hidden />{r.email}</a>}
                  {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-orange"><Phone className="h-4 w-4" aria-hidden />{r.phone}</a>}
                  {r.type === "consultation" && <a href={calendarLink(r.name, r.company, d)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-orange"><CalendarPlus className="h-4 w-4" aria-hidden />Add to Google Calendar</a>}
                  {r.phone && <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#128C7E]"><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp</a>}
                  {(r.fileIds as string[]).map((f, i) => <a key={f} href={`/api/files/${f}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange"><FileText className="h-4 w-4" aria-hidden />File {i + 1}</a>)}
                  <div className="ml-auto flex flex-wrap gap-2">
                    {(isReview || isInvestor
                      ? [["approved", isReview ? "Approve for website" : "Approve", "btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"], ["rejected", "Reject", "btn btn-sm btn-outline"]]
                      : [...(r.status === "new" ? [["in_progress", "Mark in progress", "btn btn-sm btn-outline"]] : []), ...(r.status !== "done" ? [["done", "Mark done", "btn btn-sm btn-navy"]] : [])]
                    ).map(([st, label, cls]) => (
                      <form key={st} action={setEnquiryStatus}>
                        <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={st} />
                        <button className={cls}>{label}</button>
                      </form>
                    ))}
                  </div>
                </div>
                {isInvestor && r.status === "approved" && <p className="mt-3 text-sm text-muted">Next: create their login in <Link href="/admin/users" className="font-semibold text-orange">Users &amp; Access</Link> with role Investor. The investor portal opens in Phase 2D.</p>}
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pages={Math.max(1, Math.ceil(n / PAGE))} total={n} makeHref={(p) => `?${new URLSearchParams({ ...(sp as Record<string, string>), page: String(p) })}`} />
    </>
  );
}
