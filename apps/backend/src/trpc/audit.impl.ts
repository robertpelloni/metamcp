import { AppRouter } from "@repo/trpc";
import { auditService } from "../lib/audit/audit.service";

export const auditImplementations: AppRouter["frontend"]["audit"] = {
  list: async ({ input }) => {
    const filters = {
      userId: input.userId,
      action: input.action,
    };

    const [logs, total] = await Promise.all([
      auditService.listLogs(input.limit, input.offset, filters),
      auditService.countLogs(filters),
    ]);

    return {
      items: logs.map(log => ({
        ...log,
        createdAt: log.created_at.toISOString(),
        userId: log.user_id,
        resourceId: log.resource_id,
        resourceType: log.resource_type,
        ipAddress: log.ip_address,
      })),
      total,
    };
  },
};
