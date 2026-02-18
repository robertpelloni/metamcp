import type { DiscoverySourceType } from "@repo/zod-types";
import { autoDiscoveryService } from "../lib/metamcp/auto-discovery.service";
import { npmScanningService } from "../lib/metamcp/npm-scanning.service";
import { mcpServersRepository } from "../db/repositories";

export const autoDiscoveryImplementations = {
  scanForConfigs: async (
    input: {
      sources?: DiscoverySourceType[];
      customPaths?: string[];
      includeDetails?: boolean;
    },
    _userId: string,
  ) => {
    try {
      const result = await autoDiscoveryService.scanForConfigs({
        sources: input.sources,
        customPaths: input.customPaths,
        includeDetails: input.includeDetails ?? true,
      });
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  importDiscovered: async (
    input: {
      serverNames: string[];
      sourcePath: string;
      skipExisting?: boolean;
    },
    userId: string,
  ) => {
    try {
      const result = await autoDiscoveryService.importFromPath(
        input.sourcePath,
        input.serverNames,
        userId,
        input.skipExisting ?? true,
      );
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        skipped: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  getDiscoveryPaths: async (input: { platform?: string }) => {
    const paths = autoDiscoveryService.getDiscoveryPaths(input.platform);
    return {
      paths,
      platform: input.platform || process.platform,
    };
  },

  addCustomPath: async (input: { path: string; label?: string }) => {
    const added = autoDiscoveryService.addCustomPath(input.path);
    return {
      success: added,
      path: input.path,
      error: added ? undefined : "Path already exists",
    };
  },

  scanNpmGlobal: async (
    input: { checkRegistered?: boolean },
    _userId: string,
  ) => {
    try {
      const scanResult = await npmScanningService.scanGlobalPackages();

      if (input.checkRegistered !== false) {
        const existingServers = await mcpServersRepository.findAll();
        const existingNames = new Set(existingServers.map((s) => s.name));
        const existingByName = new Map(
          existingServers.map((s) => [s.name, s.uuid]),
        );

        for (const server of scanResult.servers) {
          const safeName = server.packageName
            .replace(/^@/, "")
            .replace(/\//g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "_");
          server.alreadyRegistered = existingNames.has(safeName);
          server.existingUuid = existingByName.get(safeName);
        }
      }

      return { success: true, result: scanResult };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  importNpmServers: async (
    input: { packageNames: string[]; skipExisting?: boolean },
    userId: string,
  ) => {
    try {
      const scanResult = await npmScanningService.scanGlobalPackages();
      const packageSet = new Set(input.packageNames);
      const serversToImport = scanResult.servers.filter((s) =>
        packageSet.has(s.packageName),
      );

      if (serversToImport.length === 0) {
        return {
          success: true,
          imported: 0,
          skipped: input.packageNames.map(
            (p) => `${p}: not found in global packages`,
          ),
        };
      }

      const existingServers = await mcpServersRepository.findAll();
      const existingNames = new Set(existingServers.map((s) => s.name));

      const toCreate: Array<{
        name: string;
        type: "STDIO";
        command: string;
        args: string[];
        env: Record<string, string>;
        user_id: string;
      }> = [];
      const skipped: string[] = [];

      for (const server of serversToImport) {
        const config = npmScanningService.toStdioConfig(server);

        if (input.skipExisting !== false && existingNames.has(config.name)) {
          skipped.push(
            `${server.packageName}: already registered as ${config.name}`,
          );
          continue;
        }

        toCreate.push({
          ...config,
          user_id: userId,
        });
      }

      if (toCreate.length > 0) {
        await mcpServersRepository.bulkCreate(toCreate);
      }

      return {
        success: true,
        imported: toCreate.length,
        skipped,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        skipped: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
