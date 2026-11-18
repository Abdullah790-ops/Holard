"use client";

import { createContext, useContext } from "react";
import { useKeepAction } from "../useKeepAction";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

type FormState = { error?: string; errors?: Record<string, string>; ok?: string; data?: Record<string, string> } | undefined;
type Action = (state: FormState, fd: FormData) => Promise<FormState>;

const Ctx = createContext<FormState>(undefined);
const PendingCtx = createContext(false);
/** Read field errors inside an <ActionForm>. */
export const useFieldError = (name: string) => useContext(Ctx)?.errors?.[name];

export function ActionForm({ action, children, className = "", submit = "Save", resetOnOk = false, extra }: {
  action: Action; children: React.ReactNode; className?: string; submit?: string | null; resetOnOk?: boolean; extra?: React.ReactNode;
}) {
  const [state, onSubmit, pending] = useKeepAction(action, undefined as FormState);
  return (
    <Ctx.Provider value={state}>
    <PendingCtx.Provider value={pending}>
      <form onSubmit={onSubmit} className={className} key={resetOnOk && state?.ok ? state.ok : undefined} noValidate>
        {children}
        {(state?.error || state?.ok) && (
          <div className="col-span-full">
            {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
            {state.ok && <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /><span className="whitespace-pre-line">{state.ok}</span></p>}
          </div>
        )}
        {(submit || extra) && (
          <div className="col-span-full flex flex-wrap items-center gap-3">
            {submit && <SubmitButton>{submit}</SubmitButton>}
            {extra}
          </div>
        )}
      </form>
    </PendingCtx.Provider>
    </Ctx.Provider>
  );
}

export function SubmitButton({ children, className = "btn btn-primary btn-sm", name, value }: { children: React.ReactNode; className?: string; name?: string; value?: string }) {
  const status = useFormStatus();
  const pending = useContext(PendingCtx) || status.pending;
  return (
    <button type="submit" disabled={pending} className={className} name={name} value={value}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Saving" /> : children}
    </button>
  );
}

/** Text/number/date/select input wired to field errors. */
export function In({ label, name, type = "text", defaultValue, required, options, hint, className = "", placeholder, ...rest }: {
  label: string; name: string; type?: string; defaultValue?: string | number | null; required?: boolean;
  options?: { value: string; label: string }[]; hint?: string; className?: string; placeholder?: string; step?: string; accept?: string; rows?: number;
}) {
  const err = useFieldError(name);
  const common = { id: name, name, required, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${name}-err` : undefined, className: "field" };
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">{label}{required && <span className="text-orange"> *</span>}</label>
      {options ? (
        <select {...common} defaultValue={defaultValue ?? ""}>
          <option value="">—</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea {...common} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={rest.rows ?? 4} />
      ) : (
        <input {...common} type={type} defaultValue={type === "file" ? undefined : defaultValue ?? ""} placeholder={placeholder} step={rest.step} accept={rest.accept}
          className={type === "file" ? "field file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" : "field"} />
      )}
      {hint && !err && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {err && <p id={`${name}-err`} className="mt-1 text-sm font-medium text-red-600">{err}</p>}
    </div>
  );
}
