import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { toonSerializer } from "../../serializers/toon.serializer";
import { toolSearchService } from "../../ai/tool-search.service";
import { savedScriptService } from "../../sandbox/saved-script.service";
import { toolSetService } from "../tool-set.service";
import { configImportService } from "../config-import.service";
import { memoryService } from "../../ai/memory.service";
import { policyService } from "../../access-control/policy.service";
import { schedulerService } from "../../scheduler/scheduler.service";
import { ConnectedClient } from "../client";
import { mcpServerPool } from "../mcp-server-pool";
import { createServer } from "../metamcp-proxy"; // Circular dependency risk? No, createServer is export.
// Wait, we can't import createServer if we are part of it.
// We need to pass dependencies or services.

// To avoid circular dependency with createServer (which exposes callToolHandler for recursion),
// we will have the handler accept the recursive callback as an argument or context.

export interface MetaToolContext {
    sessionId: string;
    namespaceUuid: string;
    toolToClient: Record<string, ConnectedClient>;
    loadedTools: Set<string>;
    addToLoadedTools: (name: string) => void;
    // Callback for recursion
    recursiveHandler: (name: string, args: any, meta?: any) => Promise<CallToolResult>;
}

export const handleMetaTool = async (
    name: string,
    args: any,
    context: MetaToolContext
): Promise<CallToolResult | null> => {

    // Check TOON - Helper function repeated or utility?
    // Let's assume the caller handles formatting?
    // Or we handle it here.
    // The previous implementation handled formatting *after* result.
    // So we just return the raw object result (CallToolResult) and the caller formats it.

    if (name === "search_tools") {
      const { query, limit } = args as { query: string; limit?: number };
      const results = await toolSearchService.searchTools(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }

    if (name === "load_tool") {
      const { name: toolName } = args as { name: string };
      if (context.toolToClient[toolName]) {
        context.addToLoadedTools(toolName);
        return { content: [{ type: "text", text: `Tool '${toolName}' loaded.` }] };
      }
      return { content: [{ type: "text", text: `Tool '${toolName}' not found.` }], isError: true };
    }

    if (name === "save_script") {
        const { name: scriptName, code, description } = args as any;
        const saved = await savedScriptService.saveScript(scriptName, code, description);
        return { content: [{ type: "text", text: `Script '${saved.name}' saved.` }] };
    }

    if (name === "save_tool_set") {
        const { name: setName, description } = args as any;
        const toolsToSave = Array.from(context.loadedTools);
        if (toolsToSave.length === 0) return { content: [{ type: "text", text: "No tools loaded." }], isError: true };
        const saved = await toolSetService.createToolSet(setName, toolsToSave, description);
        return { content: [{ type: "text", text: `Tool Set '${saved.name}' saved.` }] };
    }

    if (name === "load_tool_set") {
        const { name: setName } = args as any;
        const set = await toolSetService.getToolSet(setName);
        if (!set) return { content: [{ type: "text", text: "Set not found." }], isError: true };

        let count = 0;
        const missing = [];
        for (const toolName of set.tools) {
            if (context.toolToClient[toolName]) {
                context.addToLoadedTools(toolName);
                count++;
            } else {
                missing.push(toolName);
            }
        }
        return { content: [{ type: "text", text: `Loaded ${count} tools from '${setName}'. Missing: ${missing.join(", ")}` }] };
    }

    if (name === "import_mcp_config") {
        const { configJson } = args as any;
        const result = await configImportService.importClaudeConfig(configJson);
        return { content: [{ type: "text", text: `Imported ${result.imported} servers.` }] };
    }

    if (name === "save_memory") {
        const { content, tags } = args as any;
        const saved = await memoryService.saveMemory(content, tags);
        return { content: [{ type: "text", text: `Memory saved: ${saved.uuid}` }] };
    }

    if (name === "search_memory") {
        const { query, limit } = args as any;
        const results = await memoryService.searchMemory(query, limit);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    if (name === "list_policies") {
        const policies = await policyService.listPolicies();
        return { content: [{ type: "text", text: JSON.stringify(policies, null, 2) }] };
    }

    if (name === "schedule_task") {
        const { cron, type, payload } = args as any;
        // Simplified user context for now
        const { namespacesTable } = await import("../../../db/schema");
        const { db } = await import("../../../db");
        const { eq } = await import("drizzle-orm");
        const ns = await db.query.namespacesTable.findFirst({ where: eq(namespacesTable.uuid, context.namespaceUuid) });

        if (ns && ns.user_id) {
            const task = await schedulerService.createTask(ns.user_id, cron, type, payload);
            return { content: [{ type: "text", text: `Task scheduled: ${task.uuid}` }] };
        }
        return { content: [{ type: "text", text: "Error: No user context." }], isError: true };
    }

    // Agent & Code Execution - These need the recursive handler
    if (name === "run_code" || name === "run_python" || name === "run_agent") {
        // We handle these in a separate specialized handler or here?
        // Let's keep them here for now but use the context callback.

        // This file is getting long too.
        // Maybe return NULL to signal "Not a simple meta tool"
        return null;
    }

    return null;
};
