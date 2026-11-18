"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, LogIn, LogOut, MapPin } from "lucide-react";
import { selfCheckIn, selfCheckOut } from "@/server/attendance-actions";

type FormState = { error?: string; ok?: string } | undefined;

export function CheckInCard({ state: day, siteName, shiftLabel, requireSelfie, mode }: {
  state: { checkIn: string | null; checkOut: string | null; status: string | null; hours: string | null; late: boolean; outside: boolean };
  siteName: string | null; shiftLabel: string | null; requireSelfie: boolean; mode: "both" | "self" | "supervisor" | null;
}) {
  const [inState, inAction, inPending] = useActionState(selfCheckIn, undefined as FormState);
  const [outState, outAction, outPending] = useActionState(selfCheckOut, undefined as FormState);
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState("");
  const selfieRef = useRef<HTMLInputElement>(null);
  const [selfieName, setSelfieName] = useState("");

  const checkIn = () => {
    setGeoErr("");
    if (!("geolocation" in navigator)) { setGeoErr("Your phone does not support location. Ask your supervisor to mark you."); return; }
    if (requireSelfie && !selfieRef.current?.files?.length) { setGeoErr("Take a selfie first."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const fd = new FormData();
        fd.set("lat", String(pos.coords.latitude));
        fd.set("lng", String(pos.coords.longitude));
        fd.set("accuracy", String(Math.round(pos.coords.accuracy)));
        const f = selfieRef.current?.files?.[0];
        if (f) fd.set("selfie", f);
        startTransition(() => inAction(fd));
      },
      (err) => { setLocating(false); setGeoErr(err.code === 1 ? "Location is blocked. Allow location for this site in your browser settings, then try again." : "Could not get your location. Move to an open area and try again."); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const msg = inState?.error || outState?.error || geoErr;
  const ok = inState?.ok || outState?.ok;
  const busy = locating || inPending || outPending;
  const checkedIn = !!day.checkIn;

  return (
    <section className="rounded-3xl bg-navy p-6 text-white sm:p-8" aria-labelledby="today-h">
      <p id="today-h" className="text-sm font-semibold uppercase tracking-[0.16em] text-orange">Today</p>
      <p className="mt-2 font-heading text-2xl font-extrabold">
        {day.status === "L" ? "On leave today" : day.status === "OFF" ? "Day off" : day.status === "A" ? "Marked absent — check in if you are at work" : checkedIn ? (day.checkOut ? "Shift complete" : "You are checked in") : "Not checked in yet"}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-white/70"><MapPin className="h-4 w-4" aria-hidden />{siteName ?? "No site assigned"}{shiftLabel ? ` · ${shiftLabel}` : ""}</p>

      {checkedIn && (
        <dl className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 text-center">
          <div><dt className="text-xs text-white/60">In</dt><dd className="font-heading text-xl font-bold">{day.checkIn}</dd></div>
          <div><dt className="text-xs text-white/60">Out</dt><dd className="font-heading text-xl font-bold">{day.checkOut ?? "—"}</dd></div>
          <div><dt className="text-xs text-white/60">Hours</dt><dd className="font-heading text-xl font-bold">{day.hours ?? "—"}</dd></div>
        </dl>
      )}
      {(day.late || day.outside) && <p className="mt-3 text-sm text-orange">{day.late && "Late check-in. "}{day.outside && "Checked in away from the site — your supervisor will review."}</p>}

      {mode === "supervisor" ? (
        <p className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/80">Your supervisor marks attendance at this site.</p>
      ) : !day.status || ((day.status === "P" || day.status === "A") && !day.checkIn) ? (
        <div className="mt-6 space-y-3">
          <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/30 px-4 text-sm font-semibold hover:border-orange">
            <Camera className="h-5 w-5" aria-hidden />{selfieName ? "Selfie ready ✓" : requireSelfie ? "Take selfie (required)" : "Add selfie (optional)"}
            <input ref={selfieRef} type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => setSelfieName(e.target.files?.[0]?.name ?? "")} />
          </label>
          <button type="button" onClick={checkIn} disabled={busy} className="btn btn-primary !min-h-[64px] w-full !text-lg">
            {busy ? <><Loader2 className="h-6 w-6 animate-spin" aria-hidden />{locating ? "Getting location…" : "Checking in…"}</> : <><LogIn className="h-6 w-6" aria-hidden />Check in now</>}
          </button>
          <p className="text-center text-xs text-white/50">Your location is recorded only at check-in to confirm you are at your site.</p>
        </div>
      ) : checkedIn && !day.checkOut ? (
        <button type="button" onClick={() => startTransition(() => outAction())} disabled={busy} className="btn mt-6 !min-h-[64px] w-full bg-white !text-lg text-navy hover:bg-mist">
          {outPending ? <Loader2 className="h-6 w-6 animate-spin" aria-label="Checking out" /> : <><LogOut className="h-6 w-6" aria-hidden />Check out</>}
        </button>
      ) : null}

      {msg && <p role="alert" className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm font-medium text-red-100">{msg}</p>}
      {ok && <p role="status" className="mt-4 flex gap-2 rounded-xl bg-emerald-500/15 p-3 text-sm font-medium text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />{ok}</p>}
    </section>
  );
}
