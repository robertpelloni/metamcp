import {
  McpServerTypeEnum,
  validateClaudeDesktopConfig,
  isStdioServer,
  isSseServer,
  type ClaudeDesktopConfig,
  type ValidationError as SchemaValidationError,
} from "@repo/zod-types";

import { mcpServersRepository } from "../../db/repositories/mcp-servers.repo";
import { ValidationError, logError } from "../errors";

/**
 * Import result from Claude Desktop config
 */
export interface ConfigImportResult {
  /** Number of servers successfully imported */
  imported: number;
  /** Servers that were skipped with reasons */
  skipped: string[];
  /** Validation errors if config was invalid */
  validationErrors?: SchemaValidationError[];
}

export class ConfigImportService {
  /**
   * Import MCP servers from a Claude Desktop config JSON string.
   *
   * @param configJson - Raw JSON string of claude_desktop_config.json
   * @param userId - Optional user ID to associate servers with
   * @returns Import result with counts and any errors
   * @throws {ValidationError} If the config JSON is invalid
   */
  async importClaudeConfig(
    configJson: string,
    userId?: string | null,
  ): Promise<ConfigImportResult> {
    // Validate the config using JSON Schema
    const validationResult = validateClaudeDesktopConfig(configJson);

    if (!validationResult.valid) {
      const errorMessages = validationResult.errors
        ?.map(
          (e: SchemaValidationError) =>
            `${e.path ? `${e.path}: ` : ""}${e.message}`,
        )
        .join("; ");

      throw new ValidationError(
        `Invalid Claude Desktop config: ${errorMessages}`,
        "configJson",
        configJson.substring(0, 100) + (configJson.length > 100 ? "..." : ""),
      );
    }

    const config = validationResult.data as ClaudeDesktopConfig;
    const serversToCreate: Array<{
      name: string;
      type: "STDIO" | "SSE";
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      user_id?: string | null;
    }> = [];
    const skipped: string[] = [];

    for (const [name, definition] of Object.entries(config.mcpServers)) {
      // Sanitize name (validation already ensures valid chars, but normalize)
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");

      try {
        if (isStdioServer(definition)) {
          // STDIO Server
          serversToCreate.push({
            name: safeName,
            type: McpServerTypeEnum.Enum.STDIO,
            command: definition.command,
            args: definition.args || [],
            env: definition.env || {},
            user_id: userId,
          });
        } else if (isSseServer(definition)) {
          // SSE Server
          serversToCreate.push({
            name: safeName,
            type: McpServerTypeEnum.Enum.SSE,
            url: definition.url,
            headers: definition.headers || {},
            user_id: userId,
          });
        } else {
          // This shouldn't happen after validation, but handle gracefully
          skipped.push(
            `Skipped '${name}': Unknown server type (no command or url)`,
          );
        }
      } catch (error) {
        logError(error, "config-import.parseServer", { serverName: name });
        skipped.push(
          `Skipped '${name}': ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Bulk create all valid servers
    if (serversToCreate.length > 0) {
      try {
        await mcpServersRepository.bulkCreate(serversToCreate);
      } catch (error) {
        logError(error, "config-import.bulkCreate", {
          count: serversToCreate.length,
        });
        throw error;
      }
    }

    return {
      imported: serversToCreate.length,
      skipped,
    };
  }

  /**
   * Validate a Claude Desktop config without importing.
   * Useful for preview/dry-run functionality.
   *
   * @param configJson - Raw JSON string to validate
   * @returns Validation result with parsed data if valid
   */
  validateConfig(configJson: string) {
    return validateClaudeDesktopConfig(configJson);
  }
}

export const configImportService = new ConfigImportService();
