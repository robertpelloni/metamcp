import {
  ClearLogsResponseSchema,
  GetDockerLogsRequestSchema,
  GetDockerLogsResponseSchema,
  GetLogsRequestSchema,
  GetLogsResponseSchema,
  ListDockerServersResponseSchema,
} from "@repo/zod-types";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

<<<<<<< HEAD
import { db } from "../db";
import { toolCallLogsTable } from "../db/schema";
import { parseToolName } from "../lib/metamcp/tool-name-parser";
import { DatabaseError, logError, wrapError } from "../lib/errors";
=======
import { mcpServersRepository } from "../db/repositories";
import { dockerManager } from "../lib/metamcp/docker-manager/index.js";
import { metamcpLogStore } from "../lib/metamcp/log-store";
>>>>>>> origin/docker-in-docker

export const logsImplementations = {
  getLogs: async (
    input: z.infer<typeof GetLogsRequestSchema>,
    context?: { user?: { id: string } },
  ): Promise<z.infer<typeof GetLogsResponseSchema>> => {
    try {
      const limit = input.limit || 100;

      let query = db
        .select()
        .from(toolCallLogsTable)
        .orderBy(desc(toolCallLogsTable.created_at))
        .limit(limit)
        .$dynamic();

      if (input.sessionId) {
        query = query.where(eq(toolCallLogsTable.session_id, input.sessionId));
      }

      const logs = await query;

      // Map to Zod schema format
      const formattedLogs = logs.map((log) => {
        const parsed = parseToolName(log.tool_name);
        const serverName = parsed ? parsed.serverName : "metamcp";

        return {
          id: log.uuid,
          timestamp: log.created_at,
          serverName: serverName,
          level: log.error ? ("error" as const) : ("info" as const),
          message: log.error
            ? `Error calling ${log.tool_name}: ${log.error}`
            : `Called ${log.tool_name} (${log.duration_ms || "?"}ms)`,
          error: log.error || undefined,

          // Extended fields
          toolName: log.tool_name,
          arguments: log.arguments as Record<string, unknown>,
          result: log.result as Record<string, unknown>,
          durationMs: log.duration_ms || undefined,
          sessionId: log.session_id,
          parentCallUuid: log.parent_call_uuid,
        };
      });

      const totalCount = logs.length;

      return {
        success: true as const,
        data: formattedLogs,
        totalCount,
      };
    } catch (error) {
      logError(error, "logs.getLogs", {
        sessionId: input.sessionId,
        limit: input.limit,
      });
      throw new DatabaseError(
        "query",
        error instanceof Error ? error.message : "Unknown database error",
        "tool_call_logs",
      );
    }
  },

  clearLogs: async (context?: {
    user?: { id: string };
  }): Promise<z.infer<typeof ClearLogsResponseSchema>> => {
    try {
      await db.delete(toolCallLogsTable);

      return {
        success: true as const,
        message: "All logs have been cleared successfully",
      };
    } catch (error) {
      logError(error, "logs.clearLogs");
      throw new DatabaseError(
        "delete",
        error instanceof Error ? error.message : "Unknown database error",
        "tool_call_logs",
      );
    }
  },

  listDockerServers: async (
    userId: string,
  ): Promise<z.infer<typeof ListDockerServersResponseSchema>> => {
    try {
      // Get all running Docker servers
      const running = await dockerManager.getRunningServers();

      // Get accessible MCP servers for the user (public + user's own)
      const accessibleServers =
        await mcpServersRepository.findAllAccessibleToUser(userId);
      const accessibleServerUuids = new Set(
        accessibleServers.map((s) => s.uuid),
      );

      // Filter running servers to only include accessible ones
      const filteredRunning = running.filter((s) =>
        accessibleServerUuids.has(s.serverUuid),
      );

      return {
        success: true as const,
        servers: filteredRunning.map((s) => ({
          serverUuid: s.serverUuid,
          containerId: s.containerId,
          containerName: s.containerName,
          serverName: s.serverName,
        })),
      };
    } catch (error) {
      console.error("Error listing docker servers:", error);
      return { success: true as const, servers: [] };
    }
  },

  getDockerLogs: async (
    input: z.infer<typeof GetDockerLogsRequestSchema>,
  ): Promise<z.infer<typeof GetDockerLogsResponseSchema>> => {
    const tail = input.tail ?? 500;
    try {
      const lines = await dockerManager.getServerLogsTail(
        input.serverUuid,
        tail,
      );
      return {
        success: true as const,
        serverUuid: input.serverUuid,
        lines,
      };
    } catch (error) {
      console.error("Error getting docker logs:", error);
      return {
        success: true as const,
        serverUuid: input.serverUuid,
        lines: [],
      };
    }
  },
};
