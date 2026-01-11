import { z } from "zod";

export const DiscoverySourceTypeEnum = z.enum([
  "claude_desktop",
  "cursor",
  "vscode",
  "project_mcp",
  "custom",
]);

export type DiscoverySourceType = z.infer<typeof DiscoverySourceTypeEnum>;

export const DiscoveryStatusEnum = z.enum([
  "found",
  "not_found",
  "invalid",
  "permission_denied",
]);

export type DiscoveryStatus = z.infer<typeof DiscoveryStatusEnum>;

export const DiscoveredServerSchema = z.object({
  name: z.string(),
  type: z.enum(["STDIO", "SSE"]),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  alreadyRegistered: z.boolean(),
  existingUuid: z.string().optional(),
});

export type DiscoveredServer = z.infer<typeof DiscoveredServerSchema>;

export const DiscoverySourceResultSchema = z.object({
  sourceType: DiscoverySourceTypeEnum,
  path: z.string(),
  status: DiscoveryStatusEnum,
  servers: z.array(DiscoveredServerSchema).default([]),
  error: z.string().optional(),
  lastModified: z.date().optional(),
});

export type DiscoverySourceResult = z.infer<typeof DiscoverySourceResultSchema>;

export const DiscoveryScanResultSchema = z.object({
  scannedAt: z.date(),
  sources: z.array(DiscoverySourceResultSchema),
  totalDiscovered: z.number(),
  newServers: z.number(),
  existingServers: z.number(),
});

export type DiscoveryScanResult = z.infer<typeof DiscoveryScanResultSchema>;

export const ScanForConfigsRequestSchema = z.object({
  sources: z.array(DiscoverySourceTypeEnum).optional(),
  customPaths: z.array(z.string()).optional(),
  includeDetails: z.boolean().default(true),
});

export type ScanForConfigsRequest = z.infer<typeof ScanForConfigsRequestSchema>;

export const ScanForConfigsResponseSchema = z.object({
  success: z.boolean(),
  result: DiscoveryScanResultSchema.optional(),
  error: z.string().optional(),
});

export type ScanForConfigsResponse = z.infer<
  typeof ScanForConfigsResponseSchema
>;

export const ImportDiscoveredServersRequestSchema = z.object({
  serverNames: z.array(z.string()).min(1, "At least one server required"),
  sourcePath: z.string(),
  skipExisting: z.boolean().default(true),
});

export type ImportDiscoveredServersRequest = z.infer<
  typeof ImportDiscoveredServersRequestSchema
>;

export const ImportDiscoveredServersResponseSchema = z.object({
  success: z.boolean(),
  imported: z.number(),
  skipped: z.array(z.string()),
  error: z.string().optional(),
});

export type ImportDiscoveredServersResponse = z.infer<
  typeof ImportDiscoveredServersResponseSchema
>;

export const GetDiscoveryPathsRequestSchema = z.object({
  platform: z.enum(["win32", "darwin", "linux"]).optional(),
});

export type GetDiscoveryPathsRequest = z.infer<
  typeof GetDiscoveryPathsRequestSchema
>;

export const GetDiscoveryPathsResponseSchema = z.object({
  paths: z.array(
    z.object({
      sourceType: DiscoverySourceTypeEnum,
      path: z.string(),
      description: z.string(),
    }),
  ),
  platform: z.string(),
});

export type GetDiscoveryPathsResponse = z.infer<
  typeof GetDiscoveryPathsResponseSchema
>;

export const AddCustomPathRequestSchema = z.object({
  path: z.string().min(1, "Path is required"),
  label: z.string().optional(),
});

export type AddCustomPathRequest = z.infer<typeof AddCustomPathRequestSchema>;

export const AddCustomPathResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
  error: z.string().optional(),
});

export type AddCustomPathResponse = z.infer<typeof AddCustomPathResponseSchema>;
