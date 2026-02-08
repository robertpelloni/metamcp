import { z } from "zod";

export const AuditLogSchema = z.object({
  uuid: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  details: z.record(z.any()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.string(),
});

export const ListAuditLogsRequestSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  userId: z.string().optional(),
  action: z.string().optional(),
});

export const AuditLogListResponseSchema = z.object({
  items: z.array(AuditLogSchema),
  total: z.number(),
});
