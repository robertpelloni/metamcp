import {
  CreateMemoryRequestSchema,
  DeleteMemoryRequestSchema,
  ListMemoriesRequestSchema,
  MemoryListResponseSchema,
  MemorySchema,
  MemorySearchResponseSchema,
  SearchMemoriesRequestSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createMemoriesRouter = (implementations: {
  list: (opts: {
    input: z.infer<typeof ListMemoriesRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof MemoryListResponseSchema>>;
  search: (opts: {
    input: z.infer<typeof SearchMemoriesRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof MemorySearchResponseSchema>>;
  create: (opts: {
    input: z.infer<typeof CreateMemoryRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof MemorySchema>>;
  delete: (opts: {
    input: z.infer<typeof DeleteMemoryRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<void>;
}) => {
  return router({
    list: protectedProcedure
      .input(ListMemoriesRequestSchema)
      .query(async ({ input, ctx }) => {
        return implementations.list({ input, ctx });
      }),
    search: protectedProcedure
      .input(SearchMemoriesRequestSchema)
      .query(async ({ input, ctx }) => {
        return implementations.search({ input, ctx });
      }),
    create: protectedProcedure
      .input(CreateMemoryRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.create({ input, ctx });
      }),
    delete: protectedProcedure
      .input(DeleteMemoryRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.delete({ input, ctx });
      }),
  });
};
