import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { db } from "../../../db";
import { toolCallLogsTable } from "../../../db/schema";
import { CallToolMiddleware } from "./functional-middleware";

export function createLoggingMiddleware(options?: {
  enabled?: boolean;
}): CallToolMiddleware {
  const enabled = options?.enabled ?? true;

  return (next) => async (request, context) => {
    if (!enabled) {
      return next(request, context);
    }

    const startTime = Date.now();

    // Check for parent call ID in _meta (passed from run_code recursion)
    const parentCallUuid = request.params._meta?.parentCallUuid as string | undefined;

    // 1. Initial Log (Pending)
    let logUuid: string | undefined;
    try {
        const [logEntry] = await db.insert(toolCallLogsTable).values({
            session_id: context.sessionId,
            tool_name: request.params.name,
            arguments: request.params.arguments as Record<string, unknown>,
            result: null,
            error: null,
            duration_ms: null,
            parent_call_uuid: parentCallUuid,
        }).returning({ uuid: toolCallLogsTable.uuid });
        logUuid = logEntry.uuid;
    } catch (err) {
        console.error("Failed to create initial log:", err);
    }

    try {
      const result = await next(request, context);

      // 2. Success Update
      if (logUuid) {
          const duration = Date.now() - startTime;
          // We don't await this to avoid blocking the response
          const { eq } = await import("drizzle-orm"); // Lazy import to avoid hoisting issues?
          db.update(toolCallLogsTable)
            .set({
                result: result as unknown as Record<string, unknown>,
                duration_ms: String(duration),
                updated_at: new Date()
            })
            .where(eq(toolCallLogsTable.uuid, logUuid))
            .catch(err => console.error("Failed to update success log:", err));
      }
      return result;

    } catch (e) {
      // 3. Error Update
      if (logUuid) {
          const duration = Date.now() - startTime;
          const { eq } = await import("drizzle-orm");
          db.update(toolCallLogsTable)
            .set({
                error: String(e),
                duration_ms: String(duration),
                updated_at: new Date()
            })
            .where(eq(toolCallLogsTable.uuid, logUuid))
            .catch(err => console.error("Failed to update error log:", err));
      }
      throw e;
    }
  };
}
