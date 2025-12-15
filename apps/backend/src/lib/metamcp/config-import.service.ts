import { McpServerTypeEnum } from "@repo/zod-types";
import { z } from "zod";

import { mcpServersRepository } from "../../db/repositories/mcp-servers.repo";

export class ConfigImportService {
  async importClaudeConfig(configJson: string, userId?: string | null): Promise<any> {
    try {
      const config = JSON.parse(configJson);
      if (!config.mcpServers || typeof config.mcpServers !== "object") {
        throw new Error("Invalid configuration: 'mcpServers' object not found.");
      }

      const serversToCreate = [];
      const errors = [];

      for (const [name, definition] of Object.entries(config.mcpServers)) {
        // Validate name format (alphanumeric + underscore/hyphen)
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const def = definition as any;

        if (def.command) {
          // Stdio Server
          serversToCreate.push({
            name: safeName,
            type: McpServerTypeEnum.Enum.STDIO,
            command: def.command,
            args: def.args || [],
            env: def.env || {},
            user_id: userId,
          });
        } else if (def.url) {
          // SSE Server (Assuming SSE for URL-based in config, usually)
          serversToCreate.push({
            name: safeName,
            type: McpServerTypeEnum.Enum.SSE,
            url: def.url,
            user_id: userId,
          });
        } else {
            errors.push(`Skipped '${name}': Unknown server type (no command or url)`);
        }
      }

      if (serversToCreate.length > 0) {
          await mcpServersRepository.bulkCreate(serversToCreate);
      }

      return {
        imported: serversToCreate.length,
        skipped: errors,
      };

    } catch (error) {
      console.error("Config import failed:", error);
      throw error;
    }
  }
}

export const configImportService = new ConfigImportService();
