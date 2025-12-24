import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

export const createSchedulerRouter = (implementations: {
  list: () => Promise<any[]>;
  create: (input: { cron: string; type: "agent" | "script"; payload?: any }) => Promise<any>;
  delete: (input: { uuid: string }) => Promise<any>;
}) => {
  return router({
    list: protectedProcedure.query(async () => {
      return await implementations.list();
    }),
    create: protectedProcedure
      .input(
        z.object({
          cron: z.string(),
          type: z.enum(["agent", "script"]),
          payload: z.any().optional()
        })
      )
      .mutation(async ({ input }) => {
        return await implementations.create(input);
      }),
    delete: protectedProcedure
      .input(z.object({ uuid: z.string() }))
      .mutation(async ({ input }) => {
        return await implementations.delete(input);
      }),
  });
};
