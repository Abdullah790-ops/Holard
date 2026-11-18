import "server-only";

export type FormState = { error?: string; errors?: Record<string, string>; ok?: string; data?: Record<string, string> } | undefined;

export class ValidationError extends Error {
  constructor(public errors: Record<string, string>) { super("Validation failed"); }
}

/** Small typed reader for FormData with collected field errors. */
export function reader(fd: FormData) {
  const errors: Record<string, string> = {};
  const raw = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  return {
    errors,
    str(k: string, o: { required?: boolean; max?: number; label?: string } = {}) {
      const v = raw(k).slice(0, o.max ?? 300);
      if (o.required && !v) errors[k] = `${o.label ?? "This field"} is required.`;
      return v || null;
    },
    email(k: string, required = false) {
      const v = raw(k).toLowerCase();
      if (!v) { if (required) errors[k] = "Email is required."; return null; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) errors[k] = "Enter a valid email.";
      return v;
    },
    num(k: string, o: { required?: boolean; min?: number; max?: number; int?: boolean } = {}) {
      const s = raw(k).replace(/,/g, "");
      if (!s) { if (o.required) errors[k] = "Required."; return null; }
      const n = Number(s);
      if (!Number.isFinite(n) || (o.int && !Number.isInteger(n)) || (o.min !== undefined && n < o.min) || (o.max !== undefined && n > o.max)) {
        errors[k] = "Enter a valid number."; return null;
      }
      return n;
    },
    date(k: string, required = false) {
      const s = raw(k);
      if (!s) { if (required) errors[k] = "Date is required."; return null; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) { errors[k] = "Enter a valid date."; return null; }
      return s;
    },
    oneOf<T extends string>(k: string, allowed: readonly T[], fallback?: T) {
      const v = raw(k) as T;
      if (allowed.includes(v)) return v;
      if (fallback !== undefined && !v) return fallback;
      errors[k] = "Choose a valid option.";
      return (fallback ?? allowed[0]) as T;
    },
    uuid(k: string) {
      const v = raw(k);
      if (!v) return null;
      if (!/^[0-9a-f-]{36}$/i.test(v)) { errors[k] = "Invalid selection."; return null; }
      return v;
    },
    check() { if (Object.keys(errors).length) throw new ValidationError(errors); },
  };
}

/** Wrap a server action body: converts validation errors into form state. */
export async function handle(fn: () => Promise<FormState | void>): Promise<FormState> {
  try {
    return (await fn()) ?? undefined;
  } catch (e) {
    if (e instanceof ValidationError) return { error: "Please fix the highlighted fields.", errors: e.errors };
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e; // redirect / notFound
    if (e instanceof Error && e.name === "FileError") return { error: e.message };
    console.error(e);
    return { error: "Something went wrong. Please try again." };
  }
}
