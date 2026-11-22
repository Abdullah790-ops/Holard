const facts = [
  { value: "500+", label: "Workers deployed" },
  { value: "50+", label: "Clients served" },
  { value: "24 Hours", label: "Deployment" },
];

export function TrustBar() {
  return (
    <section aria-label="HOLARD at a glance" className="bg-navy-2 text-white">
      <div className="container-site grid divide-y divide-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-h-28 flex-col justify-center px-4 py-5 sm:px-6 lg:px-8">
            <p className="font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">{fact.value}</p>
            <p className="mt-1 text-xs font-medium text-white/70 sm:text-sm">{fact.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
