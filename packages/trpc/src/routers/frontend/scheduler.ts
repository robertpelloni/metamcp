import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

import { BaseContext } from "../../trpc";

export const createSchedulerRouter = (implementations: {
  list: (input: any, ctx: BaseContext) => Promise<any[]>;
  create: (input: { cron: string; type: "agent" | "script"; payload?: any }, ctx: BaseContext) => Promise<any>;
  delete: (input: { id: string }) => Promise<any>;
}) => {
  return router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await implementations.list({}, ctx);
    }),
    create: protectedProcedure
      .input(
        z.object({
          cron: z.string(),
          type: z.enum(["agent", "script"]),
          payload: z.any().optional()
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await implementations.create(input, ctx);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await implementations.delete(input);
      }),
  });
};
