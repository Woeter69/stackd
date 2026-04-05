import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import "dotenv/config";

// Strip ?sslmode=require if it's there so it doesn't override our explicit ssl config below
const url = (process.env.DATABASE_URL || "").split("?")[0];

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

/** Ensure schema is up to date */
export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE rooms ADD COLUMN IF NOT EXISTS pot INTEGER NOT NULL DEFAULT 0;
    `);
    console.log("[db] Migrations OK");
  } finally {
    client.release();
  }
}
