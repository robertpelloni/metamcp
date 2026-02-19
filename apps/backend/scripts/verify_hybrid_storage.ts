
import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";
import { McpServerTypeEnum } from "@repo/zod-types";
import { eq } from "drizzle-orm";

// Load env
const envPath = path.resolve(process.cwd(), ".env");
console.log(`Loading .env from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
    console.warn("⚠️ Failed to load .env file:", result.error);
}

// Fallback: If running from root or if loading failed
if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL missing from .env, using default local fallback...");
    process.env.DATABASE_URL = "postgresql://metamcp_user:m3t4mcp@localhost:5432/metamcp_db";
}

if (!process.env.DATABASE_TYPE) {
    process.env.DATABASE_TYPE = "postgresql";
}

console.log("Environment loaded. DB URL starts with:", process.env.DATABASE_URL.substring(0, 15) + "...");
console.log("Database Type:", process.env.DATABASE_TYPE);

async function run() {
    console.log("🔍 Verifying Hybrid Storage (Dual Write)...");

    // Dynamic imports to ensure env is loaded first
    const { mcpServersRepository } = await import("../src/db/repositories");
    const { db } = await import("../src/db");
    const { mcpServersTable } = await import("../src/db/schema");

    const testServerName = `test-server-${Date.now()}`;
    const mcpJsonPath = path.resolve(process.cwd(), "mcp.json");

    try {
        // 1. Create Server via Repository
        console.log(`\n1. Creating server '${testServerName}' via Repository...`);
        const created = await mcpServersRepository.create({
            name: testServerName,
            type: McpServerTypeEnum.Enum.STDIO,
            command: "echo",
            args: ["hello"],
            env: {},
            user_id: null // Public server
        });
        console.log("✅ Server created with UUID:", created.uuid);

        // 2. Verify in mcp.json
        console.log("\n2. Checking mcp.json...");
        const jsonContent = await fs.readFile(mcpJsonPath, "utf-8");
        const json = JSON.parse(jsonContent);
        if (json.mcpServers && json.mcpServers[testServerName]) {
            console.log("✅ Found in mcp.json");
        } else {
            console.error("❌ NOT FOUND in mcp.json");
            console.error("Content:", JSON.stringify(json, null, 2));
            process.exit(1);
        }

        // 3. Verify in Database
        console.log("\n3. Checking PostgreSQL...");
        const dbRecord = await db.query.mcpServersTable.findFirst({
            where: eq(mcpServersTable.uuid, created.uuid)
        });

        if (dbRecord) {
            console.log("✅ Found in PostgreSQL");
        } else {
            console.error("❌ NOT FOUND in PostgreSQL");
            process.exit(1);
        }

        // 4. Cleanup
        console.log("\n4. Cleaning up...");
        await mcpServersRepository.deleteByUuid(created.uuid);

        // Verify cleanup
        const jsonContentAfter = await fs.readFile(mcpJsonPath, "utf-8");
        const jsonAfter = JSON.parse(jsonContentAfter);
        const dbRecordAfter = await db.query.mcpServersTable.findFirst({
            where: eq(mcpServersTable.uuid, created.uuid)
        });

        if (!jsonAfter.mcpServers[testServerName] && !dbRecordAfter) {
            console.log("✅ Cleanup successful (removed from both)");
        } else {
            console.error("❌ Cleanup failed");
            if (jsonAfter.mcpServers[testServerName]) console.error("- Still in mcp.json");
            if (dbRecordAfter) console.error("- Still in DB");
            process.exit(1);
        }

        console.log("\n🎉 Hybrid Storage Verification PASSED!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    }
}

run();
