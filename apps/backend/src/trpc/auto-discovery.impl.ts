import type { DiscoverySourceType } from "@repo/zod-types";
import { autoDiscoveryService } from "../lib/metamcp/auto-discovery.service";

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
};
