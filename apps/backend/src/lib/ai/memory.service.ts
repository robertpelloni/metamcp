import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "../../db";
import { memoriesTable } from "../../db/schema";
import { embeddingService } from "./embedding.service";

export interface MemoryResult {
  uuid: string;
  content: string;
  tags: string[] | null;
  similarity: number;
}

export class MemoryService {

  async saveMemory(content: string, tags: string[] = [], userId?: string): Promise<any> {
    const embedding = await embeddingService.generateEmbedding(content);

    const [memory] = await db
      .insert(memoriesTable)
      .values({
        content,
        tags,
        embedding,
        user_id: userId
      })
      .returning();

    return memory;
  }

  async searchMemory(query: string, limit: number = 5, threshold: number = 0.5): Promise<MemoryResult[]> {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const similarity = sql<number>`1 - (${cosineDistance(
        memoriesTable.embedding,
        queryEmbedding,
      )})`;

      const results = await db
        .select({
          uuid: memoriesTable.uuid,
          content: memoriesTable.content,
          tags: memoriesTable.tags,
          similarity,
        })
        .from(memoriesTable)
        .where(gt(similarity, threshold))
        .orderBy(desc(similarity))
        .limit(limit);

      return results;
    } catch (error) {
      console.error("Error searching memory:", error);
      return [];
    }
  }

  async listMemories(limit: number = 20): Promise<any[]> {
      // Basic listing without vector search
      return await db
        .select()
        .from(memoriesTable)
        .orderBy(desc(memoriesTable.created_at))
        .limit(limit);
  }
}

export const memoryService = new MemoryService();
