<<<<<<< HEAD
import * as fs from "fs";
import * as path from "path";
import {
  ClaudeDesktopConfig,
  ClaudeServerDefinition,
  DatabaseMcpServer,
  McpServerCreateInput,
  McpServerTypeEnum,
  isSseServer,
  isStdioServer,
  validateClaudeDesktopConfig,
} from "@repo/zod-types";

import { mcpServersRepository, namespaceMappingsRepository } from "../../db/repositories";
import logger from "../../utils/logger";
import { metaMcpServerPool } from "./metamcp-server-pool";
import { clearOverrideCache } from "./metamcp-middleware/tool-overrides.functional";
import { mcpServerPool } from "./mcp-server-pool";
import { convertDbServerToParams } from "./utils";

const MANAGED_DESCRIPTION_PREFIX = "[managed:mcp.json]";

type DesiredServerConfig = {
  name: string;
  type: "STDIO" | "SSE";
  command: string | null;
  args: string[];
  env: Record<string, string>;
  url: string | null;
  headers: Record<string, string>;
  description: string;
};

function normalizeServerName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function isManagedByMcpJson(server: DatabaseMcpServer): boolean {
  return Boolean(
    server.description?.startsWith(MANAGED_DESCRIPTION_PREFIX) &&
      server.user_id === null,
  );
}

function toDesiredServer(
  originalName: string,
  definition: ClaudeServerDefinition,
): DesiredServerConfig {
  const name = normalizeServerName(originalName);
  const description = `${MANAGED_DESCRIPTION_PREFIX} ${originalName}`;

  if (isStdioServer(definition)) {
    return {
      name,
      type: McpServerTypeEnum.Enum.STDIO,
      command: definition.command,
      args: definition.args ?? [],
      env: definition.env ?? {},
      url: null,
      headers: {},
      description,
    };
  }

  if (isSseServer(definition)) {
    return {
      name,
      type: McpServerTypeEnum.Enum.SSE,
      command: null,
      args: [],
      env: {},
      url: definition.url,
      headers: definition.headers ?? {},
      description,
    };
  }

  throw new Error(`Unsupported MCP server definition for ${originalName}`);
}

function areStringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function areRecordValuesEqual(
  left: Record<string, string>,
  right: Record<string, string>,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();

  if (!areStringArraysEqual(leftKeys, rightKeys)) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

function needsUpdate(
  existing: DatabaseMcpServer,
  desired: DesiredServerConfig,
): boolean {
  return !(
    existing.type === desired.type &&
    (existing.command ?? null) === desired.command &&
    areStringArraysEqual(existing.args ?? [], desired.args) &&
    areRecordValuesEqual(existing.env ?? {}, desired.env) &&
    (existing.url ?? null) === desired.url &&
    areRecordValuesEqual(existing.headers ?? {}, desired.headers) &&
    (existing.description ?? "") === desired.description
  );
}
=======
import { McpConfig } from "@repo/zod-types";
import logger from "@/utils/logger";
import { mcpConfigService } from "../mcp-config.service";
>>>>>>> fix/detached-head-recovery

/**
 * Keeps project-root mcp.json synchronized with DB-backed public MCP servers.
 *
<<<<<<< HEAD
 * Why this exists:
 * - The UI should reflect mcp.json changes without manual import actions.
 * - We debounce and serialize sync operations so editor save bursts do not race.
 */
export class McpJsonHotReloadService {
  private readonly configPath: string;
  private readonly watchIntervalMs: number;
  private readonly debounceMs: number;
  private watcherEnabled = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private syncInFlight = false;
  private pendingSync = false;

  constructor(configPath?: string, watchIntervalMs: number = 1000) {
    this.configPath = configPath ?? path.join(process.cwd(), "mcp.json");
    this.watchIntervalMs = watchIntervalMs;
    this.debounceMs = 250;
  }

  /**
   * Startup entrypoint used by backend initialization flow.
   */
  async initialize(): Promise<void> {
    await this.syncFromDisk("startup");
    this.enableWatcher();
  }

  stop(): void {
    if (!this.watcherEnabled) {
      return;
    }

    fs.unwatchFile(this.configPath, this.handleFileChange);
    this.watcherEnabled = false;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private enableWatcher(): void {
    if (this.watcherEnabled) {
      return;
    }

    // watchFile tolerates file create/delete cycles and is stable across platforms.
    fs.watchFile(
      this.configPath,
      { interval: this.watchIntervalMs },
      this.handleFileChange,
    );
    this.watcherEnabled = true;

    console.log(`Watching MCP config for changes: ${this.configPath}`);
  }

  private handleFileChange = (current: fs.Stats, previous: fs.Stats): void => {
    // Trigger on content changes and create/delete events.
    if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
      return;
    }

    this.scheduleSync("file-change");
  };

  private scheduleSync(reason: "startup" | "file-change"): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncFromDisk(reason).catch((error) => {
        console.error("Failed to synchronize mcp.json:", error);
      });
    }, this.debounceMs);
  }

  private async syncFromDisk(reason: "startup" | "file-change"): Promise<void> {
    if (this.syncInFlight) {
      this.pendingSync = true;
      return;
    }

    this.syncInFlight = true;
    try {
      const desiredServers = await this.readDesiredServers();
      const result = await this.reconcileServers(desiredServers);

      console.log(
        `[mcp.json ${reason}] synced: created=${result.created}, updated=${result.updated}, removed=${result.removed}`,
      );
    } finally {
      this.syncInFlight = false;
      if (this.pendingSync) {
        this.pendingSync = false;
        await this.syncFromDisk("file-change");
      }
    }
  }

  private async readDesiredServers(): Promise<Map<string, DesiredServerConfig>> {
    try {
      await fs.promises.access(this.configPath, fs.constants.F_OK);
    } catch {
      // Missing file means desired state is empty; managed entries are removed.
      return new Map();
    }

    const fileContent = await fs.promises.readFile(this.configPath, "utf-8");
    const validation = validateClaudeDesktopConfig(fileContent);

    if (!validation.valid) {
      const details = validation.errors
        ?.map((error: { message: string }) => error.message)
        .join("; ");
      throw new Error(`Invalid mcp.json format: ${details || "unknown error"}`);
    }

    const config = validation.data as ClaudeDesktopConfig;
    const desired = new Map<string, DesiredServerConfig>();

    for (const [serverName, definition] of Object.entries(config.mcpServers)) {
      desired.set(serverName, toDesiredServer(serverName, definition));
    }

    return desired;
  }

  private async reconcileServers(
    desiredMap: Map<string, DesiredServerConfig>,
  ): Promise<{ created: number; updated: number; removed: number }> {
    const allServers = await mcpServersRepository.findAll();
    const publicServersByName = new Map<string, DatabaseMcpServer>();

    for (const server of allServers) {
      if (server.user_id === null) {
        publicServersByName.set(server.name, server);
      }
    }

    let created = 0;
    let updated = 0;
    let removed = 0;
    const changedServerUuids = new Set<string>();

    // Create/update desired servers from current mcp.json content.
    for (const desired of desiredMap.values()) {
      const existing = publicServersByName.get(desired.name);
      if (!existing) {
        const createInput: McpServerCreateInput = {
          name: desired.name,
          description: desired.description,
          type: desired.type,
          command: desired.command,
          args: desired.args,
          env: desired.env,
          url: desired.url,
          headers: desired.headers,
          user_id: null,
        };

        const createdServer = await mcpServersRepository.create(createInput);
        created += 1;

        const params = await convertDbServerToParams(createdServer);
        if (params) {
          await mcpServerPool.ensureIdleSessionForNewServer(
            createdServer.uuid,
            params,
          );
        }
        publicServersByName.set(createdServer.name, createdServer);
        changedServerUuids.add(createdServer.uuid);
        continue;
      }

      const shouldManage = isManagedByMcpJson(existing);
      if (!shouldManage) {
        // Respect manually managed public entries with matching names.
        continue;
      }

      if (!needsUpdate(existing, desired)) {
        continue;
      }

      const updatedServer = await mcpServersRepository.update({
        uuid: existing.uuid,
        description: desired.description,
        type: desired.type,
        command: desired.command,
        args: desired.args,
        env: desired.env,
        url: desired.url,
        headers: desired.headers,
        user_id: null,
      });

      updated += 1;

      if (updatedServer) {
        const params = await convertDbServerToParams(updatedServer);
        if (params) {
          await mcpServerPool.invalidateIdleSession(existing.uuid, params);
        }
        publicServersByName.set(updatedServer.name, updatedServer);
        changedServerUuids.add(updatedServer.uuid);
      }
    }

    // Remove managed servers that no longer exist in mcp.json.
    const desiredNames = new Set(Array.from(desiredMap.values()).map((s) => s.name));
    for (const server of allServers) {
      if (!isManagedByMcpJson(server)) {
        continue;
      }

      if (desiredNames.has(server.name)) {
        continue;
      }

      await mcpServerPool.cleanupIdleSession(server.uuid);
      await mcpServersRepository.deleteByUuid(server.uuid);
      removed += 1;
      changedServerUuids.add(server.uuid);
    }

    if (changedServerUuids.size > 0) {
      await this.invalidateAffectedNamespaces(Array.from(changedServerUuids));
    }

    return { created, updated, removed };
  }

  /**
   * Refresh namespace-level pools and override caches impacted by server changes.
   */
  private async invalidateAffectedNamespaces(
    changedServerUuids: string[],
  ): Promise<void> {
    const affectedNamespaceUuids = new Set<string>();

    for (const serverUuid of changedServerUuids) {
      const namespaces =
        await namespaceMappingsRepository.findNamespacesByServerUuid(serverUuid);
      for (const namespaceUuid of namespaces) {
        affectedNamespaceUuids.add(namespaceUuid);
      }
    }

    if (affectedNamespaceUuids.size === 0) {
      return;
    }

    const namespaces = Array.from(affectedNamespaceUuids);

    await Promise.allSettled([
      metaMcpServerPool.invalidateIdleServers(namespaces),
      metaMcpServerPool.invalidateOpenApiSessions(namespaces),
    ]);

    for (const namespaceUuid of namespaces) {
      clearOverrideCache(namespaceUuid);
    }

    logger.info(
      `[mcp.json] invalidated ${namespaces.length} affected namespace session(s)`,
    );
=======
 * This service controls the "Hot Reload" feature by listening to 
 * McpConfigService updates and triggering a DB sync.
 */
export class McpJsonHotReloadService {
  async initialize() {
    logger.info("[McpJsonHotReloadService] Initializing via McpConfigService...");

    // Listen for updates from McpConfigService (which watches the file)
    mcpConfigService.on("updated", async (config: McpConfig) => {
      logger.info("[McpJsonHotReloadService] Config updated, syncing to DB...");
      try {
        await mcpConfigService.syncWithDatabase();
      } catch (err) {
        logger.error("[McpJsonHotReloadService] Failed to sync with database:", err);
      }
    });

    // We don't need to do an initial sync here because startup.ts 
    // explicitly calls mcpConfigService.syncWithDatabase() on boot.
>>>>>>> fix/detached-head-recovery
  }
}

export const mcpJsonHotReloadService = new McpJsonHotReloadService();
