import { db } from "../../db";
import { notificationsTable } from "../../db/schema-notifications";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export class NotificationService {
  async notify(
    userId: string,
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    link?: string
  ) {
    await db.insert(notificationsTable).values({
      uuid: randomUUID(),
      user_id: userId,
      title,
      message,
      type,
      link,
    });
  }

  async listNotifications(userId: string, limit = 20) {
    return await db.query.notificationsTable.findMany({
      where: eq(notificationsTable.user_id, userId),
      limit,
      orderBy: [desc(notificationsTable.created_at)],
    });
  }

  async markAsRead(uuid: string) {
    await db.update(notificationsTable)
      .set({ is_read: true })
      .where(eq(notificationsTable.uuid, uuid));
  }

  async markAllAsRead(userId: string) {
    await db.update(notificationsTable)
      .set({ is_read: true })
      .where(eq(notificationsTable.user_id, userId));
  }
}

export const notificationService = new NotificationService();
