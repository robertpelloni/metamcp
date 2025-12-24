import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  CompatibilityCallToolResultSchema,
  GetPromptRequestSchema,
  GetPromptResultSchema,
  ListPromptsRequestSchema,
  ListPromptsResultSchema,
  ListResourcesRequestSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesRequestSchema,
  ListResourceTemplatesResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  ReadResourceRequestSchema,
  ReadResourceResultSchema,
  ResourceTemplate,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { toolsImplementations } from "../../trpc/tools.impl";
import { toolSearchService } from "../ai/tool-search.service";
import { memoryService } from "../ai/memory.service"; // Import Memory Service
import { agentService } from "../ai/agent.service";
import { configImportService } from "./config-import.service";
import { configService } from "../config.service";
import { codeExecutorService } from "../sandbox/code-executor.service";
import { pythonExecutorService } from "../sandbox/python-executor.service";
import { savedScriptService } from "../sandbox/saved-script.service";
import { toolSetService } from "./tool-set.service";
import { schedulerService } from "../scheduler/scheduler.service"; // Import Scheduler Service
import { policyService } from "../access-control/policy.service"; // Import Policy Service
import { toonSerializer } from "../serializers/toon.serializer";
import { ConnectedClient } from "./client";
import { getMcpServers } from "./fetch-metamcp";
import { mcpServerPool } from "./mcp-server-pool";
import {
  createFilterCallToolMiddleware,
  createFilterListToolsMiddleware,
} from "./metamcp-middleware/filter-tools.functional";
import { createPolicyMiddleware } from "./metamcp-middleware/policy.functional";
import {
  CallToolHandler,
  compose,
  ListToolsHandler,
  MetaMCPHandlerContext,
} from "./metamcp-middleware/functional-middleware";
import { createLoggingMiddleware } from "./metamcp-middleware/logging.functional";
import {
  createToolOverridesCallToolMiddleware,
  createToolOverridesListToolsMiddleware,
  mapOverrideNameToOriginal,
} from "./metamcp-middleware/tool-overrides.functional";
import { parseToolName } from "./tool-name-parser";
import { sanitizeName } from "./utils";

/**
 * Filter out tools that are overrides of existing tools to prevent duplicates in database
 * Uses the existing tool overrides cache for optimal performance
 */
async function filterOutOverrideTools(
  tools: Tool[],
  namespaceUuid: string,
  serverName: string,
): Promise<Tool[]> {
  if (!tools || tools.length === 0) {
    return tools;
  }

  const filteredTools: Tool[] = [];

  await Promise.allSettled(
    tools.map(async (tool) => {
      try {
        // Check if this tool name is actually an override name for an existing tool
        // by using the existing mapOverrideNameToOriginal function
        const fullToolName = `${sanitizeName(serverName)}__${tool.name}`;
        const originalName = await mapOverrideNameToOriginal(
          fullToolName,
          namespaceUuid,
          true, // use cache
        );

        // If the original name is different from the current name,
        // this tool is an override and should be filtered out
        if (originalName !== fullToolName) {
          // This is an override, skip it (don't save to database)
          return;
        }

        // This is not an override, include it
        filteredTools.push(tool);
      } catch (error) {
        console.error(
          `Error checking if tool ${tool.name} is an override:`,
          error,
        );
        // On error, include the tool (fail-safe behavior)
        filteredTools.push(tool);
      }
    }),
  );

  return filteredTools;
}

export const createServer = async (
  namespaceUuid: string,
  sessionId: string,
  includeInactiveServers: boolean = false,
) => {
  const toolToClient: Record<string, ConnectedClient> = {};
  const toolToServerUuid: Record<string, string> = {};
  const promptToClient: Record<string, ConnectedClient> = {};
  const resourceToClient: Record<string, ConnectedClient> = {};

  // Session-specific map of "loaded" tools that should be exposed to the client
  // Key: toolName, Value: true
  // Limited to 200 items to prevent unbounded growth in long sessions
  const loadedTools = new Set<string>();
  const MAX_LOADED_TOOLS = 200;

  const addToLoadedTools = (name: string) => {
    if (loadedTools.size >= MAX_LOADED_TOOLS && !loadedTools.has(name)) {
      // Remove the first item (oldest) if limit reached - effectively a FIFO eviction
      const first = loadedTools.values().next().value;
      if (first) loadedTools.delete(first);
    }
    loadedTools.add(name);
  };

  // Helper function to detect if a server is the same instance
  const isSameServerInstance = (
    params: { name?: string; url?: string | null },
    _serverUuid: string,
  ): boolean => {
    // Check if server name is exactly the same as our current server instance
    // This prevents exact recursive calls to the same server
    if (params.name === `metamcp-unified-${namespaceUuid}`) {
      return true;
    }

    return false;
  };

  const server = new Server(
    {
      name: `metamcp-unified-${namespaceUuid}`,
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    },
  );

  // Create the handler context
  const handlerContext: MetaMCPHandlerContext = {
    namespaceUuid,
    sessionId,
  };

  // ----------------------------------------------------------------------
  // Handler Implementations (Unwrapped)
  // ----------------------------------------------------------------------

  const originalListToolsHandler: ListToolsHandler = async (
    request,
    context,
  ) => {
    // 1. Meta Tools
    const metaTools: Tool[] = [
      {
        name: "search_tools",
        description: "Semantically search for available tools across all connected MCP servers. Use this to find tools for a specific task.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query describing what you want to do (e.g., 'manage github issues', 'query database')",
            },
            limit: {
              type: "number",
              description: "Max number of results to return (default: 10)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "load_tool",
        description: "Load a specific tool by name into your context so you can use it. Use the names found via search_tools.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The full name of the tool to load (e.g., 'github__create_issue')",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "run_code",
        description: "Execute TypeScript/JavaScript code in a secure sandbox. Use this to chain multiple tool calls, process data, or perform logic. You can call other tools from within this code using `await mcp.call('tool_name', args)`.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The TypeScript/JavaScript code to execute. Top-level await is supported.",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "run_python",
        description: "Execute Python 3 code. Suitable for data processing or simple scripts. No direct tool calling integration yet (use run_code for tool chaining).",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The Python 3 code to execute.",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "run_agent",
        description: "Run an autonomous AI agent to perform a task. The agent will analyze your request, find relevant tools, write its own code, and execute it.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "The natural language description of the task (e.g., 'Find the latest issue in repo X and summarize it').",
            },
            policyId: {
                type: "string",
                description: "Optional UUID of a Policy to restrict the agent's tool access.",
            }
          },
          required: ["task"],
        },
      },
      {
        name: "save_script",
        description: "Save a successful code snippet as a reusable tool (Saved Script). The script will be available as a tool in future sessions.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the new tool (must be unique, alphanumeric).",
            },
            description: {
              type: "string",
              description: "Description of what this script does.",
            },
            code: {
              type: "string",
              description: "The code to save.",
            },
          },
          required: ["name", "code"],
        },
      },
      {
        name: "save_tool_set",
        description: "Save the currently loaded tools as a 'Tool Set' (Profile). This allows you to restore this working environment later.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the tool set (e.g., 'web_dev', 'data_analysis').",
            },
            description: {
              type: "string",
              description: "Description of the tool set.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "load_tool_set",
        description: "Load a previously saved Tool Set (Profile). This will add all tools in the set to your current context.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the tool set to load.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "import_mcp_config",
        description: "Import MCP servers from a JSON configuration file content (e.g., claude_desktop_config.json).",
        inputSchema: {
          type: "object",
          properties: {
            configJson: {
              type: "string",
              description: "The content of the JSON configuration file.",
            },
          },
          required: ["configJson"],
        },
      },
      {
        name: "save_memory",
        description: "Save a piece of information to long-term memory (Vector Store). Useful for remembering context between sessions.",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The text content to remember.",
            },
            tags: {
                type: "array",
                items: { type: "string" },
                description: "Optional tags for categorization."
            }
          },
          required: ["content"],
        },
      },
      {
        name: "search_memory",
        description: "Search long-term memory for relevant information using semantic search.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query.",
            },
            limit: {
                type: "number",
                description: "Max results (default 5)."
            }
          },
          required: ["query"],
        },
      },
      {
        name: "list_policies",
        description: "List available security policies. Useful for an agent to decide which policy (scope) to use for a sub-task.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "schedule_task",
        description: "Schedule a task (Agent run or Script run) to execute periodically.",
        inputSchema: {
          type: "object",
          properties: {
            cron: { type: "string", description: "Cron expression (e.g. '0 9 * * *' for daily at 9am)." },
            type: { type: "string", enum: ["agent", "script"], description: "Type of task." },
            payload: {
                type: "object",
                description: "Task payload. For 'agent': { agentTask, policyId }. For 'script': { scriptName }."
            }
          },
          required: ["cron", "type", "payload"],
        },
      },
    ];

    // 2. Saved Scripts
    // Fetch user-defined saved scripts and expose them as tools
    try {
        const savedScripts = await savedScriptService.listScripts();
        const scriptTools: Tool[] = savedScripts.map(script => ({
            name: `script__${script.name}`,
            description: `[Saved Script] ${script.description || "No description"}`,
            inputSchema: {
                type: "object",
                properties: {}, // Scripts currently take no args
                additionalProperties: true
            }
        }));
        metaTools.push(...scriptTools);
    } catch (e) {
        console.error("Error fetching saved scripts", e);
    }

    const serverParams = await getMcpServers(
      context.namespaceUuid,
      includeInactiveServers,
    );

    const visitedServers = new Set<string>();
    const allServerEntries = Object.entries(serverParams);
    const allAvailableTools: Tool[] = [];

    await Promise.allSettled(
      allServerEntries.map(async ([mcpServerUuid, params]) => {
        if (visitedServers.has(mcpServerUuid)) return;

        const session = await mcpServerPool.getSession(
            context.sessionId,
            mcpServerUuid,
            params,
            namespaceUuid,
        );
        if (!session) return;

        const serverVersion = session.client.getServerVersion();
        const actualServerName = serverVersion?.name || params.name || "";
        const ourServerName = `metamcp-unified-${namespaceUuid}`;
        if (actualServerName === ourServerName) return;
        if (isSameServerInstance(params, mcpServerUuid)) return;

        visitedServers.add(mcpServerUuid);

        const capabilities = session.client.getServerCapabilities();
        if (!capabilities?.tools) return;

        const serverName = params.name || session.client.getServerVersion()?.name || "";

        try {
            const allServerTools: Tool[] = [];
            let cursor: string | undefined = undefined;
            let hasMore = true;

            while (hasMore) {
                const result = await session.client.request(
                    {
                        method: "tools/list",
                        params: { cursor, _meta: request.params?._meta }
                    },
                    ListToolsResultSchema
                );
                if (result.tools) allServerTools.push(...result.tools);
                cursor = result.nextCursor;
                hasMore = !!result.nextCursor;
            }

            if (allServerTools.length > 0) {
                try {
                    const toolsToSave = await filterOutOverrideTools(
                        allServerTools,
                        namespaceUuid,
                        serverName
                    );
                    if (toolsToSave.length > 0) {
                        await toolsImplementations.create({
                            tools: toolsToSave,
                            mcpServerUuid: mcpServerUuid,
                        });
                    }
                } catch (e) {
                    console.error("DB Save Error", e);
                }
            }

            allServerTools.forEach(tool => {
                const toolName = `${sanitizeName(serverName)}__${tool.name}`;
                toolToClient[toolName] = session;
                toolToServerUuid[toolName] = mcpServerUuid;
                allAvailableTools.push({
                    ...tool,
                    name: toolName
                });
            });

        } catch (error) {
            console.error(`Error fetching tools from ${serverName}:`, error);
        }
      })
    );

    const resultTools = [...metaTools];

    allAvailableTools.forEach(tool => {
        if (loadedTools.has(tool.name)) {
            resultTools.push(tool);
        }
    });

    return { tools: resultTools };
  };

  // ----------------------------------------------------------------------
  // Middleware Composition & Recursive Handling
  // ----------------------------------------------------------------------

  // We need a mechanism to allow _internalCallToolImpl to call the *final composed function* (recursiveCallToolHandler).
  // However, recursiveCallToolHandler is composed *using* a handler that calls _internalCallToolImpl.
  // This creates a circular dependency:
  // recursiveCallToolHandler -> middleware -> internalHandler -> recursiveCallToolHandler

  // To solve this cleanly, we use a mutable reference pattern.
  let recursiveCallToolHandlerRef: CallToolHandler | null = null;

  // The "delegate" handler simply calls whatever function is currently in the reference.
  const delegateHandler: CallToolHandler = async (request, context) => {
    if (!recursiveCallToolHandlerRef) {
        throw new Error("Handler not initialized");
    }
    return recursiveCallToolHandlerRef(request, context);
  };

  /**
   * Internal implementation that does the actual work.
   */
  const _internalCallToolImpl = async (
    name: string,
    args: any,
    meta?: any
  ): Promise<CallToolResult> => {

    // Check for TOON request
    const useToon = meta?.toon === true || meta?.toon === "true";

    const formatResult = (result: CallToolResult): CallToolResult => {
        if (!useToon) return result;

        // Attempt to compress JSON content
        const newContent = result.content.map(item => {
            if (item.type === "text") {
                try {
                    // Try to parse as JSON first
                    const data = JSON.parse(item.text);
                    const serialized = toonSerializer.serialize(data);
                    return { ...item, text: serialized };
                } catch (e) {
                    // Not JSON, return as is
                    return item;
                }
            }
            return item;
        });

        return {
            ...result,
            content: newContent
        };
    };

    // 1. Meta Tools
    if (name === "search_tools") {
      const { query, limit } = args as { query: string; limit?: number };
      const results = await toolSearchService.searchTools(query, limit);
      return formatResult({
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      });
    }

    if (name === "load_tool") {
      const { name: toolName } = args as { name: string };
      if (toolToClient[toolName]) {
        addToLoadedTools(toolName);
        return {
            content: [
                {
                    type: "text",
                    text: `Tool '${toolName}' loaded.`,
                }
            ]
        };
      } else {
        return {
            content: [
                {
                    type: "text",
                    text: `Tool '${toolName}' not found.`,
                },
            ],
            isError: true,
        };
      }
    }

    if (name === "save_script") {
        const { name: scriptName, code, description } = args as { name: string; code: string; description?: string };
        try {
            const saved = await savedScriptService.saveScript(scriptName, code, description);
            return {
                content: [{ type: "text", text: `Script '${saved.name}' saved successfully.` }]
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Failed to save script: ${error.message}` }],
                isError: true
            };
        }
    }

    if (name === "save_tool_set") {
        const { name: setName, description } = args as { name: string; description?: string };
        try {
            const toolsToSave = Array.from(loadedTools);
            if (toolsToSave.length === 0) {
                return {
                    content: [{ type: "text", text: `No tools currently loaded to save.` }],
                    isError: true
                };
            }
            const saved = await toolSetService.createToolSet(setName, toolsToSave, description);
            return {
                content: [{ type: "text", text: `Tool Set '${saved.name}' saved with ${saved.tools.length} tools.` }]
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Failed to save tool set: ${error.message}` }],
                isError: true
            };
        }
    }

    if (name === "load_tool_set") {
        const { name: setName } = args as { name: string };
        try {
            const set = await toolSetService.getToolSet(setName);
            if (!set) {
                return {
                    content: [{ type: "text", text: `Tool Set '${setName}' not found.` }],
                    isError: true
                };
            }

            // Add tools to loadedTools
            let count = 0;
            const missing = [];
            for (const toolName of set.tools) {
                if (toolToClient[toolName]) {
                    addToLoadedTools(toolName);
                    count++;
                } else {
                    missing.push(toolName);
                }
            }

            let msg = `Loaded ${count} tools from set '${setName}'.`;
            if (missing.length > 0) {
                msg += ` Warning: ${missing.length} tools could not be found (might be offline): ${missing.join(", ")}`;
            }

            return {
                content: [{ type: "text", text: msg }]
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Failed to load tool set: ${error.message}` }],
                isError: true
            };
        }
    }

    if (name === "import_mcp_config") {
        const { configJson } = args as { configJson: string };
        try {
            const result = await configImportService.importClaudeConfig(configJson);
            return {
                content: [{
                    type: "text",
                    text: `Imported ${result.imported} servers. Skipped: ${JSON.stringify(result.skipped)}`
                }]
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Import failed: ${error.message}` }],
                isError: true
            };
        }
    }

    if (name === "save_memory") {
        const { content, tags } = args as { content: string; tags?: string[] };
        try {
            // Need userId, but not in args. Assume context.namespaceUuid maps to user or leave undefined for now?
            // Actually context doesn't have userId. We'll store it globally for this simplified implementation or need to pass userId in context.
            // For now, let's leave userId null.
            const saved = await memoryService.saveMemory(content, tags);
            return { content: [{ type: "text", text: `Memory saved: ${saved.uuid}` }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
    }

    if (name === "search_memory") {
        const { query, limit } = args as { query: string; limit?: number };
        const results = await memoryService.searchMemory(query, limit);
        return formatResult({
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        });
    }

    if (name === "list_policies") {
        const policies = await policyService.listPolicies();
        return formatResult({
            content: [{ type: "text", text: JSON.stringify(policies, null, 2) }]
        });
    }

    if (name === "schedule_task") {
        const { cron, type, payload } = args as any;
        // Need userId. Again, defaulting or need to fix context.
        // Let's assume we can get it or use a system placeholder.
        try {
            // We need a userId for the task.
            // Since we don't have it easily in this context without DB lookup on namespace, let's look it up.
            // This is getting expensive.
            // Let's defer userId for now and assume the "Scheduler" runs as system.
            // But scheduler needs userId to find namespace.
            // For this MVP, we'll try to find the user from the namespace.
            // (Assuming namespaceUuid is valid)

            // NOTE: This lookup is inefficient inside a tool call loop, but necessary for correctness.
            // We will skip strict user association for this tool implementation step to keep it simple,
            // or pass a dummy ID that the Scheduler can handle (e.g. "manual-scheduled").
            // Actually, `SchedulerService` needs a valid userId to find the namespace.

            // Let's try to fetch namespace from DB.
            const { namespacesTable } = await import("../../db/schema");
            const { db } = await import("../../db");
            const { eq } = await import("drizzle-orm");
            const ns = await db.query.namespacesTable.findFirst({ where: eq(namespacesTable.uuid, namespaceUuid) });

            if (ns && ns.user_id) {
                const task = await schedulerService.createTask(ns.user_id, cron, type, payload);
                return { content: [{ type: "text", text: `Task scheduled: ${task.uuid}` }] };
            } else {
                return { content: [{ type: "text", text: "Error: Could not determine user context for scheduling." }], isError: true };
            }
        } catch (e: any) {
            return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
    }

    if (name === "run_code") {
        const { code } = args as { code: string };
        try {
            // RECURSION MAGIC: We pass the *delegate* handler to the sandbox.
            // This ensures that when the sandbox calls 'mcp.call', it goes through
            // the full middleware stack (logging, auditing, etc.) just like a request from the client.
            const result = await codeExecutorService.executeCode(
                code,
                async (toolName, toolArgs, meta) => {
                    if (toolName === "run_code" || toolName === "run_agent" || toolName === "run_python") {
                        throw new Error("Cannot call run_code/run_agent/run_python from within sandbox");
                    }
                    // Call the delegate handler which points to the composed stack
                    const res = await delegateHandler({
                        method: "tools/call",
                        params: {
                            name: toolName,
                            arguments: toolArgs,
                            _meta: meta
                        }
                    }, handlerContext);

                    return res;
                }
            );
            return formatResult({
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            });
        } catch (error: any) {
            const errorInfo = {
                message: error?.message || String(error),
                name: error?.name || "Error",
                stack: error?.stack || undefined,
            };
            return {
                content: [{
                    type: "text",
                    text: `Error: ${errorInfo.message}\nName: ${errorInfo.name}${errorInfo.stack ? `\nStack: ${errorInfo.stack}` : ""}`
                }],
                isError: true
            };
        }
    }

    if (name === "run_python") {
        const { code } = args as { code: string };
        try {
            const result = await pythonExecutorService.execute(code);
            return formatResult({
                content: [{ type: "text", text: result }]
            });
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Python Error: ${error.message}` }],
                isError: true
            };
        }
    }

    if (name === "run_agent") {
        const { task, policyId } = args as { task: string; policyId?: string };
        try {
            const result = await agentService.runAgent(
                task,
                async (toolName, toolArgs, meta) => {
                    if (toolName === "run_code" || toolName === "run_agent" || toolName === "run_python") {
                         throw new Error("Recursive agent calls restricted.");
                    }

                    // Inject policyId into meta if provided
                    const callMeta = { ...meta, ...(policyId ? { policyId } : {}) };

                    const res = await delegateHandler({
                        method: "tools/call",
                        params: {
                            name: toolName,
                            arguments: toolArgs,
                            _meta: callMeta
                        }
                    }, handlerContext);
                    return res;
                },
                policyId
            );
            return formatResult({
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            });
        } catch (error: any) {
            const errorInfo = {
                message: error?.message || String(error),
                name: error?.name || "Error",
                stack: error?.stack || undefined,
            };
            return {
                content: [{
                    type: "text",
                    text: `Agent Error: ${errorInfo.message}\nName: ${errorInfo.name}${errorInfo.stack ? `\nStack: ${errorInfo.stack}` : ""}`
                }],
                isError: true
            };
        }
    }

    // 2. Saved Scripts execution
    if (name.startsWith("script__")) {
        const scriptName = name.replace("script__", "");
        const script = await savedScriptService.getScript(scriptName);

        if (script) {
             try {
                // Execute saved script using the SAME logic as run_code
                const result = await codeExecutorService.executeCode(
                    script.code,
                    async (toolName, toolArgs) => {
                        if (toolName === "run_code" || toolName.startsWith("script__")) {
                            throw new Error("Recursion restricted in saved scripts");
                        }
                        const res = await delegateHandler({
                            method: "tools/call",
                            params: {
                                name: toolName,
                                arguments: toolArgs,
                                _meta: meta
                            }
                        }, handlerContext);
                        return res;
                    }
                );
                return formatResult({
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                });
            } catch (error: any) {
                 const errorInfo = {
                    message: error?.message || String(error),
                    name: error?.name || "Error",
                    stack: error?.stack || undefined,
                };
                return {
                    content: [{
                        type: "text",
                        text: `Script Error: ${errorInfo.message}\nName: ${errorInfo.name}${errorInfo.stack ? `\nStack: ${errorInfo.stack}` : ""}`
                    }],
                    isError: true
                };
            }
        }
    }

    // 3. Downstream Tools
    const clientForTool = toolToClient[name];
    if (!clientForTool) {
       throw new Error(`Unknown tool: ${name}`);
    }

    const parsed = parseToolName(name);
    if (!parsed) throw new Error(`Invalid tool name: ${name}`);

    try {
        const abortController = new AbortController();
        const mcpRequestOptions: RequestOptions = {
            signal: abortController.signal,
            timeout: await configService.getMcpTimeout(),
        };

        const result = await clientForTool.client.request(
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
        return formatResult(result as CallToolResult);
    } catch (error) {
        console.error(`Error calling ${name}:`, error);
        throw error;
    }
  };

  const implCallToolHandler: CallToolHandler = async (
    request,
    _context,
  ) => {
    const { name, arguments: args, _meta } = request.params;
    return await _internalCallToolImpl(name, args, _meta);
  };

  // Compose middleware with handlers
  const listToolsWithMiddleware = compose(
    createToolOverridesListToolsMiddleware({
      cacheEnabled: true,
      persistentCacheOnListTools: true,
    }),
    createFilterListToolsMiddleware({ cacheEnabled: true }),
  )(originalListToolsHandler);

  const callToolWithMiddleware = compose(
    createLoggingMiddleware({ enabled: true }),
    createPolicyMiddleware({ enabled: true }), // Add Policy Middleware
    createFilterCallToolMiddleware({
      cacheEnabled: true,
      customErrorMessage: (toolName, reason) =>
        `Access denied to tool "${toolName}": ${reason}`,
    }),
    createToolOverridesCallToolMiddleware({ cacheEnabled: true }),
  )(originalCallToolHandler);

  // Set up the handlers with middleware
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    return await listToolsWithMiddleware(request, handlerContext);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await callToolWithMiddleware(request, handlerContext);
  });

  // Compose recursive handler for internal use
  recursiveCallToolHandlerRef = callToolWithMiddleware;

  // ... (rest of handlers: GetPrompt, ListPrompts, ListResources, ReadResource, ListResourceTemplates)

  const cleanup = async () => {
    // Cleanup is now handled by the pool
    await mcpServerPool.cleanupSession(sessionId);
  };

  // EXPOSE THE HANDLER DIRECTLY
  return {
      server,
      cleanup,
      // We expose the composed handler so internal services (like AgentRouter) can call it directly
      callToolHandler: async (name: string, args: any, meta?: any) => {
          return await callToolWithMiddleware({
              method: "tools/call",
              params: {
                  name,
                  arguments: args,
                  _meta: meta
              }
          }, handlerContext);
      }
  };
};
