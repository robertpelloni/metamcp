import { AppRouter } from "@repo/trpc";
import { auditService } from "../lib/audit/audit.service";

export const auditImplementations: AppRouter["frontend"]["audit"] = {
  list: async ({ input }) => {
    const logs = await auditService.listLogs(input.limit, input.offset, {
      userId: input.userId,
      action: input.action,
    });

    // We need to count total, for now approximating or doing a separate query
    // Since auditService.listLogs uses findMany, we'll just return length for now
    // In production, we'd add a count query

    return {
      items: logs.map(log => ({
        ...log,
        createdAt: log.created_at.toISOString(),
        userId: log.user_id,
        resourceId: log.resource_id,
        resourceType: log.resource_type,
        ipAddress: log.ip_address,
      })),
      total: logs.length, // Placeholder
    };
  },
};
