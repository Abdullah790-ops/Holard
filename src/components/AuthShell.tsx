import { Logo } from "./Logo";

export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_72%_10%,_var(--color-navy-3),_var(--color-navy)_60%)] px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
          <h1 className="h3 text-navy">{title}</h1>
          {sub && <p className="mb-6 mt-2 text-muted">{sub}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function BareAuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <main className="relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-[#f2f4f8] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-orange/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 -z-10 h-[36rem] w-[36rem] rounded-full bg-navy/10 blur-3xl" />
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_-40px_rgba(8,24,51,0.35)] lg:min-h-[680px] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative isolate flex flex-col justify-between overflow-hidden bg-navy p-8 text-white sm:p-12 lg:p-14">
          <div className="absolute -right-24 top-20 -z-10 h-80 w-80 rounded-full border-[56px] border-white/[0.04]" />
          <div className="absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-orange/20 blur-3xl" />
          <div>
            <div className="inline-flex rounded-xl bg-white p-2.5"><Logo height={40} /></div>
            <p className="eyebrow mt-14 text-orange">One-time secure setup</p>
            <h2 className="mt-4 max-w-md font-heading text-3xl font-extrabold leading-tight sm:text-4xl">Your back office starts here.</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">Create the owner account to manage workforce operations, access controls, and the Holard team workspace.</p>
          </div>
          <div className="mt-12 space-y-4">
            {["Create the Super Admin account", "Secure your sign-in credentials", "Invite your team from the back office"].map((step, i) => <div key={step} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange font-heading text-sm font-extrabold text-white">0{i + 1}</span><span className="text-sm font-semibold text-white/85">{step}</span></div>)}
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">HOLARD · Workforce UAE</p>
        </aside>
        <section className="flex items-center px-7 py-9 sm:px-12 sm:py-12 lg:px-16">
          <div className="w-full max-w-lg">
            <div className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange"><span className="h-1.5 w-1.5 rounded-full bg-orange" />Owner account</div>
            <h1 className="h3 text-navy">{title}</h1>
            {sub && <p className="mb-7 mt-2 max-w-md leading-relaxed text-muted">{sub}</p>}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
