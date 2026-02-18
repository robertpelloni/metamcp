import { McpConfig } from "@repo/zod-types";
import logger from "@/utils/logger";
import { mcpConfigService } from "../mcp-config.service";

/**
 * Keeps project-root mcp.json synchronized with DB-backed public MCP servers.
 *
 * This service controls the "Hot Reload" feature by listening to 
 * McpConfigService updates and triggering a DB sync.
 */
export class McpJsonHotReloadService {
  async initialize() {
    logger.info("[McpJsonHotReloadService] Initializing via McpConfigService...");

    // Listen for updates from McpConfigService (which watches the file)
    mcpConfigService.on("updated", async (config: McpConfig) => {
      logger.info("[McpJsonHotReloadService] Config updated, syncing to DB...");
      try {
        await mcpConfigService.syncWithDatabase();
      } catch (err) {
        logger.error("[McpJsonHotReloadService] Failed to sync with database:", err);
      }
    });

    // We don't need to do an initial sync here because startup.ts 
    // explicitly calls mcpConfigService.syncWithDatabase() on boot.
  }
}

export const mcpJsonHotReloadService = new McpJsonHotReloadService();
