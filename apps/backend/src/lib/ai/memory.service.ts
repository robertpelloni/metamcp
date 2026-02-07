import { db } from "../../db";
import { toolCallLogsTable } from "../../db/schema";
import { desc, eq, and, like } from "drizzle-orm";

export class MemoryService {
  /**
   * Retrieve past interactions or "memories" for a given session.
   * Currently, this is a simple retrieval of logs.
   * Future improvements: Vector search on logs, summarization.
   */
  async getContext(sessionId: string, limit: number = 20): Promise<string> {
    const logs = await db
      .select({
        toolName: toolCallLogsTable.tool_name,
        arguments: toolCallLogsTable.arguments,
        result: toolCallLogsTable.result,
        error: toolCallLogsTable.error,
      })
      .from(toolCallLogsTable)
      .where(eq(toolCallLogsTable.session_id, sessionId))
      .orderBy(desc(toolCallLogsTable.created_at))
      .limit(limit);

    if (logs.length === 0) return "";

    // Reverse to chronological order
    logs.reverse();

    return logs.map(log => {
        if (log.error) {
            return `Tool '${log.toolName}' failed: ${log.error}`;
        }
        return `Tool '${log.toolName}' called with ${JSON.stringify(log.arguments)}. Result: ${JSON.stringify(log.result)}`;
    }).join("\n");
  }
}

export const memoryService = new MemoryService();
