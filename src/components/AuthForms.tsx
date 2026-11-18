"use client";

import { useKeepAction } from "./useKeepAction";
import Link from "next/link";
import { Info, Loader2 } from "lucide-react";
import { changePassword, requestPasswordReset, resetPassword, type AuthState } from "@/server/auth-actions";

function Msg({ s }: { s: AuthState }) {
  if (!s) return null;
  return (
    <>
      {s.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{s.error}</p>}
      {s.info && <p role="status" className="flex gap-2 rounded-xl bg-mist p-3 text-sm"><Info className="h-5 w-5 shrink-0 text-orange" aria-hidden />{s.info}</p>}
      {s.devLink && <p className="rounded-xl border border-dashed border-orange p-3 text-sm"><strong>Development only:</strong> <Link className="font-semibold text-orange underline" href={s.devLink}>open reset link</Link></p>}
    </>
  );
}

const Btn = ({ p, children }: { p: boolean; children: React.ReactNode }) => (
  <button type="submit" disabled={p} className="btn btn-primary w-full">{p ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Please wait" /> : children}</button>
);

const PwFields = () => (
  <>
    <div><label htmlFor="password" className="field-label">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="field" /><p className="mt-1 text-xs text-muted">At least 10 characters, with letters and numbers.</p></div>
    <div><label htmlFor="confirm" className="field-label">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" /></div>
  </>
);

export function ForgotForm() {
  const [s, a, p] = useKeepAction(requestPasswordReset, undefined as AuthState);
  return (
    <form onSubmit={a} className="space-y-5">
      <div><label htmlFor="email" className="field-label">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
      <Msg s={s} />
      <Btn p={p}>Send reset link</Btn>
      <p className="text-center text-sm"><Link href="/login" className="font-semibold text-orange">Back to sign in</Link></p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [s, a, p] = useKeepAction(resetPassword, undefined as AuthState);
  if (s?.info) return <div className="space-y-5"><Msg s={s} /><Link href="/login" className="btn btn-primary w-full">Sign in</Link></div>;
  return (
    <form onSubmit={a} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <PwFields />
      <Msg s={s} />
      <Btn p={p}>Set password</Btn>
    </form>
  );
}

export function ChangePasswordForm({ needCurrent = false }: { needCurrent?: boolean }) {
  const [s, a, p] = useKeepAction(changePassword, undefined as AuthState);
  return (
    <form onSubmit={a} className="space-y-5">
      {needCurrent && <div><label htmlFor="current" className="field-label">Current password</label><input id="current" name="current" type="password" autoComplete="current-password" required className="field" /></div>}
      <PwFields />
      <Msg s={s} />
      <Btn p={p}>Save password</Btn>
    </form>
  );
}
