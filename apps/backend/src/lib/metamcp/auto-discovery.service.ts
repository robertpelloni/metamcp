import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  type DiscoverySourceType,
  type DiscoveryStatus,
  type DiscoveredServer,
  type DiscoverySourceResult,
  type DiscoveryScanResult,
  validateClaudeDesktopConfig,
  isStdioServer,
  isSseServer,
  type ClaudeDesktopConfig,
  type ClaudeServerDefinition,
} from "@repo/zod-types";
import { mcpServersRepository } from "../../db/repositories";
import { logError } from "../errors";

interface DiscoveryPath {
  sourceType: DiscoverySourceType;
  path: string;
  description: string;
}

function getDiscoveryPaths(platform?: string): DiscoveryPath[] {
  const currentPlatform = platform || process.platform;
  const homeDir = os.homedir();
  const paths: DiscoveryPath[] = [];

  if (currentPlatform === "win32") {
    const appData =
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    const localAppData =
      process.env.LOCALAPPDATA || path.join(homeDir, "AppData", "Local");

    paths.push(
      {
        sourceType: "claude_desktop",
        path: path.join(appData, "Claude", "claude_desktop_config.json"),
        description: "Claude Desktop (Windows)",
      },
      {
        sourceType: "cursor",
        path: path.join(appData, "Cursor", "User", "globalStorage", "mcp.json"),
        description: "Cursor IDE (Windows)",
      },
      {
        sourceType: "cursor",
        path: path.join(homeDir, ".cursor", "mcp.json"),
        description: "Cursor IDE config (Windows)",
      },
      {
        sourceType: "vscode",
        path: path.join(appData, "Code", "User", "globalStorage", "mcp.json"),
        description: "VS Code (Windows)",
      },
    );
  } else if (currentPlatform === "darwin") {
    paths.push(
      {
        sourceType: "claude_desktop",
        path: path.join(
          homeDir,
          "Library",
          "Application Support",
          "Claude",
          "claude_desktop_config.json",
        ),
        description: "Claude Desktop (macOS)",
      },
      {
        sourceType: "cursor",
        path: path.join(
          homeDir,
          "Library",
          "Application Support",
          "Cursor",
          "User",
          "globalStorage",
          "mcp.json",
        ),
        description: "Cursor IDE (macOS)",
      },
      {
        sourceType: "cursor",
        path: path.join(homeDir, ".cursor", "mcp.json"),
        description: "Cursor IDE config (macOS)",
      },
      {
        sourceType: "vscode",
        path: path.join(
          homeDir,
          "Library",
          "Application Support",
          "Code",
          "User",
          "globalStorage",
          "mcp.json",
        ),
        description: "VS Code (macOS)",
      },
    );
  } else {
    paths.push(
      {
        sourceType: "claude_desktop",
        path: path.join(
          homeDir,
          ".config",
          "claude",
          "claude_desktop_config.json",
        ),
        description: "Claude Desktop (Linux)",
      },
      {
        sourceType: "cursor",
        path: path.join(
          homeDir,
          ".config",
          "Cursor",
          "User",
          "globalStorage",
          "mcp.json",
        ),
        description: "Cursor IDE (Linux)",
      },
      {
        sourceType: "cursor",
        path: path.join(homeDir, ".cursor", "mcp.json"),
        description: "Cursor IDE config (Linux)",
      },
      {
        sourceType: "vscode",
        path: path.join(
          homeDir,
          ".config",
          "Code",
          "User",
          "globalStorage",
          "mcp.json",
        ),
        description: "VS Code (Linux)",
      },
    );
  }

  const cwd = process.cwd();
  paths.push({
    sourceType: "project_mcp",
    path: path.join(cwd, "mcp.json"),
    description: "Project root mcp.json",
  });

  return paths;
}

async function scanConfigFile(
  filePath: string,
  sourceType: DiscoverySourceType,
  existingServerNames: Set<string>,
  existingServersByName: Map<string, string>,
): Promise<DiscoverySourceResult> {
  const result: DiscoverySourceResult = {
    sourceType,
    path: filePath,
    status: "not_found" as DiscoveryStatus,
    servers: [],
  };

  try {
    const stats = await fs.promises.stat(filePath);
    result.lastModified = stats.mtime;

    const content = await fs.promises.readFile(filePath, "utf-8");
    const validation = validateClaudeDesktopConfig(content);

    if (!validation.valid) {
      result.status = "invalid";
      result.error = validation.errors
        ?.map((e: { message: string }) => e.message)
        .join("; ");
      return result;
    }

    result.status = "found";
    const config = validation.data as ClaudeDesktopConfig;

    for (const [name, def] of Object.entries(config.mcpServers)) {
      const definition = def as ClaudeServerDefinition;
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const alreadyRegistered = existingServerNames.has(safeName);
      const existingUuid = existingServersByName.get(safeName);

      const server: DiscoveredServer = {
        name: safeName,
        type: isStdioServer(definition) ? "STDIO" : "SSE",
        alreadyRegistered,
        existingUuid,
      };

      if (isStdioServer(definition)) {
        server.command = definition.command;
        server.args = definition.args;
        server.env = definition.env;
      } else if (isSseServer(definition)) {
        server.url = definition.url;
        server.headers = definition.headers;
      }

      result.servers.push(server);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      result.status = "not_found";
    } else if ((error as NodeJS.ErrnoException).code === "EACCES") {
      result.status = "permission_denied";
      result.error = "Permission denied";
    } else {
      result.status = "invalid";
      result.error = error instanceof Error ? error.message : "Unknown error";
    }
  }

  return result;
}

export class AutoDiscoveryService {
  private customPaths: string[] = [];

  async scanForConfigs(
    options: {
      sources?: DiscoverySourceType[];
      customPaths?: string[];
      includeDetails?: boolean;
    } = {},
  ): Promise<DiscoveryScanResult> {
    const { sources, customPaths = [], includeDetails = true } = options;

    const existingServers = await mcpServersRepository.findAll();
    const existingServerNames = new Set(existingServers.map((s) => s.name));
    const existingServersByName = new Map(
      existingServers.map((s) => [s.name, s.uuid]),
    );

    let pathsToScan = getDiscoveryPaths();

    if (sources && sources.length > 0) {
      pathsToScan = pathsToScan.filter((p) => sources.includes(p.sourceType));
    }

    const allCustomPaths = [...this.customPaths, ...customPaths];
    for (const customPath of allCustomPaths) {
      pathsToScan.push({
        sourceType: "custom",
        path: customPath,
        description: `Custom: ${customPath}`,
      });
    }

    const sourceResults: DiscoverySourceResult[] = [];

    for (const pathInfo of pathsToScan) {
      const result = await scanConfigFile(
        pathInfo.path,
        pathInfo.sourceType,
        existingServerNames,
        existingServersByName,
      );

      if (!includeDetails && result.status !== "found") {
        continue;
      }

      sourceResults.push(result);
    }

    let totalDiscovered = 0;
    let newServers = 0;
    let existingCount = 0;

    for (const source of sourceResults) {
      totalDiscovered += source.servers.length;
      for (const server of source.servers) {
        if (server.alreadyRegistered) {
          existingCount++;
        } else {
          newServers++;
        }
      }
    }

    return {
      scannedAt: new Date(),
      sources: sourceResults,
      totalDiscovered,
      newServers,
      existingServers: existingCount,
    };
  }

  async importFromPath(
    sourcePath: string,
    serverNames: string[],
    userId?: string | null,
    skipExisting = true,
  ): Promise<{ imported: number; skipped: string[] }> {
    const content = await fs.promises.readFile(sourcePath, "utf-8");
    const validation = validateClaudeDesktopConfig(content);

    if (!validation.valid) {
      throw new Error(
        `Invalid config: ${validation.errors?.map((e: { message: string }) => e.message).join("; ")}`,
      );
    }

    const config = validation.data as ClaudeDesktopConfig;
    const serversToCreate: Array<{
      name: string;
      type: "STDIO" | "SSE";
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
      headers?: Record<string, string>;
      user_id?: string | null;
    }> = [];
    const skipped: string[] = [];

    const existingServers = await mcpServersRepository.findAll();
    const existingServerNames = new Set(existingServers.map((s) => s.name));
    const serverNamesSet = new Set(serverNames);

    for (const [name, def] of Object.entries(config.mcpServers)) {
      const definition = def as ClaudeServerDefinition;
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");

      if (!serverNamesSet.has(safeName)) {
        continue;
      }

      if (skipExisting && existingServerNames.has(safeName)) {
        skipped.push(`${safeName}: already exists`);
        continue;
      }

      try {
        if (isStdioServer(definition)) {
          serversToCreate.push({
            name: safeName,
            type: "STDIO",
            command: definition.command,
            args: definition.args || [],
            env: definition.env || {},
            user_id: userId,
          });
        } else if (isSseServer(definition)) {
          serversToCreate.push({
            name: safeName,
            type: "SSE",
            url: definition.url,
            headers: definition.headers || {},
            user_id: userId,
          });
        }
      } catch (error) {
        logError(error, "auto-discovery.import", { serverName: name });
        skipped.push(
          `${safeName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    if (serversToCreate.length > 0) {
      await mcpServersRepository.bulkCreate(serversToCreate);
    }

    return {
      imported: serversToCreate.length,
      skipped,
    };
  }

  getDiscoveryPaths(platform?: string): DiscoveryPath[] {
    const paths = getDiscoveryPaths(platform);

    for (const customPath of this.customPaths) {
      paths.push({
        sourceType: "custom",
        path: customPath,
        description: `Custom: ${customPath}`,
      });
    }

    return paths;
  }

  addCustomPath(pathToAdd: string): boolean {
    const normalizedPath = path.normalize(pathToAdd);
    if (!this.customPaths.includes(normalizedPath)) {
      this.customPaths.push(normalizedPath);
      return true;
    }
    return false;
  }

  removeCustomPath(pathToRemove: string): boolean {
    const normalizedPath = path.normalize(pathToRemove);
    const index = this.customPaths.indexOf(normalizedPath);
    if (index !== -1) {
      this.customPaths.splice(index, 1);
      return true;
    }
    return false;
  }

  getCustomPaths(): string[] {
    return [...this.customPaths];
  }
}

export const autoDiscoveryService = new AutoDiscoveryService();
