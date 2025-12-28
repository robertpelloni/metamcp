import { RunAgentRequestSchema, RunAgentResponseSchema } from "@repo/zod-types";
import { z } from "zod";
import { agentService } from "../lib/ai/agent.service";
import { codeExecutorService } from "../lib/sandbox/code-executor.service";
import { mcpServerPool } from "../lib/metamcp/mcp-server-pool";
import { parseToolName } from "../lib/metamcp/tool-name-parser";
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { CompatibilityCallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { configService } from "../config.service";
import { db } from "../db";
import { toolsTable, toolCallLogsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { getMcpServers } from "../lib/metamcp/fetch-metamcp";
import { v4 as uuidv4 } from "uuid";

export const agentImplementations = {
  run: async (input: z.infer<typeof RunAgentRequestSchema>): Promise<z.infer<typeof RunAgentResponseSchema>> => {
    try {
      // Use provided session ID or generate a temporary one
      const sessionId = input.sessionId || `agent-trpc-${uuidv4()}`;

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

            result = await session.client.request(
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
            return result;

          } catch (e) {
            error = e;
            throw e;
          } finally {
             const duration = Date.now() - startTime;
             // Log to DB
             db.insert(toolCallLogsTable).values({
                session_id: sessionId,
                tool_name: name,
                arguments: args,
                result: result,
                error: error ? String(error) : null,
                duration_ms: String(duration),
             }).catch(err => console.error("Failed to log tool call", err));
          }
      };

      const result = await agentService.runAgent(input.task, callToolCallback, input.policyId);

      // Cleanup sessions after run
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
