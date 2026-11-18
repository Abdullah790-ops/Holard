import "server-only";

/**
 * The visitor's IP, for rate limiting and the audit log.
 *
 * Browsers can send any X-Forwarded-For value they like, so the LEFT-most entry is attacker-controlled.
 * Each proxy in front of the app appends the address it saw, so we read from the RIGHT, skipping
 * TRUSTED_PROXY_HOPS - 1 entries (default: 1 proxy, e.g. the load balancer / CDN in 2E).
 */
export function clientIp(h: Headers): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1);
  const list = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const ip = list.length ? list[Math.max(0, list.length - hops)] : h.get("x-real-ip");
  return (ip ?? "local").slice(0, 64);
}
