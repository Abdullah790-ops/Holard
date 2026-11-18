import { CheckCircle2 } from "lucide-react";
import { LeadForm } from "./LeadForm";

export function HireSection({ title = "Hire Workers In 48 Hours", sub = "Tell us what you need. We call back within 2 working hours with availability and a quote.", defaults }: { title?: string; sub?: string; defaults?: Record<string, string> }) {
  return (
    <section id="hire" className="section scroll-mt-20 bg-navy text-white">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Hire Workers</p>
          <h2 className="h2 mt-4">{title}</h2>
          <p className="mt-5 text-lg text-white/75">{sub}</p>
          <ul className="mt-8 space-y-4">
            {["50–500 workers in 48–72 hours", "Visa, salary, housing & transport included", "Replacement within 24 hours", "One monthly invoice with attendance"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-white/90"><CheckCircle2 className="h-6 w-6 shrink-0 text-orange" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-6 text-ink sm:p-10 lg:col-span-7">
          <LeadForm type="hire" defaults={defaults} />
        </div>
      </div>
    </section>
  );
}
