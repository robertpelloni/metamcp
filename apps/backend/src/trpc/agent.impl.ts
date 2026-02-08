import { RunAgentRequestSchema, RunAgentResponseSchema } from "@repo/zod-types";
import { z } from "zod";
import { agentService } from "../lib/ai/agent.service";
import { codeExecutorService } from "../lib/sandbox/code-executor.service";
import { mcpServerPool } from "../lib/metamcp/mcp-server-pool";
import { parseToolName } from "../lib/metamcp/tool-name-parser";
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { CompatibilityCallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { configService } from "../lib/config.service";
import { db } from "../db";
import { toolsTable, toolCallLogsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { getMcpServers } from "../lib/metamcp/fetch-metamcp";
import { randomUUID } from "crypto";
import { AppRouter } from "@repo/trpc";

export const agentImplementations: AppRouter["frontend"]["agent"] = {
  run: async ({ input, ctx }) => {
    try {
      // Use provided session ID or generate a temporary one
      const sessionId = input.sessionId || `agent-trpc-${randomUUID()}`;

      const callToolCallback = async (name: string, args: any, meta?: any): Promise<any> => {
          const startTime = Date.now();
          let result: any = null;
          let error: any = null;

          try {
            // 1. Handle Meta Tools
            if (name === "run_code") {
                result = await codeExecutorService.executeCode(args.code, callToolCallback);
                return result;
            }
            
            // 2. Handle Downstream Tools
            const parsed = parseToolName(name);
            if (!parsed) throw new Error(`Invalid tool name: ${name}`);

            // Find the tool in the DB to get the server UUID
            const toolRecord = await db.query.toolsTable.findFirst({
                where: eq(toolsTable.name, name),
                with: {
                    mcpServer: true
                }
            });

            if (!toolRecord || !toolRecord.mcpServer) {
                throw new Error(`Tool not found or not linked to a server: ${name}`);
            }

            const mcpServerUuid = toolRecord.mcpServerUuid;
            const namespaceUuid = toolRecord.mcpServer.namespaceUuid;

            // Fetch server params (needed for connection)
            // Note: This logic seems duplicated from metamcp-proxy.ts, maybe should be refactored
            // For now, keep it simple. We need to know which server instance to use.
            // But mcpServerPool.getSession handles connection pooling.
            // However, getMcpServers usually fetches ALL servers in a namespace.
            // Here we know exactly which server we want.

            // Re-using logic:
            const serverParamsMap = await getMcpServers(namespaceUuid);
            const serverParams = serverParamsMap[mcpServerUuid];

            if (!serverParams) {
                throw new Error(`Server configuration not found for UUID: ${mcpServerUuid}`);
            }

            // Get or create a session
            const session = await mcpServerPool.getSession(
                sessionId,
                mcpServerUuid,
                serverParams,
                namespaceUuid
            );

            if (!session) {
                throw new Error(`Failed to connect to server: ${serverParams.name}`);
            }

            // Call the tool
            const abortController = new AbortController();
            const mcpRequestOptions: RequestOptions = {
                signal: abortController.signal,
                timeout: await configService.getMcpTimeout(),
            };

            const callResult = await session.client.request(
                {
                    method: "tools/call",
                    params: {
                        name: parsed.originalToolName,
                        arguments: args || {},
                        _meta: meta,
                    }
                },
                CompatibilityCallToolResultSchema,
                mcpRequestOptions
            );
            result = callResult;
            return result;

          } catch (e) {
            error = e;
            throw e;
          } finally {
             const duration = Date.now() - startTime;
             // Log to DB
             // We need to construct result/error strings properly
             try {
                await db.insert(toolCallLogsTable).values({
                    session_id: sessionId,
                    tool_name: name,
                    arguments: args ? JSON.stringify(args) : null,
                    result: result ? JSON.stringify(result) : null,
                    error: error ? String(error) : null,
                    duration_ms: String(duration),
                });
             } catch (err) {
                 console.error("Failed to log tool call", err);
             }
          }
      };

      const result = await agentService.runAgent(input.task, callToolCallback, input.policyId, ctx.user?.id);

      // Cleanup sessions after run (optional, depends on if we want to keep session alive)
      // For one-off agent runs, cleanup is good.
      await mcpServerPool.cleanupSession(sessionId);

      return {
        success: true,
        result,
      };

    } catch (error: any) {
      return {
        success: false,
        result: null,
        error: error.message,
      };
    }
  }
};
