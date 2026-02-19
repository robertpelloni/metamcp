import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ClaudeDesktopConfig, DatabaseMcpServer } from "@repo/zod-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/repositories", () => ({
  mcpServersRepository: {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteByUuid: vi.fn(),
  },
  namespaceMappingsRepository: {
    findNamespacesByServerUuid: vi.fn(),
  },
}));

vi.mock("../../utils/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./metamcp-server-pool", () => ({
  metaMcpServerPool: {
    invalidateIdleServers: vi.fn(),
    invalidateOpenApiSessions: vi.fn(),
  },
}));

vi.mock("./metamcp-middleware/tool-overrides.functional", () => ({
  clearOverrideCache: vi.fn(),
}));

vi.mock("./mcp-server-pool", () => ({
  mcpServerPool: {
    ensureIdleSessionForNewServer: vi.fn(),
    invalidateIdleSession: vi.fn(),
    cleanupIdleSession: vi.fn(),
  },
}));

vi.mock("./utils", () => ({
  convertDbServerToParams: vi.fn(),
}));

import {
  buildDesiredServerMapFromConfig,
  McpJsonHotReloadService,
} from "./mcp-json-hot-reload.service";
import {
  mcpServersRepository,
  namespaceMappingsRepository,
} from "../../db/repositories";
import logger from "../../utils/logger";
import { metaMcpServerPool } from "./metamcp-server-pool";
import { clearOverrideCache } from "./metamcp-middleware/tool-overrides.functional";
import { mcpServerPool } from "./mcp-server-pool";
import { convertDbServerToParams } from "./utils";

type DesiredServerForTest = {
  name: string;
  type: "STDIO" | "SSE";
  command: string | null;
  args: string[];
  env: Record<string, string>;
  url: string | null;
  headers: Record<string, string>;
  description: string;
};

type HotReloadServiceTestAccess = {
  readDesiredServers: () => Promise<Map<string, DesiredServerForTest>>;
  invalidateAffectedNamespaces: (changedServerUuids: string[]) => Promise<void>;
  scheduleSync: (reason: "startup" | "file-change") => void;
  handleFileChange: (current: fs.Stats, previous: fs.Stats) => void;
  syncFromDisk: (reason: "startup" | "file-change") => Promise<void>;
  watcherEnabled: boolean;
  reconcileServers: (
    desiredMap: Map<string, DesiredServerForTest>,
  ) => Promise<{ created: number; updated: number; removed: number }>;
};

function createTempConfigPath(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-json-hot-reload-"));
  return path.join(tempDir, "mcp.json");
}

function getTestAccess(
  service: McpJsonHotReloadService,
): HotReloadServiceTestAccess {
  return service as unknown as HotReloadServiceTestAccess;
}

describe("McpJsonHotReloadService readDesiredServers", () => {
  const tempConfigPaths: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const configPath of tempConfigPaths) {
      const dir = path.dirname(configPath);
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempConfigPaths.length = 0;
  });

  it("returns empty desired map when mcp.json does not exist", async () => {
    const configPath = createTempConfigPath();
    tempConfigPaths.push(configPath);

    const service = new McpJsonHotReloadService(configPath);
    const testAccess = getTestAccess(service);

    const desired = await testAccess.readDesiredServers();

    expect(desired.size).toBe(0);
  });

  it("parses valid stdio and sse servers into desired map", async () => {
    const configPath = createTempConfigPath();
    tempConfigPaths.push(configPath);

    const validConfig = {
      mcpServers: {
        "alpha-server": {
          command: "node",
          args: ["server.js"],
          env: {
            NODE_ENV: "test",
          },
        },
        "beta-server": {
          url: "http://localhost:8123/sse",
          headers: {
            Authorization: "Bearer token",
          },
        },
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2), "utf-8");

    const service = new McpJsonHotReloadService(configPath);
    const testAccess = getTestAccess(service);

    const desired = await testAccess.readDesiredServers();
    const alpha = desired.get("alpha-server");
    const beta = desired.get("beta-server");

    expect(desired.size).toBe(2);
    expect(alpha?.name).toBe("alpha-server");
    expect(alpha?.type).toBe("STDIO");
    expect(alpha?.command).toBe("node");
    expect(alpha?.args).toEqual(["server.js"]);
    expect(alpha?.description).toBe("[managed:mcp.json] alpha-server");

    expect(beta?.name).toBe("beta-server");
    expect(beta?.type).toBe("SSE");
    expect(beta?.url).toBe("http://localhost:8123/sse");
    expect(beta?.headers).toEqual({ Authorization: "Bearer token" });
    expect(beta?.description).toBe("[managed:mcp.json] beta-server");
  });

  it("throws a clear invalid-format error for malformed mcp.json", async () => {
    const configPath = createTempConfigPath();
    tempConfigPaths.push(configPath);

    fs.writeFileSync(configPath, "{not-valid-json", "utf-8");

    const service = new McpJsonHotReloadService(configPath);
    const testAccess = getTestAccess(service);

    await expect(testAccess.readDesiredServers()).rejects.toThrow(
      /Invalid mcp\.json format/,
    );
  });

  it("throws when mapped desired servers normalize to the same managed name", () => {
    const collisionConfig = {
      mcpServers: {
        "a b": {
          command: "node",
          args: ["a.js"],
        },
        "a@b": {
          command: "node",
          args: ["b.js"],
        },
      },
    };

    expect(() =>
      buildDesiredServerMapFromConfig(
        collisionConfig as unknown as ClaudeDesktopConfig,
      ),
    ).toThrow(
      'Conflicting mcp.json server names: "a b" and "a@b" both normalize to "a_b"',
    );
  });
});

describe("McpJsonHotReloadService invalidateAffectedNamespaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early when no namespaces are affected", async () => {
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    await testAccess.invalidateAffectedNamespaces(["server-1"]);

    expect(metaMcpServerPool.invalidateIdleServers).not.toHaveBeenCalled();
    expect(metaMcpServerPool.invalidateOpenApiSessions).not.toHaveBeenCalled();
    expect(clearOverrideCache).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("invalidates deduped namespaces and logs rejected invalidation steps", async () => {
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid)
      .mockResolvedValueOnce(["ns-1", "ns-2"])
      .mockResolvedValueOnce(["ns-2", "ns-3"]);

    vi.mocked(metaMcpServerPool.invalidateIdleServers).mockRejectedValue(
      new Error("idle invalidation failed"),
    );
    vi.mocked(metaMcpServerPool.invalidateOpenApiSessions).mockResolvedValue();

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    await testAccess.invalidateAffectedNamespaces(["server-1", "server-2"]);

    expect(metaMcpServerPool.invalidateIdleServers).toHaveBeenCalledWith([
      "ns-1",
      "ns-2",
      "ns-3",
    ]);
    expect(metaMcpServerPool.invalidateOpenApiSessions).toHaveBeenCalledWith([
      "ns-1",
      "ns-2",
      "ns-3",
    ]);

    expect(clearOverrideCache).toHaveBeenCalledTimes(3);
    expect(clearOverrideCache).toHaveBeenCalledWith("ns-1");
    expect(clearOverrideCache).toHaveBeenCalledWith("ns-2");
    expect(clearOverrideCache).toHaveBeenCalledWith("ns-3");

    expect(logger.error).toHaveBeenCalledWith(
      "[mcp.json] namespace invalidation step failed: idle invalidation failed",
    );
    expect(logger.info).toHaveBeenCalledWith(
      "[mcp.json] invalidated 3 affected namespace session(s)",
    );
  });
});

describe("McpJsonHotReloadService reconcileServers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles mixed create/update/unchanged/unmanaged/remove reconciliation in one run", async () => {
    const existingManagedToUpdate = {
      uuid: "managed-update-mixed-uuid",
      name: "managed_update_mixed_server",
      description: "[managed:mcp.json] managed_update_mixed_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["old.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const updatedManagedServer = {
      ...existingManagedToUpdate,
      args: ["new.js"],
    } as unknown as DatabaseMcpServer;

    const existingManagedUnchanged = {
      uuid: "managed-unchanged-mixed-uuid",
      name: "managed_unchanged_mixed_server",
      description: "[managed:mcp.json] managed_unchanged_mixed_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["same.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const existingUnmanagedPublic = {
      uuid: "manual-mixed-uuid",
      name: "manual_mixed_server",
      description: "manually managed public server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["manual-old.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const existingManagedToRemove = {
      uuid: "managed-remove-mixed-uuid",
      name: "managed_remove_mixed_server",
      description: "[managed:mcp.json] managed_remove_mixed_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["remove.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const createdManagedServer = {
      uuid: "managed-create-mixed-uuid",
      name: "managed_create_mixed_server",
      description: "[managed:mcp.json] managed_create_mixed_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["create.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([
      existingManagedToUpdate,
      existingManagedUnchanged,
      existingUnmanagedPublic,
      existingManagedToRemove,
    ]);
    vi.mocked(mcpServersRepository.create).mockResolvedValue(createdManagedServer);
    vi.mocked(mcpServersRepository.update).mockResolvedValue(updatedManagedServer);
    vi.mocked(mcpServersRepository.deleteByUuid).mockResolvedValue(undefined);

    vi.mocked(convertDbServerToParams)
      .mockResolvedValueOnce({
        type: "stdio",
        command: "node",
        args: ["create.js"],
        env: {},
      } as unknown as never)
      .mockResolvedValueOnce({
        type: "stdio",
        command: "node",
        args: ["new.js"],
        env: {},
      } as unknown as never);

    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "managed_create_mixed_server",
        {
          name: "managed_create_mixed_server",
          type: "STDIO",
          command: "node",
          args: ["create.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] managed_create_mixed_server",
        },
      ],
      [
        "managed_update_mixed_server",
        {
          name: "managed_update_mixed_server",
          type: "STDIO",
          command: "node",
          args: ["new.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] managed_update_mixed_server",
        },
      ],
      [
        "managed_unchanged_mixed_server",
        {
          name: "managed_unchanged_mixed_server",
          type: "STDIO",
          command: "node",
          args: ["same.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] managed_unchanged_mixed_server",
        },
      ],
      [
        "manual_mixed_server",
        {
          name: "manual_mixed_server",
          type: "STDIO",
          command: "node",
          args: ["manual-new.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] manual_mixed_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 1, updated: 1, removed: 1 });

    expect(mcpServersRepository.create).toHaveBeenCalledTimes(1);
    expect(mcpServersRepository.update).toHaveBeenCalledTimes(1);
    expect(mcpServersRepository.deleteByUuid).toHaveBeenCalledTimes(1);
    expect(mcpServersRepository.deleteByUuid).toHaveBeenCalledWith(
      "managed-remove-mixed-uuid",
    );

    expect(convertDbServerToParams).toHaveBeenCalledTimes(2);
    expect(mcpServerPool.ensureIdleSessionForNewServer).toHaveBeenCalledTimes(1);
    expect(mcpServerPool.invalidateIdleSession).toHaveBeenCalledTimes(1);
    expect(mcpServerPool.cleanupIdleSession).toHaveBeenCalledTimes(1);
    expect(mcpServerPool.cleanupIdleSession).toHaveBeenCalledWith(
      "managed-remove-mixed-uuid",
    );

    expect(namespaceMappingsRepository.findNamespacesByServerUuid).toHaveBeenCalledTimes(3);
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).toHaveBeenCalledWith(
      "managed-create-mixed-uuid",
    );
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).toHaveBeenCalledWith(
      "managed-update-mixed-uuid",
    );
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).toHaveBeenCalledWith(
      "managed-remove-mixed-uuid",
    );
  });

  it("creates missing managed server and initializes idle session when params are available", async () => {
    const createdServer = {
      uuid: "created-uuid",
      name: "created_server",
      description: "[managed:mcp.json] created_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["created.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([]);
    vi.mocked(mcpServersRepository.create).mockResolvedValue(createdServer);
    vi.mocked(convertDbServerToParams).mockResolvedValue({
      type: "stdio",
      command: "node",
      args: ["created.js"],
      env: {},
    } as unknown as never);
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "created_server",
        {
          name: "created_server",
          type: "STDIO",
          command: "node",
          args: ["created.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] created_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 1, updated: 0, removed: 0 });
    expect(mcpServersRepository.create).toHaveBeenCalledTimes(1);
    expect(mcpServersRepository.create).toHaveBeenCalledWith({
      name: "created_server",
      description: "[managed:mcp.json] created_server",
      type: "STDIO",
      command: "node",
      args: ["created.js"],
      env: {},
      url: null,
      headers: {},
      user_id: null,
    });
    expect(convertDbServerToParams).toHaveBeenCalledWith(createdServer);
    expect(mcpServerPool.ensureIdleSessionForNewServer).toHaveBeenCalledTimes(1);
    expect(mcpServerPool.ensureIdleSessionForNewServer).toHaveBeenCalledWith(
      "created-uuid",
      {
        type: "stdio",
        command: "node",
        args: ["created.js"],
        env: {},
      },
    );
    expect(mcpServersRepository.update).not.toHaveBeenCalled();
    expect(mcpServersRepository.deleteByUuid).not.toHaveBeenCalled();
  });

  it("creates missing managed server without idle-session init when params are unavailable", async () => {
    const createdServer = {
      uuid: "created-no-params-uuid",
      name: "created_no_params_server",
      description: "[managed:mcp.json] created_no_params_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["created.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([]);
    vi.mocked(mcpServersRepository.create).mockResolvedValue(createdServer);
    vi.mocked(convertDbServerToParams).mockResolvedValue(null as unknown as never);
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "created_no_params_server",
        {
          name: "created_no_params_server",
          type: "STDIO",
          command: "node",
          args: ["created.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] created_no_params_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 1, updated: 0, removed: 0 });
    expect(mcpServersRepository.create).toHaveBeenCalledTimes(1);
    expect(convertDbServerToParams).toHaveBeenCalledWith(createdServer);
    expect(mcpServerPool.ensureIdleSessionForNewServer).not.toHaveBeenCalled();
    expect(mcpServersRepository.update).not.toHaveBeenCalled();
    expect(mcpServersRepository.deleteByUuid).not.toHaveBeenCalled();
  });

  it("updates changed managed servers and invalidates idle sessions", async () => {
    const existingManagedServer = {
      uuid: "managed-update-uuid",
      name: "managed_server",
      description: "[managed:mcp.json] managed_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["old.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const updatedManagedServer = {
      ...existingManagedServer,
      args: ["new.js"],
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([
      existingManagedServer,
    ]);
    vi.mocked(mcpServersRepository.update).mockResolvedValue(updatedManagedServer);
    vi.mocked(convertDbServerToParams).mockResolvedValue({
      type: "stdio",
      command: "node",
      args: ["new.js"],
      env: {},
    } as unknown as never);
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "managed_server",
        {
          name: "managed_server",
          type: "STDIO",
          command: "node",
          args: ["new.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] managed_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 0, updated: 1, removed: 0 });
    expect(mcpServersRepository.update).toHaveBeenCalledTimes(1);
    expect(mcpServersRepository.update).toHaveBeenCalledWith({
      uuid: "managed-update-uuid",
      description: "[managed:mcp.json] managed_server",
      type: "STDIO",
      command: "node",
      args: ["new.js"],
      env: {},
      url: null,
      headers: {},
      user_id: null,
    });
    expect(convertDbServerToParams).toHaveBeenCalledWith(updatedManagedServer);
    expect(mcpServerPool.invalidateIdleSession).toHaveBeenCalledTimes(1);
    expect(mcpServerPool.invalidateIdleSession).toHaveBeenCalledWith(
      "managed-update-uuid",
      {
        type: "stdio",
        command: "node",
        args: ["new.js"],
        env: {},
      },
    );
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).toHaveBeenCalledWith(
      "managed-update-uuid",
    );
    expect(mcpServersRepository.create).not.toHaveBeenCalled();
    expect(mcpServersRepository.deleteByUuid).not.toHaveBeenCalled();
  });

  it("updates changed managed server without idle-session invalidation when params are unavailable", async () => {
    const existingManagedServer = {
      uuid: "managed-update-no-params-uuid",
      name: "managed_update_no_params_server",
      description: "[managed:mcp.json] managed_update_no_params_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["old.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const updatedManagedServer = {
      ...existingManagedServer,
      args: ["new.js"],
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([
      existingManagedServer,
    ]);
    vi.mocked(mcpServersRepository.update).mockResolvedValue(updatedManagedServer);
    vi.mocked(convertDbServerToParams).mockResolvedValue(null as unknown as never);
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "managed_update_no_params_server",
        {
          name: "managed_update_no_params_server",
          type: "STDIO",
          command: "node",
          args: ["new.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] managed_update_no_params_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 0, updated: 1, removed: 0 });
    expect(mcpServersRepository.update).toHaveBeenCalledTimes(1);
    expect(convertDbServerToParams).toHaveBeenCalledWith(updatedManagedServer);
    expect(mcpServerPool.invalidateIdleSession).not.toHaveBeenCalled();
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).toHaveBeenCalledWith(
      "managed-update-no-params-uuid",
    );
    expect(mcpServersRepository.create).not.toHaveBeenCalled();
    expect(mcpServersRepository.deleteByUuid).not.toHaveBeenCalled();
  });

  it("does not update managed server when desired config is unchanged", async () => {
    const existingManagedServer = {
      uuid: "managed-unchanged-uuid",
      name: "managed_unchanged_server",
      description: "[managed:mcp.json] managed_unchanged_server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["same.js"],
      env: {
        NODE_ENV: "test",
      },
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([
      existingManagedServer,
    ]);

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "managed_unchanged_server",
        {
          name: "managed_unchanged_server",
          type: "STDIO",
          command: "node",
          args: ["same.js"],
          env: {
            NODE_ENV: "test",
          },
          url: null,
          headers: {},
          description: "[managed:mcp.json] managed_unchanged_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 0, updated: 0, removed: 0 });
    expect(mcpServersRepository.update).not.toHaveBeenCalled();
    expect(convertDbServerToParams).not.toHaveBeenCalled();
    expect(mcpServerPool.invalidateIdleSession).not.toHaveBeenCalled();
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).not.toHaveBeenCalled();
    expect(mcpServersRepository.create).not.toHaveBeenCalled();
    expect(mcpServersRepository.deleteByUuid).not.toHaveBeenCalled();
  });

  it("does not update unmanaged public server even when desired config differs", async () => {
    const unmanagedPublicServer = {
      uuid: "manual-update-uuid",
      name: "manual_server",
      description: "manually managed public server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["manual-old.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([
      unmanagedPublicServer,
    ]);

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>([
      [
        "manual_server",
        {
          name: "manual_server",
          type: "STDIO",
          command: "node",
          args: ["manual-new.js"],
          env: {},
          url: null,
          headers: {},
          description: "[managed:mcp.json] manual_server",
        },
      ],
    ]);

    const result = await testAccess.reconcileServers(desiredMap);

    expect(result).toEqual({ created: 0, updated: 0, removed: 0 });
    expect(mcpServersRepository.update).not.toHaveBeenCalled();
    expect(convertDbServerToParams).not.toHaveBeenCalled();
    expect(mcpServerPool.invalidateIdleSession).not.toHaveBeenCalled();
    expect(namespaceMappingsRepository.findNamespacesByServerUuid).not.toHaveBeenCalled();
    expect(mcpServersRepository.create).not.toHaveBeenCalled();
    expect(mcpServersRepository.deleteByUuid).not.toHaveBeenCalled();
  });

  it("removes managed servers missing from desired map and preserves unmanaged public entries", async () => {
    const managedServer = {
      uuid: "managed-uuid",
      name: "managed_server",
      description: "[managed:mcp.json] managed server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["managed.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    const unmanagedPublicServer = {
      uuid: "manual-uuid",
      name: "manual_server",
      description: "manually managed public server",
      user_id: null,
      type: "STDIO",
      command: "node",
      args: ["manual.js"],
      env: {},
      url: null,
      headers: {},
    } as unknown as DatabaseMcpServer;

    vi.mocked(mcpServersRepository.findAll).mockResolvedValue([
      managedServer,
      unmanagedPublicServer,
    ]);
    vi.mocked(mcpServersRepository.deleteByUuid).mockResolvedValue(undefined);
    vi.mocked(namespaceMappingsRepository.findNamespacesByServerUuid).mockResolvedValue(
      [],
    );

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const result = await testAccess.reconcileServers(new Map());

    expect(result).toEqual({ created: 0, updated: 0, removed: 1 });
    expect(mcpServerPool.cleanupIdleSession).toHaveBeenCalledTimes(1);
    expect(mcpServerPool.cleanupIdleSession).toHaveBeenCalledWith(
      "managed-uuid",
    );
    expect(mcpServersRepository.deleteByUuid).toHaveBeenCalledTimes(1);
    expect(mcpServersRepository.deleteByUuid).toHaveBeenCalledWith(
      "managed-uuid",
    );
    expect(mcpServersRepository.create).not.toHaveBeenCalled();
    expect(mcpServersRepository.update).not.toHaveBeenCalled();
    expect(mcpServerPool.cleanupIdleSession).not.toHaveBeenCalledWith(
      "manual-uuid",
    );
  });
});

describe("McpJsonHotReloadService sync orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("replays one pending sync after in-flight sync completes", async () => {
    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const desiredMap = new Map<string, DesiredServerForTest>();

    let releaseFirstReconcile: (() => void) | null = null;
    const firstReconcilePromise = new Promise<{
      created: number;
      updated: number;
      removed: number;
    }>((resolve) => {
      releaseFirstReconcile = () =>
        resolve({ created: 0, updated: 0, removed: 0 });
    });

    const readSpy = vi
      .spyOn(testAccess as unknown as { readDesiredServers: () => Promise<Map<string, DesiredServerForTest>> }, "readDesiredServers")
      .mockResolvedValue(desiredMap);

    const reconcileSpy = vi
      .spyOn(
        testAccess as unknown as {
          reconcileServers: (
            desired: Map<string, DesiredServerForTest>,
          ) => Promise<{ created: number; updated: number; removed: number }>;
        },
        "reconcileServers",
      )
      .mockImplementationOnce(async () => firstReconcilePromise)
      .mockResolvedValueOnce({ created: 0, updated: 0, removed: 0 });

    const firstSync = testAccess.syncFromDisk("file-change");
    const secondSync = testAccess.syncFromDisk("file-change");

    await Promise.resolve();
    expect(reconcileSpy).toHaveBeenCalledTimes(1);

    releaseFirstReconcile?.();
    await secondSync;
    await firstSync;

    expect(readSpy).toHaveBeenCalledTimes(2);
    expect(reconcileSpy).toHaveBeenCalledTimes(2);
  });

  it("replays one pending sync after in-flight sync fails", async () => {
    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    let rejectFirstRead: ((error: Error) => void) | null = null;
    const firstReadPromise = new Promise<Map<string, DesiredServerForTest>>(
      (_, reject) => {
        rejectFirstRead = (error: Error) => reject(error);
      },
    );

    const readSpy = vi
      .spyOn(
        testAccess as unknown as {
          readDesiredServers: () => Promise<Map<string, DesiredServerForTest>>;
        },
        "readDesiredServers",
      )
      .mockImplementationOnce(async () => firstReadPromise)
      .mockResolvedValueOnce(new Map<string, DesiredServerForTest>());

    const reconcileSpy = vi
      .spyOn(
        testAccess as unknown as {
          reconcileServers: (
            desired: Map<string, DesiredServerForTest>,
          ) => Promise<{ created: number; updated: number; removed: number }>;
        },
        "reconcileServers",
      )
      .mockResolvedValueOnce({ created: 0, updated: 0, removed: 0 });

    const firstSync = testAccess.syncFromDisk("file-change");
    const secondSync = testAccess.syncFromDisk("file-change");

    await Promise.resolve();
    rejectFirstRead?.(new Error("read failed"));

    await expect(firstSync).rejects.toThrow("read failed");
    await secondSync;

    expect(readSpy).toHaveBeenCalledTimes(2);
    expect(reconcileSpy).toHaveBeenCalledTimes(1);
  });

  it("debounces scheduleSync and runs only the latest reason", async () => {
    vi.useFakeTimers();

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const syncSpy = vi
      .spyOn(
        testAccess as unknown as {
          syncFromDisk: (reason: "startup" | "file-change") => Promise<void>;
        },
        "syncFromDisk",
      )
      .mockResolvedValue(undefined);

    testAccess.scheduleSync("startup");
    testAccess.scheduleSync("file-change");

    await vi.advanceTimersByTimeAsync(249);
    expect(syncSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledWith("file-change");
  });

  it("logs when debounced sync execution fails", async () => {
    vi.useFakeTimers();

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const syncError = new Error("sync failed");
    vi.spyOn(
      testAccess as unknown as {
        syncFromDisk: (reason: "startup" | "file-change") => Promise<void>;
      },
      "syncFromDisk",
    ).mockRejectedValueOnce(syncError);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    testAccess.scheduleSync("file-change");

    await vi.advanceTimersByTimeAsync(250);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to synchronize mcp.json:",
      syncError,
    );

    consoleErrorSpy.mockRestore();
  });

  it("coalesces rapid failing schedules into one sync attempt and one error log", async () => {
    vi.useFakeTimers();

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const syncError = new Error("sync failed once");
    const syncSpy = vi
      .spyOn(
        testAccess as unknown as {
          syncFromDisk: (reason: "startup" | "file-change") => Promise<void>;
        },
        "syncFromDisk",
      )
      .mockRejectedValue(syncError);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    testAccess.scheduleSync("startup");
    testAccess.scheduleSync("file-change");

    await vi.advanceTimersByTimeAsync(250);

    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledWith("file-change");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to synchronize mcp.json:",
      syncError,
    );

    consoleErrorSpy.mockRestore();
  });
});

describe("McpJsonHotReloadService watcher lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialize syncs startup and enables file watcher", async () => {
    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const syncSpy = vi
      .spyOn(
        testAccess as unknown as {
          syncFromDisk: (reason: "startup" | "file-change") => Promise<void>;
        },
        "syncFromDisk",
      )
      .mockResolvedValue(undefined);

    await service.initialize();

    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledWith("startup");
    expect(testAccess.watcherEnabled).toBe(true);

    service.stop();
  });

  it("stop clears pending debounce and unregisters watcher", async () => {
    vi.useFakeTimers();

    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const syncSpy = vi
      .spyOn(
        testAccess as unknown as {
          syncFromDisk: (reason: "startup" | "file-change") => Promise<void>;
        },
        "syncFromDisk",
      )
      .mockResolvedValue(undefined);

    await service.initialize();
    testAccess.scheduleSync("file-change");

    service.stop();

    await vi.advanceTimersByTimeAsync(300);

    expect(testAccess.watcherEnabled).toBe(false);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledWith("startup");
  });

  it("stop is a no-op when watcher is not enabled", () => {
    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    expect(testAccess.watcherEnabled).toBe(false);

    service.stop();

    expect(testAccess.watcherEnabled).toBe(false);
  });
});

describe("McpJsonHotReloadService file change gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not schedule sync when mtime and size are unchanged", () => {
    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const scheduleSpy = vi
      .spyOn(
        testAccess as unknown as {
          scheduleSync: (reason: "startup" | "file-change") => void;
        },
        "scheduleSync",
      )
      .mockImplementation(() => undefined);

    const previousStats = {
      mtimeMs: 123,
      size: 456,
    } as unknown as fs.Stats;
    const currentStats = {
      mtimeMs: 123,
      size: 456,
    } as unknown as fs.Stats;

    testAccess.handleFileChange(currentStats, previousStats);

    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it("schedules sync when either mtime or size changes", () => {
    const service = new McpJsonHotReloadService();
    const testAccess = getTestAccess(service);

    const scheduleSpy = vi
      .spyOn(
        testAccess as unknown as {
          scheduleSync: (reason: "startup" | "file-change") => void;
        },
        "scheduleSync",
      )
      .mockImplementation(() => undefined);

    const previousStats = {
      mtimeMs: 123,
      size: 456,
    } as unknown as fs.Stats;
    const currentStats = {
      mtimeMs: 124,
      size: 456,
    } as unknown as fs.Stats;

    testAccess.handleFileChange(currentStats, previousStats);

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(scheduleSpy).toHaveBeenCalledWith("file-change");
  });
});
