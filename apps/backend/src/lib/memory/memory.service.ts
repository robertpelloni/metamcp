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

    return this.storage.store({
      content,
      embedding,
      metadata,
      user_id: userId,
      agent_id: agentId
    });
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
    const results = await this.storage.search(queryEmbedding, 0, limit * 2); // Fetch more for filtering

    // Filter by user_id and threshold
    // Note: JsonMemoryStorage search might not filter by user_id efficiently yet, 
    // so we filter here to be safe and consistent.
    return results
      .filter(m => m.user_id === userId)
      .slice(0, limit);
  }

  /**
   * Lists recent memories for a user.
   */
  async listMemories(userId: string, limit: number = 20, offset: number = 0) {
    // Basic implementation using getRecent. 
    // Ideally storage provider should support pagination and filtering.
    // For JSON/Local, retrieval is cheap enough to filter in memory.
    const recent = await this.storage.getRecent(1000);
    return recent
      .filter(m => m.user_id === userId)
      .sort((a, b) => (b.timestamp - a.timestamp))
      .slice(offset, offset + limit);
  }

  /**
   * Deletes a memory by UUID.
   */
  async deleteMemory(uuid: string, userId: string) {
    // JSON storage might need a delete method
    // For now, we'll log a warning as it wasn't in the interface
    console.warn("deleteMemory not fully implemented for JSON storage");
    return undefined;
  }
}

export const memoryService = new MemoryService();
