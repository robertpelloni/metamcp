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
    let result: CallToolResult | null = null;
    let error: any = null;

    // Check for parent call ID in _meta (passed from run_code recursion)
    const parentCallUuid = request.params._meta?.parentCallUuid as string | undefined;

    try {
      result = await next(request, context);
      return result;
    } catch (e) {
      error = e;
      throw e;
    } finally {
      const duration = Date.now() - startTime;

      // Log to DB asynchronously
      db.insert(toolCallLogsTable).values({
        session_id: context.sessionId,
        tool_name: request.params.name,
        arguments: request.params.arguments as Record<string, unknown>,
        result: result as unknown as Record<string, unknown>, // Casting for JSONB compatibility
        error: error ? String(error) : null,
        duration_ms: String(duration),
        parent_call_uuid: parentCallUuid,
        user_id: context.userId || null,
      }).catch(err => {
          console.error("Failed to persist tool call log:", err);
      });
    }
  };
}
