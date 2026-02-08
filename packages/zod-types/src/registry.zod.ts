import { z } from "zod";

export const TemplateEnvSchema = z.object({
  description: z.string(),
  required: z.boolean(),
});

export const ServerTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  packageName: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(TemplateEnvSchema),
  matchUrlPattern: z.string(),
});

export const RegistryItemSchema = z.object({
  url: z.string(),
  name: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
  sources: z.array(z.string()),
  template: ServerTemplateSchema.optional(),
});

export const ListRegistryRequestSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

export const RegistryListResponseSchema = z.object({
  items: z.array(RegistryItemSchema),
  total: z.number(),
});

export const GetCategoriesResponseSchema = z.array(z.string());
