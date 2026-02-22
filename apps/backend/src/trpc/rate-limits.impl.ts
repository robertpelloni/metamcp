import {
  CreateRateLimitRequestSchema,
  CreateRateLimitResponseSchema,
  DeleteRateLimitRequestSchema,
  DeleteRateLimitResponseSchema,
  ListRateLimitsResponseSchema,
  UpdateRateLimitRequestSchema,
  UpdateRateLimitResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { rateLimitService } from "../lib/metamcp/rate-limit.service";
import { logError, wrapError, NotFoundError } from "../lib/errors";

export const rateLimitsImplementations = {
  list: async (userId?: string): Promise<z.infer<typeof ListRateLimitsResponseSchema>> => {
    try {
      const rules = await rateLimitService.listRules(userId);
      return {
        success: true,
        data: rules.map(r => ({
            ...r,
            created_at: new Date(), // DB returns date, but let's be safe
            updated_at: new Date()
        })),
      };
    } catch (error) {
      logError(error, "rateLimits.list");
      throw wrapError(error, "Failed to list rate limits");
    }
  },

  create: async (
    input: z.infer<typeof CreateRateLimitRequestSchema>,
    userId?: string
  ): Promise<z.infer<typeof CreateRateLimitResponseSchema>> => {
    try {
      // If user_id is provided in input, use it (admin override?), otherwise default to current user
      // Or maybe allow creating global rules if user is admin?
      // For now, let's assume current user context unless specific logic
      const targetUserId = input.user_id !== undefined ? input.user_id : userId;

      const rule = await rateLimitService.createRule(
        input.name,
        input.tool_pattern,
        input.max_requests,
        input.window_ms,
        targetUserId
      );

      return {
        success: true,
        data: {
            ...rule,
            created_at: new Date(),
            updated_at: new Date()
        },
      };
    } catch (error) {
      logError(error, "rateLimits.create", { input });
      throw wrapError(error, "Failed to create rate limit rule");
    }
  },

  update: async (
    input: z.infer<typeof UpdateRateLimitRequestSchema>
  ): Promise<z.infer<typeof UpdateRateLimitResponseSchema>> => {
    try {
      const updated = await rateLimitService.updateRule(input.uuid, {
        name: input.name,
        tool_pattern: input.tool_pattern,
        max_requests: input.max_requests,
        window_ms: input.window_ms,
        is_active: input.is_active,
      });

      return {
        success: true,
        data: {
            ...updated,
            created_at: new Date(),
            updated_at: new Date()
        },
      };
    } catch (error) {
      logError(error, "rateLimits.update", { uuid: input.uuid });
      throw wrapError(error, "Failed to update rate limit rule");
    }
  },

  delete: async (
    input: z.infer<typeof DeleteRateLimitRequestSchema>
  ): Promise<z.infer<typeof DeleteRateLimitResponseSchema>> => {
    try {
      const success = await rateLimitService.deleteRule(input.uuid);
      if (!success) {
        throw new NotFoundError("Rate Limit Rule", input.uuid);
      }
      return {
        success: true,
        message: "Rule deleted successfully",
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logError(error, "rateLimits.delete", { uuid: input.uuid });
      throw wrapError(error, "Failed to delete rate limit rule");
    }
  },
};
