import { memoryService } from "../../lib/ai/memory.service";

export const memoriesImplementations = {
  list: async (input: { limit?: number; offset?: number }) => {
    return await memoryService.listMemories(input.limit, input.offset);
  },
  search: async (input: { query: string; limit?: number }) => {
    return await memoryService.searchMemory(input.query, input.limit);
  },
  create: async (input: { content: string; tags?: string[] }) => {
    return await memoryService.saveMemory(input.content, input.tags);
  },
  delete: async (input: { id: string }) => {
    return await memoryService.deleteMemory(input.id);
  }
};
