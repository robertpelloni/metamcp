import { notificationService } from "../../lib/notification.service";
import { BaseContext } from "@repo/trpc";

export const notificationsImplementations = {
  list: async (input: { limit?: number; unreadOnly?: boolean }, ctx: BaseContext) => {
    return await notificationService.getNotifications(ctx.session.user.id, input.limit, input.unreadOnly);
  },
  markRead: async (input: { id: string }) => {
    return await notificationService.markAsRead(input.id);
  },
  markAllRead: async (_input: any, ctx: BaseContext) => {
    return await notificationService.markAllAsRead(ctx.session.user.id);
  }
};
