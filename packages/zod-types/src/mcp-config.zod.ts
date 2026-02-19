import { z } from "zod";
import { McpServerTypeEnum } from "./mcp-servers.zod";

export const McpConfigServerSchema = z.object({
    uuid: z.string().optional(), // Optional in input, but we should persist it
    name: z.string().min(1, "Name is required"),
    type: McpServerTypeEnum.default(McpServerTypeEnum.Enum.STDIO),
    command: z.string().optional(),
    args: z.array(z.string()).default([]),
    env: z.record(z.string()).default({}),
    url: z.string().optional(),
    enabled: z.boolean().default(true),
    user_id: z.string().optional(), // Added user_id for DB compatibility
});

export type McpConfigServer = z.infer<typeof McpConfigServerSchema>;

export const McpConfigSchema = z.object({
    mcpServers: z.record(McpConfigServerSchema).default({}),
});

export type McpConfig = z.infer<typeof McpConfigSchema>;
