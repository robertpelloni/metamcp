import { z } from "zod";

export const NotificationSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "success", "warning", "error"]),
  isRead: z.boolean(),
  link: z.string().nullable(),
  createdAt: z.string(),
});

export const ListNotificationsResponseSchema = z.array(NotificationSchema);

export const MarkNotificationReadRequestSchema = z.object({
  uuid: z.string().optional(), // If not provided, marks all as read
});
