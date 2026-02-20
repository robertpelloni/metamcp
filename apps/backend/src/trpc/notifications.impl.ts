import { AppRouter } from "@repo/trpc";
import { notificationService } from "../lib/notifications/notification.service";

export const notificationsImplementations: AppRouter["frontend"]["notifications"] = {
  list: async ({ ctx }) => {
    const notifications = await notificationService.listNotifications(ctx.user.id);
    return notifications.map(n => ({
      uuid: n.uuid,
      title: n.title,
      message: n.message,
      type: n.type as any,
      isRead: n.is_read,
      link: n.link,
      createdAt: n.created_at.toISOString(),
    }));
  },
  markRead: async ({ input, ctx }) => {
    if (input.uuid) {
      await notificationService.markAsRead(input.uuid);
    } else {
      await notificationService.markAllAsRead(ctx.user.id);
    }
  },
};
