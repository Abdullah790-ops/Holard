// Single-series bar chart (SVG). Title names the series, so no legend; bars carry
// a native hover tooltip via <title>, and a data table is always available below.
export function BarChart({
  title, unit, data, format = (n: number) => n.toLocaleString("en-US"), note,
}: {
  title: string; unit: string; note?: string;
  data: { label: string; value: number; projected?: boolean }[];
  format?: (n: number) => string;
}) {
  const W = 560, H = 280, pad = { t: 30, r: 8, b: 34, l: 8 };
  const max = Math.max(...data.map((d) => d.value)) * 1.08;
  const bw = (W - pad.l - pad.r) / data.length;
  const barW = Math.min(56, bw * 0.56);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  return (
    <figure className="card p-6 lg:p-8">
      <figcaption>
        <p className="font-heading text-lg font-bold text-navy">{title}</p>
        <p className="text-sm text-muted">{unit}{note ? ` · ${note}` : ""}</p>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad.l} x2={W - pad.r} y1={y(max * g)} y2={y(max * g)} stroke="#E5E7EB" strokeWidth="1" />
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="#9CA3AF" strokeWidth="1" />
        {data.map((d, i) => {
          const cx = pad.l + bw * i + bw / 2;
          const top = y(d.value);
          return (
            <g key={d.label} className="group">
              <title>{`${d.label}: ${format(d.value)}${d.projected ? " (target)" : ""}`}</title>
              <rect x={cx - bw / 2} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              <path
                d={`M${cx - barW / 2},${H - pad.b} V${top + 4} q0,-4 4,-4 H${cx + barW / 2 - 4} q4,0 4,4 V${H - pad.b} Z`}
                fill={d.projected ? "url(#hatch)" : "#0B1E4B"}
                stroke={d.projected ? "#FF6B00" : "none"} strokeWidth="2"
                className="transition-opacity group-hover:opacity-80"
              />
              <text x={cx} y={top - 8} textAnchor="middle" className="fill-ink text-[13px] font-semibold">{format(d.value)}</text>
              <text x={cx} y={H - pad.b + 22} textAnchor="middle" className="fill-[#4B5563] text-[13px]">{d.label}</text>
            </g>
          );
        })}
        <defs>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#FFF1E6" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#FF6B00" strokeWidth="3" />
          </pattern>
        </defs>
      </svg>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-navy">View as table</summary>
        <table className="mt-3 w-full text-left">
          <thead><tr className="border-b border-line text-muted"><th className="py-2 font-medium">Period</th><th className="py-2 text-right font-medium">{unit}</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.label} className="border-b border-line/60"><td className="py-2">{d.label}{d.projected ? " (target)" : ""}</td><td className="py-2 text-right tabular-nums">{format(d.value)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
