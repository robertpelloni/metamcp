import type { ServerHealthInfo } from "@repo/zod-types";
import {
  CheckServerHealthRequestSchema,
  CheckServerHealthResponseSchema,
  GetHealthSummaryResponseSchema,
  GetServerHealthRequestSchema,
  GetServerHealthResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { mcpServersRepository } from "../db/repositories";
import { serverHealthService } from "../lib/metamcp/server-health.service";

export const serverHealthImplementations = {
  checkHealth: async (
    input: z.infer<typeof CheckServerHealthRequestSchema>,
    userId: string,
  ): Promise<z.infer<typeof CheckServerHealthResponseSchema>> => {
    try {
      const serverUuids = input.serverUuids;

      if (serverUuids && serverUuids.length > 0) {
        const accessibleServers =
          await mcpServersRepository.findAllAccessibleToUser(userId);
        const accessibleUuids = new Set(accessibleServers.map((s) => s.uuid));

        const unauthorizedUuids = serverUuids.filter(
          (uuid: string) => !accessibleUuids.has(uuid),
        );

        if (unauthorizedUuids.length > 0) {
          return {
            success: false as const,
            message: `Access denied for servers: ${unauthorizedUuids.join(", ")}`,
          };
        }
      }

      const results =
        await serverHealthService.checkMultipleServers(serverUuids);

      return {
        success: true as const,
        data: results,
        message: `Health check completed for ${results.length} server(s)`,
      };
    } catch (error) {
      console.error("Error checking server health:", error);
      return {
        success: false as const,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  getHealth: async (
    input: z.infer<typeof GetServerHealthRequestSchema>,
    userId: string,
  ): Promise<z.infer<typeof GetServerHealthResponseSchema>> => {
    try {
      const serverUuids = input.serverUuids;

      if (serverUuids && serverUuids.length > 0) {
        const accessibleServers =
          await mcpServersRepository.findAllAccessibleToUser(userId);
        const accessibleUuids = new Set(accessibleServers.map((s) => s.uuid));

        const unauthorizedUuids = serverUuids.filter(
          (uuid: string) => !accessibleUuids.has(uuid),
        );

        if (unauthorizedUuids.length > 0) {
          return {
            success: false as const,
            message: `Access denied for servers: ${unauthorizedUuids.join(", ")}`,
          };
        }

        const healthInfos: ServerHealthInfo[] = serverUuids
          .map((uuid: string) => serverHealthService.getServerHealth(uuid))
          .filter(
            (info: ServerHealthInfo | undefined): info is ServerHealthInfo =>
              info !== undefined,
          );

        return {
          success: true as const,
          data: healthInfos,
          message: `Retrieved health status for ${healthInfos.length} server(s)`,
        };
      }

      const allHealth = serverHealthService.getAllServerHealth();

      return {
        success: true as const,
        data: allHealth,
        message: `Retrieved health status for ${allHealth.length} server(s)`,
      };
    } catch (error) {
      console.error("Error getting server health:", error);
      return {
        success: false as const,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  getSummary: async (
    _userId: string,
  ): Promise<z.infer<typeof GetHealthSummaryResponseSchema>> => {
    try {
      const summary = serverHealthService.getHealthSummary();

      return {
        success: true as const,
        data: summary,
        message: "Health summary retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting health summary:", error);
      return {
        success: false as const,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  startPeriodicChecks: async (): Promise<void> => {
    await serverHealthService.startPeriodicChecks();
  },

  stopPeriodicChecks: async (): Promise<void> => {
    serverHealthService.stopPeriodicChecks();
  },
};
