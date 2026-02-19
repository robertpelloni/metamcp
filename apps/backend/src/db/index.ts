<<<<<<< HEAD
=======

>>>>>>> fix/detached-head-recovery
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

<<<<<<< HEAD
if (!DATABASE_TYPE || !['postgresql', 'sqlite'].includes(DATABASE_TYPE)) {
  throw new Error("DATABASE_TYPE must be either 'postgresql' or 'sqlite'");
}

let pool: Pool | null = null;
let sqliteDb: Database.Database | null = null;

// Initialize database connection based on type
if (DATABASE_TYPE === "postgresql") {
  // Use an explicit pg Pool so we can attach a global error handler.
  // This prevents unhandled 'error' events from bringing down the Node process
  // when the database terminates idle connections (e.g., during maintenance).
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
    // Log and continue so the process doesn't crash on idle client errors.
    // pg-pool will create a new client on the next checkout automatically.
    console.error("PostgreSQL pool error (ignored):", err);
  });
} else if (DATABASE_TYPE === "sqlite") {
  // Initialize SQLite database
  sqliteDb = new Database(DATABASE_URL);
  
  // Enable WAL mode for better concurrency
  sqliteDb.pragma('journal_mode = WAL');
  
  // Enable foreign keys
  sqliteDb.pragma('foreign_keys = ON');
}

// Create the appropriate Drizzle instance
export const typedDb = DATABASE_TYPE === "sqlite" 
  ? drizzleSqlite(sqliteDb!, { schema })
  : drizzle(pool!, { schema });

export const db = typedDb as any;

=======
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

>>>>>>> fix/detached-head-recovery
// Graceful shutdown function
export const closeDatabase = async () => {
  if (DATABASE_TYPE === "postgresql" && pool) {
    await pool.end();
  } else if (DATABASE_TYPE === "sqlite" && sqliteDb) {
    sqliteDb.close();
  }
};
