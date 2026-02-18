
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool } from "pg";
import Database from 'better-sqlite3';

import * as schema from "./schema";

const { DATABASE_URL, POSTGRES_CA_CERT, DATABASE_TYPE } = process.env;

let pool: Pool | null = null;
let sqliteDb: Database.Database | null = null;

// Initialize database connection based on type
if (!DATABASE_URL) {
  console.warn("[DB] DATABASE_URL is not set. Database features will be disabled. Using JSON-only mode where possible.");
} else if (!DATABASE_TYPE || !['postgresql', 'sqlite'].includes(DATABASE_TYPE)) {
  console.warn("[DB] DATABASE_TYPE must be either 'postgresql' or 'sqlite'. Defaulting to JSON-only mode where possible.");
} else {
  if (DATABASE_TYPE === "postgresql") {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ...(POSTGRES_CA_CERT && {
        ssl: {
          ca: POSTGRES_CA_CERT,
          rejectUnauthorized: true,
        },
      }),
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error (ignored):", err);
    });
  } else if (DATABASE_TYPE === "sqlite") {
    sqliteDb = new Database(DATABASE_URL);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
  }
}

// Create the appropriate Drizzle instance or a dummy proxy
export const typedDb = (pool || sqliteDb)
  ? (DATABASE_TYPE === "sqlite"
    ? drizzleSqlite(sqliteDb!, { schema })
    : drizzle(pool!, { schema }))
  : new Proxy({}, {
    get: (_target, prop) => {
      // Allow access to properties but fail on function calls or query building usage
      if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => {
          const err = new Error("Database not configured (JSON-only mode)");
          // Log warning but throw to stop execution flow that depends on DB
          // console.warn(err.message); 
          throw err;
        };
      }
      return undefined;
    }
  });

export const db = typedDb as any;

// Graceful shutdown function
export const closeDatabase = async () => {
  if (DATABASE_TYPE === "postgresql" && pool) {
    await pool.end();
  } else if (DATABASE_TYPE === "sqlite" && sqliteDb) {
    sqliteDb.close();
  }
};
