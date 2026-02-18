import { apiKeysImplementations } from "../src/trpc/api-keys.impl";

async function main() {
    try {
        const userId = "test-user-id";
        console.log(`Testing apiKeysImplementations.list with userId: ${userId}`);
        const result = await apiKeysImplementations.list(userId);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error running debug script:", error);
    }
}

main();
