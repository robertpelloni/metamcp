import { type AppRouter } from "@repo/trpc";
import { memoryService } from "../lib/memory/memory.service";

export const memoriesImplementations: AppRouter["frontend"]["memories"] = {
  create: async ({ input, ctx }) => {
    return memoryService.saveMemory(input.content, input.tags || [], ctx.user?.id);
  },
  search: async ({ input, ctx }) => {
    return memoryService.searchMemories(input.query, input.limit, ctx.user?.id);
  },
  list: async ({ input, ctx }) => {
    return memoryService.listMemories(input.limit, input.offset, ctx.user?.id);
  },
  delete: async ({ input, ctx }) => {
    return memoryService.deleteMemory(input.uuid, ctx.user?.id);
  },
};
