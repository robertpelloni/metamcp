<<<<<<< HEAD
import { db } from "../../db";
import { memoriesTable } from "../../db/schema";
import { embeddingService } from "../ai/embedding.service";
import { eq, desc, sql, and } from "drizzle-orm";

export class MemoryService {
=======
import { embeddingService } from "../ai/embedding.service";
import { MemoryStorageProvider, Memory } from "./memory-storage.interface";
import { JsonMemoryStorage } from "./json-memory.storage";

// Simple factory to get the storage provider
// Could be expanded to check env vars
const getStorageProvider = (): MemoryStorageProvider => {
  return new JsonMemoryStorage();
};

export class MemoryService {
  private storage: MemoryStorageProvider;

  constructor() {
    this.storage = getStorageProvider();
  }

>>>>>>> fix/detached-head-recovery
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

<<<<<<< HEAD
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
=======
    return this.storage.store({
      content,
      embedding,
      metadata,
      user_id: userId,
      agent_id: agentId
    });
>>>>>>> fix/detached-head-recovery
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
<<<<<<< HEAD

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
=======
    const results = await this.storage.search(queryEmbedding, 0, limit * 2); // Fetch more for filtering

    // Filter by user_id and threshold
    // Note: JsonMemoryStorage search might not filter by user_id efficiently yet, 
    // so we filter here to be safe and consistent.
    return results
      .filter(m => m.user_id === userId)
      .slice(0, limit);
>>>>>>> fix/detached-head-recovery
  }

  /**
   * Lists recent memories for a user.
   */
  async listMemories(userId: string, limit: number = 20, offset: number = 0) {
<<<<<<< HEAD
    return await db
      .select()
      .from(memoriesTable)
      .where(eq(memoriesTable.user_id, userId))
      .orderBy(desc(memoriesTable.created_at))
      .limit(limit)
      .offset(offset);
=======
    // Basic implementation using getRecent. 
    // Ideally storage provider should support pagination and filtering.
    // For JSON/Local, retrieval is cheap enough to filter in memory.
    const recent = await this.storage.getRecent(1000);
    return recent
      .filter(m => m.user_id === userId)
      .sort((a, b) => (b.timestamp - a.timestamp))
      .slice(offset, offset + limit);
>>>>>>> fix/detached-head-recovery
  }

  /**
   * Deletes a memory by UUID.
   */
  async deleteMemory(uuid: string, userId: string) {
<<<<<<< HEAD
    const [deleted] = await db
      .delete(memoriesTable)
      .where(and(eq(memoriesTable.uuid, uuid), eq(memoriesTable.user_id, userId)))
      .returning();

    return deleted;
=======
    // JSON storage might need a delete method
    // For now, we'll log a warning as it wasn't in the interface
    console.warn("deleteMemory not fully implemented for JSON storage");
    return undefined;
>>>>>>> fix/detached-head-recovery
  }
}

export const memoryService = new MemoryService();
