import { db } from "../../db";
import { auditLogsTable } from "../../db/schema";
import { randomUUID } from "crypto";
import { and, count, eq, SQL } from "drizzle-orm";

type AuditFilters = { userId?: string; action?: string };

export type AuditAction =
  | "CREATE_POLICY"
  | "UPDATE_POLICY"
  | "DELETE_POLICY"
  | "UPDATE_CONFIG"
  | "INSTALL_SERVER"
  | "UPDATE_SERVER"
  | "DELETE_SERVER"
  | "EXECUTE_TOOL" // Only for sensitive tools if needed
  | "LOGIN"
  | "LOGOUT";

export class AuditService {
  async log(
    action: AuditAction | string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, any> = {},
    userId?: string,
    ipAddress?: string
  ) {
    try {
      await db.insert(auditLogsTable).values({
        uuid: randomUUID(),
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        user_id: userId,
        ip_address: ipAddress,
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // We do not throw here to prevent blocking the main operation
    }
  }

  private buildWhereClause(filters: AuditFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters.userId) {
      conditions.push(eq(auditLogsTable.user_id, filters.userId));
    }

    if (filters.action) {
      conditions.push(eq(auditLogsTable.action, filters.action));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return and(...conditions);
  }

  async listLogs(limit = 50, offset = 0, filters: AuditFilters = {}) {
    const whereClause = this.buildWhereClause(filters);

    return await db.query.auditLogsTable.findMany({
      limit,
      offset,
      orderBy: (logs, { desc }) => [desc(logs.created_at)],
      where: whereClause,
    });
  }

  async countLogs(filters: AuditFilters = {}) {
    const whereClause = this.buildWhereClause(filters);

    const query = db.select({ total: count() }).from(auditLogsTable);

    const [result] = whereClause
      ? await query.where(whereClause)
      : await query;

    return result?.total ?? 0;
  }
}

export const auditService = new AuditService();
