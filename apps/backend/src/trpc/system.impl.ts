import { AppRouter } from "@repo/trpc";
import { systemService } from "../lib/system/system.service";

export const systemImplementations: AppRouter["frontend"]["system"] = {
  getInfo: async () => {
    const info = await systemService.getSystemInfo();
    return {
      version: info.version,
      buildDate: info.buildDate,
      nodeVersion: info.nodeVersion,
      platform: info.platform,
      submodules: info.submodules,
      changelogSnippet: info.changelogSnippet,
    };
  },
};
