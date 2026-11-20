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
    <main className="grid min-h-[100svh] place-items-center bg-mist px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-3xl bg-white p-7 shadow-xl sm:p-10">
          <h1 className="h3 text-navy">{title}</h1>
          {sub && <p className="mb-6 mt-2 text-muted">{sub}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}
