import { z } from "zod";

export const RateLimitRuleSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  tool_pattern: z.string(),
  max_requests: z.number(),
  window_ms: z.number(),
  user_id: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
});

export const ListRateLimitsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(RateLimitRuleSchema),
});

export const CreateRateLimitRequestSchema = z.object({
  name: z.string().min(1),
  tool_pattern: z.string().min(1),
  max_requests: z.number().int().min(1),
  window_ms: z.number().int().min(1000), // Min 1s
  user_id: z.string().optional().nullable(),
});

export const CreateRateLimitResponseSchema = z.object({
  success: z.boolean(),
  data: RateLimitRuleSchema,
});

export const UpdateRateLimitRequestSchema = z.object({
  uuid: z.string(),
  name: z.string().optional(),
  tool_pattern: z.string().optional(),
  max_requests: z.number().int().optional(),
  window_ms: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const UpdateRateLimitResponseSchema = z.object({
  success: z.boolean(),
  data: RateLimitRuleSchema,
});

export const DeleteRateLimitRequestSchema = z.object({
  uuid: z.string(),
});

export const DeleteRateLimitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;
