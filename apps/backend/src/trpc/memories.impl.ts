import { type AppRouter } from "@repo/trpc";
import { memoryService } from "../lib/memory/memory.service";

export const memoriesImplementations: AppRouter["frontend"]["memories"] = {
  create: async ({ input, ctx }) => {
    return memoryService.saveMemory(input.content, input.metadata || {}, ctx.user.id);
  },
  search: async ({ input, ctx }) => {
    return memoryService.searchMemories(input.query, ctx.user.id, input.limit);
  },
  list: async ({ input, ctx }) => {
    return memoryService.listMemories(ctx.user.id, input.limit, input.offset);
  },
  delete: async ({ input, ctx }) => {
    return memoryService.deleteMemory(input.uuid, ctx.user.id);
  },
};
