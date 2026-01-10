import {
  CreateToolRequestSchema,
  CreateToolResponseSchema,
  GetToolsByMcpServerUuidRequestSchema,
  GetToolsByMcpServerUuidResponseSchema,
  PatternFilterRequestSchema,
  PatternFilterCombinedRequestSchema,
  SmartFilterRequestSchema,
  PatternFilterResponseSchema,
} from "@repo/zod-types";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { toolsRepository } from "../db/repositories";
import { ToolsSerializer } from "../db/serializers";
import { toolsSyncCache } from "../lib/metamcp/tools-sync-cache";
import { toolSearchService } from "../lib/ai/tool-search.service";

export const toolsImplementations = {
  getByMcpServerUuid: async (
    input: z.infer<typeof GetToolsByMcpServerUuidRequestSchema>,
  ): Promise<z.infer<typeof GetToolsByMcpServerUuidResponseSchema>> => {
    try {
      const tools = await toolsRepository.findByMcpServerUuid(
        input.mcpServerUuid,
      );

      return {
        success: true as const,
        data: ToolsSerializer.serializeToolList(tools),
        message: "Tools retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching tools by MCP server UUID:", error);
      return {
        success: false as const,
        data: [],
        message: "Failed to fetch tools",
      };
    }
  },

  create: async (
    input: z.infer<typeof CreateToolRequestSchema>,
  ): Promise<z.infer<typeof CreateToolResponseSchema>> => {
    try {
      if (!input.tools || input.tools.length === 0) {
        return {
          success: true as const,
          count: 0,
          message: "No tools to save",
        };
      }

      const results = await toolsRepository.bulkUpsert({
        tools: input.tools,
        mcpServerUuid: input.mcpServerUuid,
      });

      return {
        success: true as const,
        count: results.length,
        message: `Successfully saved ${results.length} tools`,
      };
    } catch (error) {
      console.error("Error saving tools to database:", error);
      return {
        success: false as const,
        count: 0,
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  sync: async (
    input: z.infer<typeof CreateToolRequestSchema>,
  ): Promise<z.infer<typeof CreateToolResponseSchema>> => {
    try {
      if (!input.tools || input.tools.length === 0) {
        return {
          success: true as const,
          count: 0,
          message: "No tools to sync",
        };
      }

      const toolNames = input.tools.map((tool) => tool.name);
      const hasChanged = toolsSyncCache.hasChanged(
        input.mcpServerUuid,
        toolNames,
      );

      if (hasChanged) {
        toolsSyncCache.update(input.mcpServerUuid, toolNames);

        const { upserted, deleted } = await toolsRepository.syncTools({
          tools: input.tools,
          mcpServerUuid: input.mcpServerUuid,
        });

        const message =
          deleted.length > 0
            ? `Successfully synced ${upserted.length} tools (removed ${deleted.length} obsolete)`
            : `Successfully synced ${upserted.length} tools`;

        return {
          success: true as const,
          count: upserted.length,
          message,
        };
      } else {
        return {
          success: true as const,
          count: input.tools.length,
          message: "Tools unchanged, skipped sync",
        };
      }
    } catch (error) {
      console.error("Error syncing tools to database:", error);
      return {
        success: false as const,
        count: 0,
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  filterByPattern: async (
    input: z.infer<typeof PatternFilterRequestSchema>,
  ): Promise<z.infer<typeof PatternFilterResponseSchema>> => {
    try {
      const tools = await getToolsForFiltering(input.mcpServerUuid);
      const result = toolSearchService.filterByPattern(
        tools,
        input.patterns,
        input.options,
      );

      return {
        success: true as const,
        data: {
          items: ToolsSerializer.serializeToolList(
            result.items.map(toolToDbFormat),
          ),
          matched: result.matched,
          total: result.total,
          patterns: result.patterns,
        },
      };
    } catch (error) {
      console.error("Error filtering tools by pattern:", error);
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  combineFilters: async (
    input: z.infer<typeof PatternFilterCombinedRequestSchema>,
  ): Promise<z.infer<typeof PatternFilterResponseSchema>> => {
    try {
      const tools = await getToolsForFiltering(input.mcpServerUuid);
      const result = toolSearchService.combineFilters(tools, {
        include: input.include,
        exclude: input.exclude,
        servers: input.servers,
      });

      return {
        success: true as const,
        data: {
          items: ToolsSerializer.serializeToolList(
            result.items.map(toolToDbFormat),
          ),
          matched: result.matched,
          total: result.total,
          patterns: result.patterns,
        },
      };
    } catch (error) {
      console.error("Error combining filters:", error);
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  smartFilter: async (
    input: z.infer<typeof SmartFilterRequestSchema>,
  ): Promise<z.infer<typeof PatternFilterResponseSchema>> => {
    try {
      const tools = await getToolsForFiltering(input.mcpServerUuid);
      const result = toolSearchService.smartFilter(
        tools,
        input.query,
        input.options,
      );

      return {
        success: true as const,
        data: {
          items: ToolsSerializer.serializeToolList(
            result.items.map(toolToDbFormat),
          ),
          matched: result.matched,
          total: result.total,
          patterns: result.patterns,
        },
      };
    } catch (error) {
      console.error("Error with smart filter:", error);
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },
};

async function getToolsForFiltering(mcpServerUuid?: string): Promise<Tool[]> {
  if (mcpServerUuid) {
    const dbTools = await toolsRepository.findByMcpServerUuid(mcpServerUuid);
    return dbTools.map(dbToolToMcpTool);
  }
  const allTools = await toolsRepository.findAll();
  return allTools.map(dbToolToMcpTool);
}

function dbToolToMcpTool(dbTool: {
  name: string;
  description: string | null;
  toolSchema: unknown;
}): Tool {
  return {
    name: dbTool.name,
    description: dbTool.description ?? undefined,
    inputSchema: dbTool.toolSchema as Tool["inputSchema"],
  };
}

function toolToDbFormat(tool: Tool): {
  uuid: string;
  name: string;
  title: string | null;
  description: string | null;
  toolSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
  created_at: Date;
  updated_at: Date;
  mcp_server_uuid: string;
} {
  return {
    uuid: "",
    name: tool.name,
    title: null,
    description: tool.description ?? null,
    toolSchema: tool.inputSchema as {
      type: "object";
      properties?: Record<string, unknown>;
      required?: string[];
    },
    created_at: new Date(),
    updated_at: new Date(),
    mcp_server_uuid: "",
  };
}
