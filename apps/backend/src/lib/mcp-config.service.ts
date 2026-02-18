import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { McpConfig, McpConfigSchema, McpConfigServer } from "@repo/zod-types";
import logger from "../utils/logger";
import { EventEmitter } from "events";
import { db } from "../db";
import { mcpServersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const CONFIG_FILE_NAME = "mcp.json";

export class McpConfigService extends EventEmitter {
    private configPath: string;
    private currentConfig: McpConfig | null = null;
    private watcher: any = null; // Typing FSWatcher is tricky with generic node types

    constructor() {
        super();
        // Locate mcp.json in the project root (2 levels up from backend/src/lib)
        // Adjust logic if needed: process.cwd() might be safer if running from project root
        this.configPath = path.resolve(process.cwd(), CONFIG_FILE_NAME);
        logger.info(`[McpConfigService] Config path: ${this.configPath}`);
    }

    async init() {
        await this.ensureConfigExists();
        await this.loadConfig();
        await this.importFromDatabase();
        this.watchConfig();
    }

    private async ensureConfigExists() {
        try {
            await fs.access(this.configPath);
        } catch {
            logger.info(
                `[McpConfigService] ${CONFIG_FILE_NAME} not found. Creating default.`
            );
            const defaultConfig: McpConfig = { mcpServers: {} };
            await fs.writeFile(
                this.configPath,
                JSON.stringify(defaultConfig, null, 2),
                "utf-8"
            );
        }
    }

    private async loadConfig() {
        try {
            const content = await fs.readFile(this.configPath, "utf-8");
            const json = JSON.parse(content);
            const parsed = McpConfigSchema.safeParse(json);

            if (!parsed.success) {
                logger.error(
                    `[McpConfigService] Invalid ${CONFIG_FILE_NAME}:`,
                    parsed.error
                );
                // Fallback to empty config if invalid, or throw? 
                // Creating a simplified default to prevent crashes, but logging strictly.
                // Or better: Throw so we don't accidentally overwrite a corrupted file with an empty one.
                throw new Error(`Invalid configuration file: ${parsed.error.message}`);
            }

            this.currentConfig = parsed.data;
            this.emit("updated", this.currentConfig);
            logger.info(`[McpConfigService] Loaded configuration.`);
        } catch (error) {
            logger.error(`[McpConfigService] Failed to load config:`, error);
            // If we can't load, we shouldn't proceed with operations that assume config exists
            throw error;
        }
    }

    private watchConfig() {
        // Simple polling watcher to avoid Chokidar dependency if not already present
        // Or use fs.watch (can be flaky across platforms, but decent for single files)
        (async () => {
            try {
                const watcher = fs.watch(this.configPath);
                for await (const event of watcher) {
                    if (event.eventType === "change") {
                        logger.info(`[McpConfigService] Config changed. Reloading...`);
                        try {
                            await this.loadConfig();
                        } catch (loadErr) {
                            logger.error(`[McpConfigService] Failed to reload config change:`, loadErr);
                        }
                    }
                }
            } catch (err) {
                if ((err as any).name === 'AbortError') return;
                logger.error("[McpConfigService] Watcher error:", err);
            }
        })();
    }

    getServers(): Record<string, McpConfigServer> {
        return this.currentConfig?.mcpServers || {};
    }

    getServer(key: string): McpConfigServer | undefined {
        return this.currentConfig?.mcpServers[key];
    }

    async addServer(key: string, server: McpConfigServer) {
        if (!this.currentConfig) await this.loadConfig();
        if (!this.currentConfig) throw new Error("Configuration not loaded");

        // Update memory
        this.currentConfig.mcpServers[key] = server;

        // Write to disk
        await this.saveConfig();
    }

    async updateServer(key: string, server: Partial<McpConfigServer>) {
        if (!this.currentConfig) await this.loadConfig();
        if (!this.currentConfig) throw new Error("Configuration not loaded");

        const existing = this.currentConfig.mcpServers[key];
        if (!existing) throw new Error(`Server ${key} not found`);

        this.currentConfig.mcpServers[key] = { ...existing, ...server };
        await this.saveConfig();
    }

    async removeServer(key: string) {
        if (!this.currentConfig) await this.loadConfig();
        delete this.currentConfig!.mcpServers[key];
        await this.saveConfig();
    }

    /**
     * Imports configuration from the database if the JSON config is empty.
     * This is a one-time migration for existing deployments.
     */
    private async importFromDatabase() {
        if (!this.currentConfig) return;

        // Only import if we have no servers defined in JSON
        if (Object.keys(this.currentConfig.mcpServers).length > 0) {
            return;
        }

        logger.info("[McpConfigService] JSON config is empty. Checking database for existing servers to import...");

        try {
            const dbServers = await db.select().from(mcpServersTable);

            if (dbServers.length === 0) {
                logger.info("[McpConfigService] No servers found in database. Starting with clean slate.");
                return;
            }

            logger.info(`[McpConfigService] Found ${dbServers.length} servers in database. Importing to JSON...`);

            for (const dbServer of dbServers) {
                // Convert DB Record to McpConfigServer
                const serverConfig: McpConfigServer = {
                    uuid: dbServer.uuid,
                    name: dbServer.name,
                    type: dbServer.type,
                    command: dbServer.command || undefined,
                    args: dbServer.args,
                    env: dbServer.env,
                    url: dbServer.url || undefined,
                    user_id: dbServer.user_id || undefined,
                    // Auto-disable chroma-knowledge if imported from DB to prevent startup crashes
                    enabled: dbServer.name !== "chroma-knowledge",
                };

                // Add to current config
                this.currentConfig.mcpServers[dbServer.name] = serverConfig;
            }

            // Save the updated config to disk
            await this.saveConfig();
            logger.info(`[McpConfigService] Successfully imported ${dbServers.length} servers from database.`);

        } catch (err) {
            logger.error("[McpConfigService] Failed to import from database:", err);
        }
    }

    private async saveConfig() {
        try {
            await fs.writeFile(
                this.configPath,
                JSON.stringify(this.currentConfig, null, 2),
                "utf-8"
            );
            // We don't need to emit here because the watcher will catch the change
            // UNLESS we want immediate feedback for the writer. 
            // Emitting manually is safer for UI responsiveness.
            this.emit("updated", this.currentConfig);
        } catch (error) {
            logger.error(`[McpConfigService] Failed to save config:`, error);
            throw error;
        }
    }

    /**
     * Syncs the JSON configuration to the database.
     * Use JSON as Source of Truth.
     */
    async syncWithDatabase() {
        if (!this.currentConfig) await this.loadConfig();

        logger.info("[McpConfigService] Syncing JSON config to Database...");

        const servers = this.getServers();

        // 1. Upsert all servers from JSON to DB
        for (const [key, config] of Object.entries(servers)) {
            try {
                // Ensure UUID exists in config (migration for old configs)
                if (!config.uuid) {
                    config.uuid = randomUUID();
                    await this.addServer(key, config); // Write back UUID to JSON
                }

                await db.insert(mcpServersTable).values({
                    uuid: config.uuid!,
                    name: config.name,
                    type: config.type,
                    command: config.command,
                    args: config.args,
                    env: config.env,
                    url: config.url,
                    user_id: config.user_id,
                    // Description isn't in JSON yet, preserve existing or null
                }).onConflictDoUpdate({
                    target: mcpServersTable.uuid,
                    set: {
                        name: config.name,
                        type: config.type,
                        command: config.command,
                        args: config.args,
                        env: config.env,
                        url: config.url,
                        user_id: config.user_id,
                    }
                });
            } catch (err) {
                logger.error(`[McpConfigService] Failed to sync server ${key} to DB:`, err);
            }
        }

        logger.info("[McpConfigService] Sync complete.");
    }
}

export const mcpConfigService = new McpConfigService();
