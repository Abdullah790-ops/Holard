import "server-only";
import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

let lastCleanup = 0;

/** Atomic shared-window limiter stored in PostgreSQL, shared across Vercel instances. */
export async function rateLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  const db = await getDb();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  // Store only a digest so emails, phone numbers, and IP addresses are not persisted in clear text.
  const hashedKey = createHash("sha256").update(key).digest("hex");
  const [bucket] = await db.insert(schema.rateLimitBuckets)
    .values({ key: hashedKey, count: 1, resetAt })
    .onConflictDoUpdate({
      target: schema.rateLimitBuckets.key,
      set: {
        count: sql`case when ${schema.rateLimitBuckets.resetAt} <= ${now} then 1 else ${schema.rateLimitBuckets.count} + 1 end`,
        resetAt: sql`case when ${schema.rateLimitBuckets.resetAt} <= ${now} then ${resetAt} else ${schema.rateLimitBuckets.resetAt} end`,
      },
    })
    .returning({ count: schema.rateLimitBuckets.count });

  // Opportunistically remove expired identifiers to keep the table bounded.
  if (Date.now() - lastCleanup > 60_000) {
    lastCleanup = Date.now();
    await db.delete(schema.rateLimitBuckets).where(lt(schema.rateLimitBuckets.resetAt, now));
  }
  return (bucket?.count ?? max + 1) > max;
}
