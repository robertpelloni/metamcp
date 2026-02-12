import { ServerParameters } from "@repo/zod-types";

import { mcpServersRepository, namespacesRepository } from "../db/repositories";
import { initializeEnvironmentConfiguration } from "./bootstrap.service";
import { metaMcpServerPool } from "./metamcp";
import { convertDbServerToParams } from "./metamcp/utils";

// Store the interval ID for potential cleanup
let periodicSyncInterval: NodeJS.Timeout | null = null;

/**
 * Startup initialization that must happen before the HTTP server begins listening.
 *
 * IMPORTANT: This function does not prevent the app from starting unless BOOTSTRAP_FAIL_HARD=true.
 */
export async function initializeOnStartup(): Promise<void> {
  const parseBool = (value: string | undefined, defaultValue: boolean) => {
    if (value === undefined) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
    return defaultValue;
  };

  const enableEnvBootstrap = parseBool(process.env.BOOTSTRAP_ENABLE, true);
  const failHard = parseBool(process.env.BOOTSTRAP_FAIL_HARD, false);

  if (enableEnvBootstrap) {
    try {
      await initializeEnvironmentConfiguration();
    } catch (err) {
      console.error(
        "❌ Error initializing environment-based configuration (ignored):",
        err,
      );
      if (failHard) {
        throw err;
      }
    }
  } else {
    console.log("Environment bootstrap disabled via BOOTSTRAP_ENABLE=false");
  }
}

/**
 * Startup function to initialize idle servers for all namespaces and all MCP servers
 */
export async function initializeDockerContainers() {
  try {
    console.log("Initializing Docker containers for stdio MCP servers...");

    // Clean up any leftover temporary sessions from previous failed attempts
    console.log("Cleaning up temporary sessions...");
    const cleanedCount = await dockerSessionsRepo.cleanupTemporarySessions();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} temporary sessions`);
    }

    // First, sync any existing container statuses to fix discrepancies
    console.log("Syncing existing container statuses...");
    const { syncedCount, totalCount } =
      await dockerManager.syncAllContainerStatuses();
    if (syncedCount > 0) {
      console.log(
        `Fixed ${syncedCount} out of ${totalCount} container status discrepancies`,
      );
    }

    // Fetch all MCP servers from the database
    const allDbServers = await mcpServersRepository.findAll();
    console.log(`Found ${allDbServers.length} total MCP servers in database`);

    // Convert all database servers to ServerParameters format
    const allServerParams: Record<string, ServerParameters> = {};
    for (const dbServer of allDbServers) {
      const serverParams = await convertDbServerToParams(dbServer);
      if (serverParams) {
        allServerParams[dbServer.uuid] = serverParams;
      }
    }

    console.log(
      `Successfully converted ${Object.keys(allServerParams).length} MCP servers to ServerParameters format`,
    );

    // Initialize Docker containers for stdio servers
    if (Object.keys(allServerParams).length > 0) {
      await dockerManager.initializeContainers(allServerParams);
      console.log(
        "✅ Successfully initialized Docker containers for stdio MCP servers",
      );
    }

    // Start periodic container status synchronization
    periodicSyncInterval = dockerManager.startPeriodicSync(30000); // Sync every 30 seconds
    console.log("✅ Started periodic container status synchronization");

    console.log(
      "✅ Successfully initialized Docker containers for all MCP servers",
    );
  } catch (error) {
    console.log("❌ Error initializing idle servers:", error);
    // Don't exit the process, just log the error
    // The server should still start even if Docker initialization fails
  }
}

/**
 * Cleanup function to stop periodic sync
 */
export function cleanupDockerSync() {
  if (periodicSyncInterval) {
    dockerManager.stopPeriodicSync(periodicSyncInterval);
    periodicSyncInterval = null;
  }
}
