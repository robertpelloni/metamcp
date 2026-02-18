import {
  CancelReconnectionRequestSchema,
  CancelReconnectionResponseSchema,
  ConfigureReconnectionRequestSchema,
  ConfigureReconnectionResponseSchema,
  GetReconnectionStateRequestSchema,
  GetReconnectionStateResponseSchema,
  GetReconnectionSummaryResponseSchema,
  SetReconnectionEnabledRequestSchema,
  SetReconnectionEnabledResponseSchema,
  TriggerReconnectionRequestSchema,
  TriggerReconnectionResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { mcpServersRepository } from "../db/repositories";
import { autoReconnectService } from "../lib/metamcp/auto-reconnect.service";

export const autoReconnectImplementations = {
  triggerReconnection: async (
    input: z.infer<typeof TriggerReconnectionRequestSchema>,
    userId: string,
  ): Promise<z.infer<typeof TriggerReconnectionResponseSchema>> => {
    try {
      const server = await mcpServersRepository.findByUuid(input.serverUuid);
      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const accessibleServers =
        await mcpServersRepository.findAllAccessibleToUser(userId);
      const isAccessible = accessibleServers.some(
        (s) => s.uuid === input.serverUuid,
      );

      if (!isAccessible) {
        return {
          success: false,
          message: "Access denied for this server",
        };
      }

      const result = await autoReconnectService.triggerReconnection(
        input.serverUuid,
      );

      return {
        success: result.success,
        data: {
          serverUuid: result.serverUuid,
          success: result.success,
          attempt: result.attempt,
          error: result.error,
          reconnectedAt: result.reconnectedAt,
        },
        message: result.success
          ? "Reconnection successful"
          : `Reconnection failed: ${result.error ?? "Unknown error"}`,
      };
    } catch (error) {
      console.error("Error triggering reconnection:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  cancelReconnection: async (
    input: z.infer<typeof CancelReconnectionRequestSchema>,
    userId: string,
  ): Promise<z.infer<typeof CancelReconnectionResponseSchema>> => {
    try {
      if (input.cancelAll) {
        autoReconnectService.cancelAllReconnections();
        return {
          success: true,
          message: "All reconnection attempts cancelled",
        };
      }

      if (input.serverUuid) {
        const accessibleServers =
          await mcpServersRepository.findAllAccessibleToUser(userId);
        const isAccessible = accessibleServers.some(
          (s) => s.uuid === input.serverUuid,
        );

        if (!isAccessible) {
          return {
            success: false,
            message: "Access denied for this server",
          };
        }

        autoReconnectService.cancelReconnection(input.serverUuid);
        return {
          success: true,
          message: `Reconnection cancelled for server ${input.serverUuid}`,
        };
      }

      return {
        success: false,
        message: "Either serverUuid or cancelAll must be specified",
      };
    } catch (error) {
      console.error("Error cancelling reconnection:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  getState: async (
    input: z.infer<typeof GetReconnectionStateRequestSchema>,
    userId: string,
  ): Promise<z.infer<typeof GetReconnectionStateResponseSchema>> => {
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
            success: false,
            message: `Access denied for servers: ${unauthorizedUuids.join(", ")}`,
          };
        }

        const states = serverUuids
          .map((uuid: string) => autoReconnectService.getReconnectionState(uuid))
          .filter((state): state is NonNullable<typeof state> => state !== undefined)
          .map((state) => ({
            serverUuid: state.serverUuid,
            serverName: state.serverName,
            status: state.status,
            currentAttempt: state.currentAttempt,
            maxAttempts: state.maxAttempts,
            nextRetryAt: state.nextRetryAt?.toISOString() ?? null,
            lastAttemptAt: state.lastAttemptAt?.toISOString() ?? null,
            lastError: state.lastError,
            totalAttempts: state.totalAttempts,
            successfulReconnections: state.successfulReconnections,
          }));

        return {
          success: true,
          data: states,
          message: `Retrieved reconnection state for ${states.length} server(s)`,
        };
      }

      const allStates = autoReconnectService
        .getAllReconnectionStates()
        .map((state) => ({
          serverUuid: state.serverUuid,
          serverName: state.serverName,
          status: state.status,
          currentAttempt: state.currentAttempt,
          maxAttempts: state.maxAttempts,
          nextRetryAt: state.nextRetryAt?.toISOString() ?? null,
          lastAttemptAt: state.lastAttemptAt?.toISOString() ?? null,
          lastError: state.lastError,
          totalAttempts: state.totalAttempts,
          successfulReconnections: state.successfulReconnections,
        }));

      return {
        success: true,
        data: allStates,
        message: `Retrieved reconnection state for ${allStates.length} server(s)`,
      };
    } catch (error) {
      console.error("Error getting reconnection state:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  getSummary: async (
    _userId: string,
  ): Promise<z.infer<typeof GetReconnectionSummaryResponseSchema>> => {
    try {
      const summary = autoReconnectService.getReconnectionSummary();

      return {
        success: true,
        data: summary,
        message: "Reconnection summary retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting reconnection summary:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  configure: async (
    input: z.infer<typeof ConfigureReconnectionRequestSchema>,
    _userId: string,
  ): Promise<z.infer<typeof ConfigureReconnectionResponseSchema>> => {
    try {
      autoReconnectService.configure(input.config);
      const currentConfig = autoReconnectService.getConfig();

      return {
        success: true,
        data: currentConfig,
        message: "Auto-reconnection configured successfully",
      };
    } catch (error) {
      console.error("Error configuring auto-reconnection:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },

  setEnabled: async (
    input: z.infer<typeof SetReconnectionEnabledRequestSchema>,
    _userId: string,
  ): Promise<z.infer<typeof SetReconnectionEnabledResponseSchema>> => {
    try {
      autoReconnectService.setEnabled(input.enabled);

      return {
        success: true,
        enabled: input.enabled,
        message: `Auto-reconnection ${input.enabled ? "enabled" : "disabled"}`,
      };
    } catch (error) {
      console.error("Error setting auto-reconnection enabled:", error);
      return {
        success: false,
        enabled: autoReconnectService.isAutoReconnectEnabled(),
        message:
          error instanceof Error ? error.message : "Internal server error",
      };
    }
  },
};
