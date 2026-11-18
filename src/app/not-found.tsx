import Link from "next/link";
export default function NotFound() {
  return (
    <section className="grid min-h-[80svh] place-items-center bg-navy px-5 pt-20 text-center text-white">
      <div><p className="font-heading text-8xl font-extrabold text-orange">404</p><h1 className="h2 mt-4">Page not found.</h1><Link href="/" className="btn btn-primary mt-8">Back to Home</Link></div>
    </section>
  );
}
