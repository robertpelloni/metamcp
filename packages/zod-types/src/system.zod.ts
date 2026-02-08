import { z } from "zod";

export const SubmoduleSchema = z.object({
  name: z.string(),
  path: z.string(),
  url: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
});

export const SystemInfoSchema = z.object({
  version: z.string(),
  buildDate: z.string(),
  nodeVersion: z.string(),
  platform: z.string(),
  submodules: z.array(SubmoduleSchema),
  changelogSnippet: z.string().optional(),
});

export const GetSystemInfoResponseSchema = SystemInfoSchema;
