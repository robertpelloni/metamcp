import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

export const createMemoriesRouter = (implementations: {
  list: (input: { limit?: number }) => Promise<any[]>;
  delete: (input: { uuid: string }) => Promise<any>;
}) => {
  return router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50).optional() }))
      .query(async ({ input }) => {
        return await implementations.list(input);
      }),
    delete: protectedProcedure
      .input(z.object({ uuid: z.string() }))
      .mutation(async ({ input }) => {
        return await implementations.delete(input);
      }),
  });
};
