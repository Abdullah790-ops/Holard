import Image from "next/image";
import { Logo } from "./Logo";

export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center bg-navy px-5 pb-16 pt-28">
      <Image src="/images/login-bg.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-navy/85" />
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
        <h1 className="h3 text-navy">{title}</h1>
        {sub && <p className="mb-6 mt-2 text-muted">{sub}</p>}
        {children}
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
