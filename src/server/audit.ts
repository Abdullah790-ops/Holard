import "server-only";
import { getDb, schema } from "@/db";

export async function audit(actorId: string | null, action: string, resourceType?: string, resourceId?: string, meta?: Record<string, unknown>) {
  const db = await getDb();
  await db.insert(schema.auditEvents).values({ actorId, action, resourceType, resourceId, meta });
}
