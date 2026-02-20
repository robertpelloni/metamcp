import {
  ListNotificationsResponseSchema,
  MarkNotificationReadRequestSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createNotificationsRouter = (implementations: {
  list: (opts: {
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof ListNotificationsResponseSchema>>;
  markRead: (opts: {
    input: z.infer<typeof MarkNotificationReadRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<void>;
}) => {
  return router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return implementations.list({ ctx });
    }),
    markRead: protectedProcedure
      .input(MarkNotificationReadRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.markRead({ input, ctx });
      }),
  });
};
