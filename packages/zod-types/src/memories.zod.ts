import { z } from "zod";

export const MemorySchema = z.object({
  uuid: z.string().uuid(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  user_id: z.string(),
  agent_id: z.string().nullable().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ListMemoriesRequestSchema = z.object({
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

export const SearchMemoriesRequestSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(5),
});

export const CreateMemoryRequestSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const DeleteMemoryRequestSchema = z.object({
  uuid: z.string().uuid(),
});

export const MemoryListResponseSchema = z.array(MemorySchema);
export const MemorySearchResponseSchema = z.array(
  MemorySchema.extend({
    similarity: z.number().optional(),
  })
);
