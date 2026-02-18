import {
  DatabaseMcpServer,
  McpServerCreateInput,
  McpServerErrorStatusEnum,
  McpServerUpdateInput,
  McpServerTypeEnum,
} from "@repo/zod-types";
import { z } from "zod";
import { randomUUID } from "crypto";

import logger from "@/utils/logger";
import { mcpConfigService } from "../../lib/mcp-config.service";
import { db } from "../index";
import { mcpServersTable } from "../schema";
import { eq } from "drizzle-orm";

// Helper to convert JSON config to DatabaseMcpServer shape
function toDatabaseMcpServer(
  key: string,
  config: any
): DatabaseMcpServer {
  return {
    uuid: config.uuid || randomUUID(),
    name: config.name || key,
    description: null,
    type: config.type as z.infer<typeof McpServerTypeEnum>,
    command: config.command || null,
    args: config.args || [],
    env: config.env || {},
    url: config.url || null,
    error_status: McpServerErrorStatusEnum.Enum.NONE,
    created_at: new Date(),
    bearerToken: null,
    headers: {},
    user_id: config.user_id || null,
  };
}

export class McpServersRepository {
  async create(input: McpServerCreateInput): Promise<DatabaseMcpServer> {
    const servers = mcpConfigService.getServers();
    if (servers[input.name]) {
      throw new Error(`Server name "${input.name}" already exists.`);
    }

    const uuid = randomUUID();
    const newServer = {
      uuid,
      name: input.name,
      type: input.type,
      command: input.command || undefined,
      args: input.args || [],
      env: input.env || {},
      url: input.url || undefined,
      enabled: true,
      user_id: input.user_id || undefined,
    };

    // 1. Write to JSON (Source of Truth for Config)
    await mcpConfigService.addServer(input.name, newServer);

    // 2. Write to DB (Mirror for Relations/FKs)
    try {
      await db.insert(mcpServersTable).values({
        uuid,
        name: input.name,
        type: input.type,
        command: input.command,
        args: input.args || [],
        env: input.env || {},
        url: input.url,
        user_id: input.user_id,
        description: input.description,
      });
    } catch (dbError) {
      logger.error("Failed to mirror MCP server to DB:", dbError);
      // We don't rollback JSON because JSON is source of truth. 
      // User might need to run a sync script later if DB fails.
    }

    return toDatabaseMcpServer(input.name, newServer);
  }

  async findAll(): Promise<DatabaseMcpServer[]> {
    const servers = mcpConfigService.getServers();
    return Object.entries(servers).map(([key, config]) =>
      toDatabaseMcpServer(key, config)
    );
  }

  async findAllAccessibleToUser(userId: string): Promise<DatabaseMcpServer[]> {
    // For now, return all servers from JSON.
    // In future, filter by user_id if present in JSON
    const servers = mcpConfigService.getServers();
    return Object.entries(servers)
      .map(([key, config]) => toDatabaseMcpServer(key, config))
      .filter(s => !s.user_id || s.user_id === userId);
  }

  async findPublicServers(): Promise<DatabaseMcpServer[]> {
    const servers = mcpConfigService.getServers();
    return Object.entries(servers)
      .map(([key, config]) => toDatabaseMcpServer(key, config))
      .filter(s => !s.user_id);
  }

  async findByUserId(userId: string): Promise<DatabaseMcpServer[]> {
    const servers = mcpConfigService.getServers();
    return Object.entries(servers)
      .map(([key, config]) => toDatabaseMcpServer(key, config))
      .filter(s => s.user_id === userId);
  }

  async findByUuid(uuid: string): Promise<DatabaseMcpServer | undefined> {
    const servers = mcpConfigService.getServers();
    const entry = Object.entries(servers).find(([_, config]) => config.uuid === uuid);
    if (!entry) return undefined;
    return toDatabaseMcpServer(entry[0], entry[1]);
  }

  async findByName(name: string): Promise<DatabaseMcpServer | undefined> {
    const server = mcpConfigService.getServer(name);
    if (!server) return undefined;
    return toDatabaseMcpServer(name, server);
  }

  async findByNameAndUserId(
    name: string,
    userId: string | null
  ): Promise<DatabaseMcpServer | undefined> {
    return this.findByName(name);
  }

  async deleteByUuid(uuid: string): Promise<DatabaseMcpServer | undefined> {
    const server = await this.findByUuid(uuid);
    if (!server) return undefined;

    // 1. Remove from JSON
    await mcpConfigService.removeServer(server.name);

    // 2. Remove from DB (Cascades to Tools)
    try {
      await db.delete(mcpServersTable).where(eq(mcpServersTable.uuid, uuid));
    } catch (dbError) {
      logger.error("Failed to remove MCP server from DB:", dbError);
    }

    return server;
  }

  async update(
    input: McpServerUpdateInput
  ): Promise<DatabaseMcpServer | undefined> {
    const server = await this.findByUuid(input.uuid);
    if (!server) return undefined;

    const newName = input.name || server.name;

    // Rename handling
    if (input.name && input.name !== server.name) {
      const existingParams = mcpConfigService.getServer(server.name)!;
      await mcpConfigService.removeServer(server.name);
      await mcpConfigService.addServer(newName, { ...existingParams, name: newName });
    }

    const updates: any = {};
    if (input.type) updates.type = input.type;
    if (input.command !== undefined) updates.command = input.command || undefined;
    if (input.args) updates.args = input.args;
    if (input.env) updates.env = input.env;
    if (input.url !== undefined) updates.url = input.url || undefined;

    // 1. Update JSON
    await mcpConfigService.updateServer(newName, updates);

    // 2. Update DB
    try {
      // filtering out undefined values for DB update is handled by Drizzle usually?
      // better to be explicit
      const dbUpdates: any = {};
      if (input.name) dbUpdates.name = input.name;
      if (input.type) dbUpdates.type = input.type;
      if (input.command !== undefined) dbUpdates.command = input.command;
      if (input.args) dbUpdates.args = input.args;
      if (input.env) dbUpdates.env = input.env;
      if (input.url !== undefined) dbUpdates.url = input.url;
      if (input.description !== undefined) dbUpdates.description = input.description;

      await db.update(mcpServersTable)
        .set(dbUpdates)
        .where(eq(mcpServersTable.uuid, input.uuid));
    } catch (dbError) {
      logger.error("Failed to update MCP server in DB:", dbError);
    }

    return this.findByName(newName);
  }

  async bulkCreate(
    servers: McpServerCreateInput[]
  ): Promise<DatabaseMcpServer[]> {
    const results: DatabaseMcpServer[] = [];
    for (const serverInput of servers) {
      const created = await this.create(serverInput);
      results.push(created);
    }
    return results;
  }

  async updateServerErrorStatus(input: {
    serverUuid: string;
    errorStatus: z.infer<typeof McpServerErrorStatusEnum>;
  }) {
    // Only update DB for status, as JSON config is static
    try {
      await db.update(mcpServersTable)
        .set({ error_status: input.errorStatus })
        .where(eq(mcpServersTable.uuid, input.serverUuid));
    } catch (e) { /* ignore */ }

    return this.findByUuid(input.serverUuid);
  }
}

export const mcpServersRepository = new McpServersRepository();
