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
