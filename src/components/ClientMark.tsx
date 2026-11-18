export function ClientMark({ short, size = "md", onDark = false }: { short: string; size?: "md" | "lg"; onDark?: boolean }) {
  const s = size === "lg" ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";
  return (
    <span aria-hidden className={`grid ${s} shrink-0 place-items-center rounded-xl ${onDark ? "bg-orange" : "bg-navy"} font-heading font-extrabold tracking-tight text-white`}>
      {short}
    </span>
  );
}
