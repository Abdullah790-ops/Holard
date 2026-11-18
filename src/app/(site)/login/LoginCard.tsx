"use client";

import { useActionState, useState } from "react";
import { useKeepAction } from "@/components/useKeepAction";
import Link from "next/link";
import { Info, Loader2, Mail, Smartphone } from "lucide-react";
import { loginWithPassword, requestOtp, verifyOtp, type AuthState } from "@/server/auth-actions";

function Notice({ s }: { s: AuthState }) {
  if (!s) return null;
  return (
    <>
      {s.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{s.error}</p>}
      {s.info && <p role="status" className="flex gap-2 rounded-xl bg-mist p-3 text-sm"><Info className="h-5 w-5 shrink-0 text-orange" aria-hidden />{s.info}</p>}
      {s.devCode && <p className="rounded-xl border border-dashed border-orange p-3 text-sm"><strong>Development only:</strong> your code is <span className="font-mono text-base font-bold">{s.devCode}</span></p>}
    </>
  );
}

const Submit = ({ pending, children }: { pending: boolean; children: React.ReactNode }) => (
  <button disabled={pending} className="btn btn-primary w-full">{pending ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Please wait" /> : children}</button>
);

export function LoginCard() {
  const [mode, setMode] = useState<"email" | "otp">("email");
  const [pwState, pwSubmit, pwPending] = useKeepAction(loginWithPassword, undefined as AuthState);
  const [reqState, reqAction, reqPending] = useActionState(requestOtp, undefined);
  const [verState, verAction, verPending] = useActionState(verifyOtp, undefined);
  const [phone, setPhone] = useState("");
  const codeStep = reqState?.step === "code" && !reqState.error;

  return (
    <div className="w-full max-w-md justify-self-center rounded-3xl bg-white p-7 shadow-2xl sm:p-10 lg:justify-self-end">
      <h2 className="h3 text-navy">Sign in</h2>
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1" role="tablist" aria-label="Sign-in method">
        {([["email", "Email", Mail], ["otp", "Phone + OTP", Smartphone]] as const).map(([k, l, I]) => (
          <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${mode === k ? "bg-white text-navy shadow" : "text-muted"}`}>
            <I className="h-4 w-4" aria-hidden />{l}
          </button>
        ))}
      </div>

      {mode === "email" ? (
        <form onSubmit={pwSubmit} className="mt-6 space-y-5">
          <div><label htmlFor="email" className="field-label">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="field" /></div>
          <div><label htmlFor="pw" className="field-label">Password</label><input id="pw" name="password" type="password" autoComplete="current-password" required className="field" /></div>
          <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-orange hover:underline">Forgot password?</Link></div>
          <Notice s={pwState} />
          <Submit pending={pwPending}>Sign in</Submit>
        </form>
      ) : !codeStep ? (
        <form action={reqAction} className="mt-6 space-y-5">
          <div><label htmlFor="ph" className="field-label">Phone number</label><input id="ph" name="phone" type="tel" autoComplete="tel" placeholder="+971 5X XXX XXXX" required className="field" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Notice s={reqState} />
          <Submit pending={reqPending}>Send code</Submit>
        </form>
      ) : (
        <form action={verAction} className="mt-6 space-y-5">
          <input type="hidden" name="phone" value={phone} />
          <Notice s={reqState} />
          <div><label htmlFor="code" className="field-label">6-digit code</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className="field text-center font-mono text-2xl tracking-[0.5em]" /></div>
          {verState?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{verState.error}</p>}
          <Submit pending={verPending}>Verify &amp; sign in</Submit>
          <button type="button" onClick={() => location.reload()} className="w-full text-sm font-semibold text-muted hover:text-navy">Use a different number</button>
        </form>
      )}
      <p className="mt-6 text-center text-xs text-muted">Accounts are created by Holard. Need access? <Link href="/contact" className="font-semibold text-orange">Contact us</Link></p>
    </div>
  );
}
