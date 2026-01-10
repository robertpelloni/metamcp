import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

import { db } from "../../db";
import { toolsTable } from "../../db/schema";
import { embeddingService } from "./embedding.service";
import {
  hybridSearchService,
  HybridSearchResult,
  HybridSearchOptions,
} from "./hybrid-search.service";
import {
  patternFilterService,
  PatternFilterOptions,
  FilterResult,
} from "./pattern-filter.service";

export interface ToolSearchResult {
  uuid: string;
  name: string;
  description: string | null;
  similarity: number;
  mcpServerUuid: string;
}

export type { HybridSearchResult, HybridSearchOptions };

export class ToolSearchService {
  async searchTools(
    query: string,
    limit: number = 10,
    threshold: number = 0.5,
  ): Promise<ToolSearchResult[]> {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const similarity = sql<number>`1 - (${cosineDistance(
        toolsTable.embedding,
        queryEmbedding,
      )})`;

      const results = await db
        .select({
          uuid: toolsTable.uuid,
          name: toolsTable.name,
          description: sql<string>`COALESCE(${toolsTable.concise_description}, ${toolsTable.description})`,
          mcpServerUuid: toolsTable.mcp_server_uuid,
          similarity,
        })
        .from(toolsTable)
        .where(gt(similarity, threshold))
        .orderBy(desc(similarity))
        .limit(limit);

      return results;
    } catch (error) {
      console.error("Error searching tools:", error);
      return [];
    }
  }

  async hybridSearch(
    query: string,
    options?: HybridSearchOptions,
  ): Promise<HybridSearchResult[]> {
    return hybridSearchService.search(query, options);
  }

  async quickSearch(
    query: string,
    limit: number = 10,
  ): Promise<HybridSearchResult[]> {
    return hybridSearchService.quickSearch(query, limit);
  }

  async deepSearch(
    query: string,
    limit: number = 10,
  ): Promise<HybridSearchResult[]> {
    return hybridSearchService.deepSearch(query, limit);
  }

  filterByPattern(
    tools: Tool[],
    patterns: string | string[],
    options?: PatternFilterOptions,
  ): FilterResult<Tool> {
    return patternFilterService.filterTools(tools, patterns, options);
  }

  filterByServer(tools: Tool[], serverPatterns: string | string[]): Tool[] {
    return patternFilterService.filterByServer(tools, serverPatterns);
  }

  excludeByPattern(tools: Tool[], excludePatterns: string | string[]): Tool[] {
    return patternFilterService.excludeTools(tools, excludePatterns);
  }

  smartFilter(
    tools: Tool[],
    query: string,
    options?: PatternFilterOptions,
  ): FilterResult<Tool> {
    return patternFilterService.searchWithPattern(tools, query, options);
  }

  combineFilters(
    tools: Tool[],
    config: {
      include?: string | string[];
      exclude?: string | string[];
      servers?: string | string[];
    },
  ): FilterResult<Tool> {
    return patternFilterService.combineFilters(tools, config);
  }

  async updateToolEmbedding(toolUuid: string): Promise<void> {
    const tool = await db.query.toolsTable.findFirst({
      where: (table, { eq }) => eq(table.uuid, toolUuid),
    });

    if (!tool) {
      throw new Error(`Tool with UUID ${toolUuid} not found`);
    }

    // Use rich description if available, otherwise generate default search text
    let searchText: string;
    if (tool.rich_description) {
      searchText = tool.rich_description;
    } else {
      searchText = embeddingService.generateToolSearchText({
        name: tool.name,
        description: tool.description,
        toolSchema: tool.toolSchema,
      });
    }

    const embedding = await embeddingService.generateEmbedding(searchText);

    await db
      .update(toolsTable)
      .set({ embedding })
      .where(sql`${toolsTable.uuid} = ${toolUuid}`);
  }
}

export const toolSearchService = new ToolSearchService();
