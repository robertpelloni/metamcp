import { Client } from "pg";
import { config } from "dotenv";
import path from "path";

// Load environment variables from correct path
// Assuming script is run from apps/backend root
config({ path: path.resolve(process.cwd(), "../../.env") });

const run = async () => {
    console.log("Starting manual migration...");

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database");

        // Add columns to tool_call_logs
        console.log("Adding columns to tool_call_logs...");
        await client.query(`ALTER TABLE "tool_call_logs" ADD COLUMN IF NOT EXISTS "session_id" text;`);
        await client.query(`ALTER TABLE "tool_call_logs" ADD COLUMN IF NOT EXISTS "parent_call_uuid" text;`);

        // Add foreign key columns if not exist
        await client.query(`ALTER TABLE "tool_call_logs" ADD COLUMN IF NOT EXISTS "mcp_server_uuid" uuid REFERENCES "mcp_servers"("uuid") ON DELETE SET NULL;`);
        await client.query(`ALTER TABLE "tool_call_logs" ADD COLUMN IF NOT EXISTS "namespace_uuid" uuid REFERENCES "namespaces"("uuid") ON DELETE SET NULL;`);
        await client.query(`ALTER TABLE "tool_call_logs" ADD COLUMN IF NOT EXISTS "endpoint_uuid" uuid REFERENCES "endpoints"("uuid") ON DELETE SET NULL;`);

        // Create docker_session_status enum type
        console.log("Creating docker_session_status enum...");
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE "docker_session_status" AS ENUM ('PENDING', 'RUNNING', 'STOPPED', 'ERROR', 'NOT_FOUND');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create docker_sessions table
        console.log("Creating docker_sessions table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS "docker_sessions" (
                "uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "mcp_server_uuid" uuid NOT NULL REFERENCES "mcp_servers"("uuid") ON DELETE cascade,
                "container_id" text NOT NULL,
                "container_name" text,
                "url" text,
                "status" "docker_session_status" DEFAULT 'PENDING' NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
                "started_at" timestamp with time zone,
                "stopped_at" timestamp with time zone,
                "error_message" text,
                "retry_count" integer DEFAULT 0 NOT NULL,
                "last_retry_at" timestamp with time zone,
                "max_retries" integer DEFAULT 3 NOT NULL
            );
        `);

        // Create indexes
        console.log("Creating indexes for docker_sessions...");
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "docker_sessions_unique_server_idx" ON "docker_sessions" ("mcp_server_uuid");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "docker_sessions_mcp_server_uuid_idx" ON "docker_sessions" ("mcp_server_uuid");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "docker_sessions_status_idx" ON "docker_sessions" ("status");`);

        console.log("Migration completed successfully");

    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
};

run();
