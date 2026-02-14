
import { serverHealthImplementations } from "../src/trpc/server-health.impl";
import { config } from "dotenv";
import path from "path";

// Load env
config({ path: path.resolve(process.cwd(), "../../.env") });

async function run() {
    console.log("Verifying Server Health Implementation...");
    try {
        const result = await serverHealthImplementations.getHealth({ serverUuids: [] }, "test-user-id");
        console.log("Result:", JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
}

run();
