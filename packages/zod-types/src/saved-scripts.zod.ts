import { z } from "zod";

export const SavedScriptSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  code: z.string(),
  userId: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const GetSavedScriptsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(SavedScriptSchema),
});

export const DeleteSavedScriptRequestSchema = z.object({
  uuid: z.string(),
});

export const DeleteSavedScriptResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const CreateSavedScriptRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  code: z.string().min(1),
});

export const CreateSavedScriptResponseSchema = z.object({
  success: z.literal(true),
  data: SavedScriptSchema,
});

export const UpdateSavedScriptRequestSchema = z.object({
  uuid: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  code: z.string().optional(),
});

export const UpdateSavedScriptResponseSchema = z.object({
  success: z.literal(true),
  data: SavedScriptSchema,
});

export const RunSavedScriptRequestSchema = z.object({
  uuid: z.string(),
});

export const RunSavedScriptResponseSchema = z.object({
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
});

export type SavedScript = z.infer<typeof SavedScriptSchema>;
