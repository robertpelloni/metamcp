import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { notificationService } from "../../lib/notification.service";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await notificationService.listNotifications(input.unreadOnly, input.limit);
    }),
  markRead: protectedProcedure
    .input(z.object({ uuid: z.string() }))
    .mutation(async ({ input }) => {
      return await notificationService.markAsRead(input.uuid);
    }),
  markAllRead: protectedProcedure.mutation(async () => {
      return await notificationService.markAllAsRead();
  }),
});
