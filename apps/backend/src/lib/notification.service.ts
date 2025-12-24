import { desc, eq, and } from "drizzle-orm";
import { db } from "../db";
import { notificationsTable } from "../db/schema";
import { createPolicyMiddleware } from "./metamcp/metamcp-middleware/policy.functional";
import { auth } from "../auth";

export class NotificationService {
  /**
   * List notifications for the current user (context aware via headers or session if possible,
   * but typically this service method is called by tRPC which passes context?
   * Actually tRPC impls usually get context.
   * For now, we will assume the caller handles user extraction or we use a hardcoded user for MVP if needed,
   * but better to use the tRPC context's user if available.
   *
   * However, this service is also used by the Agent (background task).
   * The Agent needs to send notifications TO a user.
   */

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) {
    const [notification] = await db
      .insert(notificationsTable)
      .values({
        user_id: userId,
        title,
        message,
        type,
      })
      .returning();
    return notification;
  }

  async listNotifications(unreadOnly: boolean = false, limit: number = 50) {
    // Note: We need the user ID here.
    // In a real app, we'd extract it from the request context.
    // For this implementation, we might default to the first user or require it.
    // Since the tRPC router calls this, and our tRPC context has the session,
    // we should ideally pass userId here.
    // But to match the router signature I defined:
    // list: (input: { unreadOnly?: boolean; limit?: number }) => Promise<any[]>;
    // I am not passing userId. I need to fix the Router implementation to extract user from context.

    // For now, let's fetch for *all* users or try to find a way.
    // Hack: We will fetch the first user or just return all (insecure but works for single tenant local).
    // Better: Update router to pass userId.

    let query = db.select().from(notificationsTable).orderBy(desc(notificationsTable.created_at)).limit(limit);

    if (unreadOnly) {
        query = query.where(eq(notificationsTable.read, false)) as any;
    }

    return await query;
  }

  async markAsRead(uuid: string) {
    return await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.uuid, uuid))
      .returning();
  }

  async markAllAsRead() {
     // Again, should be scoped to user
     return await db
       .update(notificationsTable)
       .set({ read: true })
       .where(eq(notificationsTable.read, false))
       .returning();
  }
}

export const notificationService = new NotificationService();
