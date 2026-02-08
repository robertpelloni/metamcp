import { db } from "../../db";
import { auditLogsTable } from "../../db/schema";
import { randomUUID } from "crypto";

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

  async listLogs(limit = 50, offset = 0, filters: { userId?: string; action?: string } = {}) {
    // Basic implementation, would use db.query.auditLogsTable.findMany in reality
    // For now, return empty or implement full query if needed
    return await db.query.auditLogsTable.findMany({
        limit,
        offset,
        orderBy: (logs, { desc }) => [desc(logs.created_at)],
        // where: ... (implement filters)
    });
  }
}

export const auditService = new AuditService();
