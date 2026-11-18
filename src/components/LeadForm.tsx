"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { forms } from "@/lib/forms";

export function LeadForm({ type, dark = false, defaults = {}, options = {} }: { type: keyof typeof forms; dark?: boolean; defaults?: Record<string, string>; options?: Record<string, string[]> }) {
  const def = forms[type];
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ref, setRef] = useState("");
  const [rating, setRating] = useState(5);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending"); setError(""); setErrors({});
    const fd = new FormData(e.currentTarget);
    fd.set("_type", type);
    if (def.fields.some((f) => f.type === "rating")) fd.set("rating", String(rating));
    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setErrors(json.errors ?? {}); setError(json.error ?? "Please check the form."); setState("error"); return; }
      setRef(json.reference); setState("done");
    } catch {
      setError("Network error — please try again or email us."); setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={`rounded-2xl p-8 text-center ${dark ? "bg-white/5 text-white" : "bg-mist"}`} role="status">
        <CheckCircle2 className="mx-auto h-14 w-14 text-orange" aria-hidden />
        <h3 className="h3 mt-4">Thank you!</h3>
        <p className={`mx-auto mt-3 max-w-md ${dark ? "text-white/75" : "text-muted"}`}>{def.success}</p>
        <p className={`mt-3 text-sm ${dark ? "text-white/60" : "text-muted"}`}>Reference: <strong>{ref}</strong></p>
        <Link href="/" className="btn btn-primary mt-6">Back to Home</Link>
      </div>
    );
  }

  const label = `field-label ${dark ? "!text-white" : ""}`;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2" encType="multipart/form-data">
      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px]"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {def.fields.map((f) => {
        const id = `${type}-${f.name}`;
        const err = errors[f.name];
        const common = { id, name: f.name, required: f.required, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : undefined, defaultValue: defaults[f.name] } as const;
        return (
          <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
            {f.type === "rating" ? (
              <fieldset>
                <legend className={label}>{f.label}</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n}
                      className="text-orange"><Star className={`h-8 w-8 ${n <= rating ? "fill-current" : ""}`} /></button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <>
                <label htmlFor={id} className={label}>{f.label}{f.required && <span className="text-orange"> *</span>}</label>
                {f.type === "select" ? (
                  <select {...common} className="field" defaultValue={defaults[f.name] ?? ""}>
                    <option value="" disabled>Select…</option>
                    {(options[f.name] ?? f.options!).map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea {...common} className="field" placeholder={f.placeholder} />
                ) : f.type === "date" ? (
                  <input {...common} type="date" className="field" min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" })} />
                ) : f.type === "file" ? (
                  <input {...common} type="file" accept={f.accept} className={`field file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white ${dark ? "" : ""}`} />
                ) : (
                  <input {...common} type={f.type} min={f.min} max={f.max} placeholder={f.placeholder} className="field"
                    autoComplete={f.name === "email" ? "email" : f.name === "phone" ? "tel" : f.name === "name" ? "name" : f.name === "company" ? "organization" : undefined} />
                )}
              </>
            )}
            {err && <p id={`${id}-err`} className="mt-1.5 text-sm font-medium text-red-600">{err}</p>}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        {state === "error" && error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full sm:w-auto">
          {state === "sending" ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Sending…</> : def.button}
        </button>
        <p className={`mt-4 text-sm ${dark ? "text-white/60" : "text-muted"}`}>
          By submitting you agree to our <Link href="/privacy-policy" className="underline hover:text-orange">Privacy Policy</Link>. We only use your details to respond to this request.
        </p>
      </div>
    </form>
  );
}
