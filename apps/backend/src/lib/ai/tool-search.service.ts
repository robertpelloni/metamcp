import { cosineDistance, desc, gt, sql } from "drizzle-orm";

import { db } from "../../db";
import { toolsTable } from "../../db/schema";
import { embeddingService } from "./embedding.service";

export interface ToolSearchResult {
  uuid: string;
  name: string;
  description: string | null;
  similarity: number;
  mcpServerUuid: string;
}

export class ToolSearchService {
  /**
   * Search for tools using vector similarity.
   * @param query The user's search query
   * @param limit Max number of results
   * @param threshold Minimum similarity threshold (0-1)
   */
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

  /**
   * Update the embedding for a specific tool.
   * This should be called when a tool is created or updated.
   */
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
