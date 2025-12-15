import {
  ClearLogsResponseSchema,
  GetLogsRequestSchema,
  GetLogsResponseSchema,
} from "@repo/zod-types";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db";
import { toolCallLogsTable } from "../db/schema";
import { parseToolName } from "../lib/metamcp/tool-name-parser";

export const logsImplementations = {
  getLogs: async (
    input: z.infer<typeof GetLogsRequestSchema>,
  ): Promise<z.infer<typeof GetLogsResponseSchema>> => {
    try {
      const limit = input.limit || 100;

      const logs = await db
        .select()
        .from(toolCallLogsTable)
        .orderBy(desc(toolCallLogsTable.created_at))
        .limit(limit);

      // Map to Zod schema format
      const formattedLogs = logs.map(log => {
        const parsed = parseToolName(log.tool_name);
        const serverName = parsed ? parsed.serverName : "metamcp";

        return {
          id: log.uuid,
          timestamp: log.created_at,
          serverName: serverName,
          level: log.error ? "error" as const : "info" as const,
          message: log.error
            ? `Error calling ${log.tool_name}: ${log.error}`
            : `Called ${log.tool_name} (${log.duration_ms || '?'}ms)`,
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
      console.error("Error getting logs:", error);
      throw new Error("Failed to get logs");
    }
  },

  clearLogs: async (): Promise<z.infer<typeof ClearLogsResponseSchema>> => {
    try {
      await db.delete(toolCallLogsTable);

      return {
        success: true as const,
        message: "All logs have been cleared successfully",
      };
    } catch (error) {
      console.error("Error clearing logs:", error);
      throw new Error("Failed to clear logs");
    }
  },
};
