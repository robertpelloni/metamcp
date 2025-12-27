import { z } from "zod";
import { protectedProcedure, router, BaseContext } from "../../trpc";

export const createNotificationsRouter = (implementations: {
  list: (input: { limit?: number; unreadOnly?: boolean }, ctx: BaseContext) => Promise<any[]>;
  markRead: (input: { id: string }) => Promise<any>;
  markAllRead: (input: any, ctx: BaseContext) => Promise<any>;
}) => {
  return router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional(), unreadOnly: z.boolean().optional() }))
      .query(async ({ input, ctx }) => {
        return await implementations.list(input, ctx);
      }),
    markRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await implementations.markRead(input);
      }),
    markAllRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await implementations.markAllRead({}, ctx);
      })
  });
};
