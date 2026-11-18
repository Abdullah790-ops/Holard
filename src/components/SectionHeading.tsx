export function SectionHeading({
  eyebrow, title, sub, center = false, light = false, className = "",
}: { eyebrow?: string; title: string; sub?: string; center?: boolean; light?: boolean; className?: string }) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && <p className={`eyebrow ${center ? "justify-center" : ""}`}>{eyebrow}</p>}
      <h2 className={`h2 mt-4 ${light ? "text-white" : "text-navy"}`}>{title}</h2>
      {sub && <p className={`lead mt-5 ${light ? "!text-white/75" : ""}`}>{sub}</p>}
    </div>
  );
}
