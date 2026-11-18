import "server-only";

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();
const MAX_WINDOW = 60 * 60_000;

/** Sliding-window limiter (in-memory; swap for Redis when running more than one server). */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  // Drop stale keys so a flood of unique keys cannot grow memory forever.
  if (now - lastSweep > 60_000 || buckets.size > 50_000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > MAX_WINDOW) buckets.delete(k);
    lastSweep = now;
  }
  const list = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  buckets.set(key, list.slice(-(max + 1)));
  return list.length > max;
}
