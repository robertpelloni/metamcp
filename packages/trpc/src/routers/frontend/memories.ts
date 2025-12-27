import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

export const createMemoriesRouter = (implementations: {
  list: (input: { limit?: number }) => Promise<any[]>;
  create: (input: { content: string; tags?: string[] }) => Promise<any>;
  delete: (input: { id: string }) => Promise<any>;
}) => {
  return router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50).optional() }))
      .query(async ({ input }) => {
        return await implementations.list(input);
      }),
    create: protectedProcedure
      .input(z.object({ content: z.string(), tags: z.array(z.string()).optional() }))
      .mutation(async ({ input }) => {
        return await implementations.create(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await implementations.delete(input);
      })
  });
};
