import { db } from "../../db";
import { memoriesTable } from "../../db/schema";
import { embeddingService } from "../ai/embedding.service";
import { eq, desc, sql, and } from "drizzle-orm";

export class MemoryService {
  /**
   * Saves a new memory with generated embedding.
   */
  async saveMemory(
    content: string,
    metadata: Record<string, unknown> = {},
    userId: string,
    agentId?: string
  ) {
    const embedding = await embeddingService.generateEmbedding(content);

    const [memory] = await db
      .insert(memoriesTable)
      .values({
        content,
        embedding,
        metadata,
        user_id: userId,
        agent_id: agentId,
      })
      .returning();

    return memory;
  }

  /**
   * Searches memories semantically using vector similarity.
   */
  async searchMemories(
    query: string,
    userId: string,
    limit: number = 5,
    threshold: number = 0.7
  ) {
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // 1 - cosine_distance = cosine_similarity
    const similarity = sql<number>`1 - (${memoriesTable.embedding} <=> ${JSON.stringify(
      queryEmbedding
    )})`;

    const memories = await db
      .select({
        uuid: memoriesTable.uuid,
        content: memoriesTable.content,
        metadata: memoriesTable.metadata,
        created_at: memoriesTable.created_at,
        similarity,
      })
      .from(memoriesTable)
      .where(eq(memoriesTable.user_id, userId))
      .orderBy(desc(similarity))
      .limit(limit);

    return memories.filter((m) => m.similarity >= threshold);
  }

  /**
   * Lists recent memories for a user.
   */
  async listMemories(userId: string, limit: number = 20, offset: number = 0) {
    return await db
      .select()
      .from(memoriesTable)
      .where(eq(memoriesTable.user_id, userId))
      .orderBy(desc(memoriesTable.created_at))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Deletes a memory by UUID.
   */
  async deleteMemory(uuid: string, userId: string) {
    const [deleted] = await db
      .delete(memoriesTable)
      .where(and(eq(memoriesTable.uuid, uuid), eq(memoriesTable.user_id, userId)))
      .returning();

    return deleted;
  }
}

export const memoryService = new MemoryService();
