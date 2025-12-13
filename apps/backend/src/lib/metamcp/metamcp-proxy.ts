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
import { configService } from "../config.service";
import { configImportService } from "./config-import.service";
import { codeExecutorService } from "../sandbox/code-executor.service";
import { savedScriptService } from "../sandbox/saved-script.service";
import { toolSetService } from "./tool-set.service";
import { toonSerializer } from "../serializers/toon.serializer";
import { codeExecutorService } from "../sandbox/code-executor.service";
import { ConnectedClient } from "./client";
import { getMcpServers } from "./fetch-metamcp";
import { mcpServerPool } from "./mcp-server-pool";
import { toolsSyncCache } from "./tools-sync-cache";
import {
  createFilterCallToolMiddleware,
  createFilterListToolsMiddleware,
} from "./metamcp-middleware/filter-tools.functional";
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
  const loadedTools = new Set<string>();

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
    // 1. Always include the "Meta" tools
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

    ];

    console.log("[DEBUG-TOOLS] 🔍 tools/list called for namespace:", namespaceUuid);
    const startTime = performance.now();
    const serverParams = await getMcpServers(
      context.namespaceUuid,
      includeInactiveServers,
    );

    const visitedServers = new Set<string>();
    const allServerEntries = Object.entries(serverParams);
    const allAvailableTools: Tool[] = [];

    console.log(`[DEBUG-TOOLS] 📋 Processing ${allServerEntries.length} servers`);
    
    await Promise.allSettled(
      allServerEntries.map(async ([mcpServerUuid, params]) => {
        if (visitedServers.has(mcpServerUuid)) return;

        console.log(`[DEBUG-TOOLS] 🔧 Server: ${params.name || mcpServerUuid}`);
        
        // Skip if we've already visited this server to prevent circular references
        if (visitedServers.has(mcpServerUuid)) {
          console.log(`[DEBUG-TOOLS] ⏭️  Skipping already visited: ${params.name}`);
          return;
        }
        const session = await mcpServerPool.getSession(
            context.sessionId,
            mcpServerUuid,
            params,
            namespaceUuid,
        );
        if (!session) {
          console.log(`[DEBUG-TOOLS] ❌ No session for: ${params.name}`);
          return;
        }

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
          // Paginated tool discovery - load all pages automatically
          const allServerTools: Tool[] = [];
          let cursor: string | undefined = undefined;
          let hasMore = true;
          const toolFetchStart = performance.now();

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

            allServerTools.forEach(tool => {
                const toolName = `${sanitizeName(serverName)}__${tool.name}`;
                toolToClient[toolName] = session;
                toolToServerUuid[toolName] = mcpServerUuid;
                allAvailableTools.push({
                    ...tool,
                    name: toolName
                });
            });
            cursor = result.nextCursor;
            hasMore = !!result.nextCursor;
          }
          
          console.log(`[DEBUG-TOOLS] ⏱️  Fetched ${allServerTools.length} tools from ${serverName} in ${(performance.now() - toolFetchStart).toFixed(2)}ms`);

          // Save original tools to database (before middleware processing)
          // This ensures we only save the actual tool names, not override names
          // Filter out tools that are overrides of existing tools to prevent duplicates
          try {
            // PERFORMANCE OPTIMIZATION: Check hash FIRST to avoid expensive operations
            const toolNames = allServerTools.map((tool) => tool.name);
            const hasChanged = toolsSyncCache.hasChanged(mcpServerUuid, toolNames);
            
            console.log(`[DEBUG-TOOLS] 🔍 Hash check for ${serverName}: ${hasChanged ? 'CHANGED' : 'UNCHANGED'}`);

            if (hasChanged) {
              const toolsToSave = await filterOutOverrideTools(
                allServerTools,
                namespaceUuid,
                serverName,
              );

              if (toolsToSave.length > 0) {
                // Update cache
                toolsSyncCache.update(mcpServerUuid, toolNames);
                
                // Sync with cleanup
                await toolsImplementations.sync({
                  tools: toolsToSave,
                  mcpServerUuid: mcpServerUuid,
                });
              }
            }
          } catch (dbError) {
            console.error(
              `Error syncing tools to database for server ${serverName}:`,
              dbError,
            );
          }

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

  /**
   * Internal implementation that does the actual work.
   * We extract this so we can have a wrapped version for external calls,
   * but also call it internally if needed (though we prefer the wrapped one).
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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      });
      };
    }

    if (name === "load_tool") {
      const { name: toolName } = args as { name: string };
      if (toolToClient[toolName]) {
        loadedTools.add(toolName);
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
                    loadedTools.add(toolName);
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

    if (name === "run_code") {
        const { code } = args as { code: string };
        try {
            // RECURSION MAGIC: We pass the *wrapped* middleware handler to the sandbox.
            // This ensures that when the sandbox calls 'mcp.call', it goes through
            // the full middleware stack (logging, auditing, etc.) just like a request from the client.
            const result = await codeExecutorService.executeCode(
                code,
                async (toolName, toolArgs) => {
                    if (toolName === "run_code") {
                        throw new Error("Cannot call run_code from within run_code");
                    }

                    // Call the fully wrapped handler!
                    const res = await callToolWithMiddleware({
                        method: "tools/call",
                        params: {
                            name: toolName,
                            arguments: toolArgs,
                            _meta: meta
                            _meta: meta // Propagate meta if available (e.g. tracing IDs)
                        }
                    }, handlerContext);

                    return res;
                }
            );
            return formatResult({
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Code execution failed: ${error.message}` }],
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
                        const res = await callToolWithMiddleware({
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
                return {
                    content: [{ type: "text", text: `Saved script execution failed: ${error.message}` }],
                    isError: true
                };
            }
        }
    }

    // 3. Downstream Tools
    // 2. Downstream Tools
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
        return result as CallToolResult;
    } catch (error) {
        console.error(`Error calling ${name}:`, error);
        throw error;
    }
    const totalTime = performance.now() - startTime;
    console.log(`[DEBUG-TOOLS] ✅ tools/list completed in ${totalTime.toFixed(2)}ms, returning ${allTools.length} tools`);
    
    return { tools: allTools };
  };

  const originalCallToolHandler: CallToolHandler = async (
    request,
    _context,
  ) => {
    const { name, arguments: args, _meta } = request.params;
    return await _internalCallToolImpl(name, args, _meta);
  };

  // ----------------------------------------------------------------------
  // Middleware Composition
  // ----------------------------------------------------------------------

  const listToolsWithMiddleware = compose(
    createToolOverridesListToolsMiddleware({
      cacheEnabled: true,
      persistentCacheOnListTools: true,
    }),
    createFilterListToolsMiddleware({ cacheEnabled: true }),
  )(originalListToolsHandler);

  let recursiveCallToolHandler: CallToolHandler;

  const wrappedCallToolHandler: CallToolHandler = async (request, context) => {
      return recursiveCallToolHandler(request, context);
  };

  const implCallToolHandler: CallToolHandler = async (request, context) => {
      const { name, arguments: args, _meta } = request.params;

      // Meta Tools Logic
      if (name === "search_tools" || name === "load_tool" || name === "save_script" || name.startsWith("script__") || name === "save_tool_set" || name === "load_tool_set" || name === "import_mcp_config") {
          return _internalCallToolImpl(name, args, _meta);
      }
      else if (name === "run_code") {
           const { code } = args as { code: string };
           try {
               const result = await codeExecutorService.executeCode(code, async (tName, tArgs) => {
                   if (tName === "run_code") throw new Error("Recursion detected");
                   return recursiveCallToolHandler({
                       method: "tools/call",
                       params: { name: tName, arguments: tArgs, _meta }
                   }, context);
               });

               // Toon formatting is handled inside _internalCallToolImpl or wrapper logic?
               // Wait, _internalCallToolImpl handles formatting.
               // The executeCode returns raw result. We need to wrap it.
               // Actually _internalCallToolImpl handles "run_code" too in the main body (duplicate logic warning).

               // Let's use _internalCallToolImpl for consistency, it has the logic.
               return _internalCallToolImpl(name, args, _meta);

           } catch (e: any) {
               return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
           }
      }

      return _internalCallToolImpl(name, args, _meta);
  };

  // Compose the middleware
  recursiveCallToolHandler = compose(
    createLoggingMiddleware({ enabled: true }),
  // We define this variable *before* using it in the internal handler above?
  // No, JS hoisting of 'var' or function declarations works, but `const` does not hoist.
  // We need to be careful with the circular dependency of `callToolWithMiddleware` being used inside `_internalCallToolImpl`.
  //
  // Solution: We create a mutable reference or a lazy getter for the middleware stack.

  let _lazyCallToolWithMiddleware: CallToolHandler | null = null;

  const callToolWithMiddleware = compose(
    createFilterCallToolMiddleware({
      cacheEnabled: true,
      customErrorMessage: (toolName, reason) => `Access denied: ${reason}`,
    }),
    createToolOverridesCallToolMiddleware({ cacheEnabled: true }),
  )(implCallToolHandler);

  // Also expose callToolWithMiddleware for internal uses if needed,
  // but we should reuse recursiveCallToolHandler as the primary entry point
  const callToolWithMiddleware = recursiveCallToolHandler;
  )(originalCallToolHandler);

  // Assign it for the closure to capture (Wait, const is not mutable re-assignment, but the object _internalCallToolImpl captured... wait.)
  // The `originalCallToolHandler` calls `_internalCallToolImpl`.
  // `_internalCallToolImpl` calls `callToolWithMiddleware`.
  // `callToolWithMiddleware` calls `originalCallToolHandler`.
  // This is a cycle.

  // To break the cycle and allow the recursion:
  // We need `_internalCallToolImpl` to call the *final composed function*.
  // But the composed function is created *after* `_internalCallToolImpl` is defined (lexically).
  //
  // We can use a wrapper function that calls the `callToolWithMiddleware` variable,
  // relying on the fact that the variable will be defined by the time the code actually runs.
  // BUT `const` has TDZ (Temporal Dead Zone).
  //
  // Refactor strategy:
  // 1. Define `callToolWithMiddleware` as a `let` placeholder.
  // 2. Define `originalCallToolHandler` which calls the `let` variable for recursion.
  // 3. Update the `let` variable with the composed middleware.

  // Re-defining the structure to handle recursion correctly:

  let recursiveCallToolHandler: CallToolHandler;

  const wrappedCallToolHandler: CallToolHandler = async (request, context) => {
      // This function delegates to the middleware stack, which eventually calls originalCallToolHandler
      return recursiveCallToolHandler(request, context);
  };

  const implCallToolHandler: CallToolHandler = async (request, context) => {
      const { name, arguments: args, _meta } = request.params;

      // Meta Tools Logic
      if (name === "search_tools") {
          return _internalCallToolImpl(name, args, _meta);
      }
      else if (name === "load_tool") {
          return _internalCallToolImpl(name, args, _meta);
      }
      else if (name === "run_code") {
          // Special handling for run_code recursion
           const { code } = args as { code: string };
           try {
               const result = await codeExecutorService.executeCode(code, async (tName, tArgs) => {
                   if (tName === "run_code") throw new Error("Recursion detected");
                   // Call the TOP of the middleware stack
                   return recursiveCallToolHandler({
                       method: "tools/call",
                       params: { name: tName, arguments: tArgs, _meta }
                   }, context);
               });
               return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
           } catch (e: any) {
               return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
           }
      }

      // Default Logic
      return _internalCallToolImpl(name, args, _meta);
  };

  // Compose the middleware
  recursiveCallToolHandler = compose(
    createFilterCallToolMiddleware({
      cacheEnabled: true,
      customErrorMessage: (toolName, reason) => `Access denied: ${reason}`,
    }),
    createToolOverridesCallToolMiddleware({ cacheEnabled: true }),
  )(implCallToolHandler);


  // Set up the handlers
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    return await listToolsWithMiddleware(request, handlerContext);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await recursiveCallToolHandler(request, handlerContext);
  });

  // Get Prompt Handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    const clientForPrompt = promptToClient[name];

    if (!clientForPrompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    try {
      // Parse the prompt name using shared utility
      const parsed = parseToolName(name);
      if (!parsed) {
        throw new Error(`Invalid prompt name format: ${name}`);
      }

      const promptName = parsed.originalToolName;
      const response = await clientForPrompt.client.request(
        {
          method: "prompts/get",
          params: {
            name: promptName,
            arguments: request.params.arguments || {},
            _meta: request.params._meta,
          },
        },
        GetPromptResultSchema,
      );

      return response;
    } catch (error) {
      console.error(
        `Error getting prompt through ${
          clientForPrompt.client.getServerVersion()?.name
        }:`,
        error,
      );
      throw error;
    }
  });

  // List Prompts Handler
  server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
    const serverParams = await getMcpServers(
      namespaceUuid,
      includeInactiveServers,
    );
    const allPrompts: z.infer<typeof ListPromptsResultSchema>["prompts"] = [];

    // Track visited servers to detect circular references - reset on each call
    const visitedServers = new Set<string>();

    // Filter out self-referencing servers before processing
    const validPromptServers = Object.entries(serverParams).filter(
      ([uuid, params]) => {
        // Skip if we've already visited this server to prevent circular references
        if (visitedServers.has(uuid)) {
          console.log(
            `Skipping already visited server in prompts: ${params.name || uuid}`,
          );
          return false;
        }

        // Check if this server is the same instance to prevent self-referencing
        if (isSameServerInstance(params, uuid)) {
          console.log(
            `Skipping self-referencing server in prompts: ${params.name || uuid}`,
          );
          return false;
        }

        // Mark this server as visited
        visitedServers.add(uuid);
        return true;
      },
    );

    await Promise.allSettled(
      validPromptServers.map(async ([uuid, params]) => {
        const session = await mcpServerPool.getSession(
          sessionId,
          uuid,
          params,
          namespaceUuid,
        );
        if (!session) return;

        // Now check for self-referencing using the actual MCP server name
        const serverVersion = session.client.getServerVersion();
        const actualServerName = serverVersion?.name || params.name || "";
        const ourServerName = `metamcp-unified-${namespaceUuid}`;

        if (actualServerName === ourServerName) {
          console.log(
            `Skipping self-referencing MetaMCP server in prompts: "${actualServerName}"`,
          );
          return;
        }

        const capabilities = session.client.getServerCapabilities();
        if (!capabilities?.prompts) return;

        // Use name assigned by user, fallback to name from server
        const serverName =
          params.name || session.client.getServerVersion()?.name || "";
        try {
          const result = await session.client.request(
            {
              method: "prompts/list",
              params: {
                cursor: request.params?.cursor,
                _meta: request.params?._meta,
              },
            },
            ListPromptsResultSchema,
          );

          if (result.prompts) {
            const promptsWithSource = result.prompts.map((prompt) => {
              const promptName = `${sanitizeName(serverName)}__${prompt.name}`;
              promptToClient[promptName] = session;
              return {
                ...prompt,
                name: promptName,
                description: prompt.description || "",
              };
            });
            allPrompts.push(...promptsWithSource);
          }
        } catch (error) {
          console.error(`Error fetching prompts from: ${serverName}`, error);
        }
      }),
    );

    return {
      prompts: allPrompts,
      nextCursor: request.params?.cursor,
    };
  });

  // List Resources Handler
  server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    const serverParams = await getMcpServers(
      namespaceUuid,
      includeInactiveServers,
    );
    const allResources: z.infer<typeof ListResourcesResultSchema>["resources"] =
      [];

    // Track visited servers to detect circular references - reset on each call
    const visitedServers = new Set<string>();

    // Filter out self-referencing servers before processing
    const validResourceServers = Object.entries(serverParams).filter(
      ([uuid, params]) => {
        // Skip if we've already visited this server to prevent circular references
        if (visitedServers.has(uuid)) {
          console.log(
            `Skipping already visited server in resources: ${params.name || uuid}`,
          );
          return false;
        }

        // Check if this server is the same instance to prevent self-referencing
        if (isSameServerInstance(params, uuid)) {
          console.log(
            `Skipping self-referencing server in resources: ${params.name || uuid}`,
          );
          return false;
        }

        // Mark this server as visited
        visitedServers.add(uuid);
        return true;
      },
    );

    await Promise.allSettled(
      validResourceServers.map(async ([uuid, params]) => {
        const session = await mcpServerPool.getSession(
          sessionId,
          uuid,
          params,
          namespaceUuid,
        );
        if (!session) return;

        // Now check for self-referencing using the actual MCP server name
        const serverVersion = session.client.getServerVersion();
        const actualServerName = serverVersion?.name || params.name || "";
        const ourServerName = `metamcp-unified-${namespaceUuid}`;

        if (actualServerName === ourServerName) {
          console.log(
            `Skipping self-referencing MetaMCP server in resources: "${actualServerName}"`,
          );
          return;
        }

        const capabilities = session.client.getServerCapabilities();
        if (!capabilities?.resources) return;

        // Use name assigned by user, fallback to name from server
        const serverName =
          params.name || session.client.getServerVersion()?.name || "";
        try {
          const result = await session.client.request(
            {
              method: "resources/list",
              params: {
                cursor: request.params?.cursor,
                _meta: request.params?._meta,
              },
            },
            ListResourcesResultSchema,
          );

          if (result.resources) {
            const resourcesWithSource = result.resources.map((resource) => {
              resourceToClient[resource.uri] = session;
              return {
                ...resource,
                name: resource.name || "",
              };
            });
            allResources.push(...resourcesWithSource);
          }
        } catch (error) {
          console.error(`Error fetching resources from: ${serverName}`, error);
        }
      }),
    );

    return {
      resources: allResources,
      nextCursor: request.params?.cursor,
    };
  });

  // Read Resource Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const clientForResource = resourceToClient[uri];

    if (!clientForResource) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    try {
      return await clientForResource.client.request(
        {
          method: "resources/read",
          params: {
            uri,
            _meta: request.params._meta,
          },
        },
        ReadResourceResultSchema,
      );
    } catch (error) {
      console.error(
        `Error reading resource through ${
          clientForResource.client.getServerVersion()?.name
        }:`,
        error,
      );
      throw error;
    }
  });

  // List Resource Templates Handler
  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (request) => {
      const serverParams = await getMcpServers(
        namespaceUuid,
        includeInactiveServers,
      );
      const allTemplates: ResourceTemplate[] = [];

      // Track visited servers to detect circular references - reset on each call
      const visitedServers = new Set<string>();

      // Filter out self-referencing servers before processing
      const validTemplateServers = Object.entries(serverParams).filter(
        ([uuid, params]) => {
          // Skip if we've already visited this server to prevent circular references
          if (visitedServers.has(uuid)) {
            console.log(
              `Skipping already visited server in resource templates: ${params.name || uuid}`,
            );
            return false;
          }

          // Check if this server is the same instance to prevent self-referencing
          if (isSameServerInstance(params, uuid)) {
            console.log(
              `Skipping self-referencing server in resource templates: ${params.name || uuid}`,
            );
            return false;
          }

          // Mark this server as visited
          visitedServers.add(uuid);
          return true;
        },
      );

      await Promise.allSettled(
        validTemplateServers.map(async ([uuid, params]) => {
          const session = await mcpServerPool.getSession(
            sessionId,
            uuid,
            params,
            namespaceUuid,
          );
          if (!session) return;

          // Now check for self-referencing using the actual MCP server name
          const serverVersion = session.client.getServerVersion();
          const actualServerName = serverVersion?.name || params.name || "";
          const ourServerName = `metamcp-unified-${namespaceUuid}`;

          if (actualServerName === ourServerName) {
            console.log(
              `Skipping self-referencing MetaMCP server in resource templates: "${actualServerName}"`,
            );
            return;
          }

          const capabilities = session.client.getServerCapabilities();
          if (!capabilities?.resources) return;

          const serverName =
            params.name || session.client.getServerVersion()?.name || "";

          try {
            const result = await session.client.request(
              {
                method: "resources/templates/list",
                params: {
                  cursor: request.params?.cursor,
                  _meta: request.params?._meta,
                },
              },
              ListResourceTemplatesResultSchema,
            );

            if (result.resourceTemplates) {
              const templatesWithSource = result.resourceTemplates.map(
                (template) => ({
                  ...template,
                  name: template.name || "",
                }),
              );
              allTemplates.push(...templatesWithSource);
            }
          } catch (error) {
            console.error(
              `Error fetching resource templates from: ${serverName}`,
              error,
            );
            return;
          }
        }),
      );

      return {
        resourceTemplates: allTemplates,
        nextCursor: request.params?.cursor,
      };
    },
  );

  const cleanup = async () => {
    // Cleanup is now handled by the pool
    await mcpServerPool.cleanupSession(sessionId);
  };

  return { server, cleanup };
};
