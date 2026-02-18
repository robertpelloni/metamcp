import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { logError } from "../errors";

export interface NpmMcpServer {
  packageName: string;
  version: string;
  binName: string;
  binPath: string;
  command: string;
  description?: string;
  hasSdk: boolean;
  alreadyRegistered?: boolean;
  existingUuid?: string;
}

export interface NpmScanResult {
  scannedAt: Date;
  globalPath: string;
  servers: NpmMcpServer[];
  totalPackages: number;
  mcpPackages: number;
  errors: string[];
}

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  bin?: Record<string, string> | string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Detection strategies for MCP servers:
 * 1. Package name contains "mcp-server" (e.g., mcp-server-filesystem)
 * 2. Bin entry name starts with "mcp-server-" (e.g., @playwright/mcp has bin "mcp-server-playwright")
 * 3. Has @modelcontextprotocol/sdk as dependency
 */
export class NpmScanningService {
  private globalPath: string | null = null;

  private getGlobalPath(): string {
    if (this.globalPath) {
      return this.globalPath;
    }

    try {
      this.globalPath = execSync("npm root -g", {
        encoding: "utf-8",
        timeout: 10000,
      }).trim();
      return this.globalPath;
    } catch (error) {
      logError(error, "npm-scanning.getGlobalPath");
      throw new Error("Failed to get npm global path. Is npm installed?");
    }
  }

  private isMcpServer(pkg: PackageJson): {
    isMcp: boolean;
    binName?: string;
    binPath?: string;
  } {
    const name = pkg.name.toLowerCase();

    const nameContainsMcpServer = name.includes("mcp-server");
    if (nameContainsMcpServer) {
      const bin = this.extractBin(pkg);
      return bin
        ? { isMcp: true, binName: bin.name, binPath: bin.path }
        : { isMcp: true };
    }

    const nameEndsWithMcp = name.endsWith("-mcp") || name.endsWith("/mcp");
    if (nameEndsWithMcp) {
      const bin = this.extractBin(pkg);
      if (bin) {
        return { isMcp: true, binName: bin.name, binPath: bin.path };
      }
    }

    if (pkg.bin && typeof pkg.bin === "object") {
      for (const [binName, binPath] of Object.entries(pkg.bin)) {
        if (binName.startsWith("mcp-server-")) {
          return { isMcp: true, binName, binPath };
        }
      }
    }

    return { isMcp: false };
  }

  private extractBin(pkg: PackageJson): { name: string; path: string } | null {
    if (!pkg.bin) {
      return null;
    }

    if (typeof pkg.bin === "string") {
      const binName = pkg.name.split("/").pop() || pkg.name;
      return { name: binName, path: pkg.bin };
    }

    const entries = Object.entries(pkg.bin);
    if (entries.length > 0) {
      const mcpEntry = entries.find(([name]) => name.startsWith("mcp-server-"));
      return mcpEntry
        ? { name: mcpEntry[0], path: mcpEntry[1] }
        : { name: entries[0][0], path: entries[0][1] };
    }

    return null;
  }

  private hasMcpSdk(pkg: PackageJson): boolean {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return "@modelcontextprotocol/sdk" in allDeps;
  }

  private async readPackageJson(dir: string): Promise<PackageJson | null> {
    try {
      const content = await fs.promises.readFile(
        path.join(dir, "package.json"),
        "utf-8",
      );
      return JSON.parse(content) as PackageJson;
    } catch {
      return null;
    }
  }

  async scanGlobalPackages(): Promise<NpmScanResult> {
    const result: NpmScanResult = {
      scannedAt: new Date(),
      globalPath: "",
      servers: [],
      totalPackages: 0,
      mcpPackages: 0,
      errors: [],
    };

    try {
      const globalPath = this.getGlobalPath();
      result.globalPath = globalPath;

      const entries = await fs.promises.readdir(globalPath, {
        withFileTypes: true,
      });

      const dirsToScan: string[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        if (entry.name.startsWith("@")) {
          const scopePath = path.join(globalPath, entry.name);
          try {
            const scopedEntries = await fs.promises.readdir(scopePath, {
              withFileTypes: true,
            });
            for (const scopedEntry of scopedEntries) {
              if (scopedEntry.isDirectory()) {
                dirsToScan.push(path.join(scopePath, scopedEntry.name));
              }
            }
          } catch (error) {
            result.errors.push(`Failed to read scope ${entry.name}: ${error}`);
          }
        } else {
          dirsToScan.push(path.join(globalPath, entry.name));
        }
      }

      result.totalPackages = dirsToScan.length;

      for (const pkgDir of dirsToScan) {
        try {
          const pkg = await this.readPackageJson(pkgDir);
          if (!pkg) continue;

          const mcpCheck = this.isMcpServer(pkg);
          if (!mcpCheck.isMcp) continue;

          const hasSdk = this.hasMcpSdk(pkg);
          const binName = mcpCheck.binName;
          const binPath = mcpCheck.binPath;
          const command = binName || `npx ${pkg.name}`;

          result.servers.push({
            packageName: pkg.name,
            version: pkg.version,
            binName: binName || pkg.name,
            binPath: binPath || "",
            command,
            description: pkg.description,
            hasSdk,
          });

          result.mcpPackages++;
        } catch (error) {
          result.errors.push(
            `Failed to process ${pkgDir}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      result.servers.sort((a, b) => a.packageName.localeCompare(b.packageName));
    } catch (error) {
      logError(error, "npm-scanning.scanGlobalPackages");
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  toStdioConfig(server: NpmMcpServer): {
    name: string;
    type: "STDIO";
    command: string;
    args: string[];
    env: Record<string, string>;
  } {
    const safeName = server.packageName
      .replace(/^@/, "")
      .replace(/\//g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    return {
      name: safeName,
      type: "STDIO",
      command: server.command,
      args: [],
      env: {},
    };
  }
}

export const npmScanningService = new NpmScanningService();
