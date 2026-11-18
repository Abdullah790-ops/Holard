import path from "node:path";
import { mkdirSync } from "node:fs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

// Local development: embedded PostgreSQL (PGlite) stored in ./data/pglite — nothing to install.
// Production: set DATABASE_URL to a real PostgreSQL database.
const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function init(): Promise<DB> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db;
  }
  const dir = path.join(process.cwd(), "data", "pglite");
  mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as DB;
}

const g = globalThis as unknown as { __holardDb?: Promise<DB> };
export function getDb(): Promise<DB> {
  if (!g.__holardDb) g.__holardDb = init().catch((e) => { g.__holardDb = undefined; throw e; });
  return g.__holardDb;
}
export { schema };
