import fs from "fs/promises";
import path from "path";
import os from "os";

export class SystemService {
  private rootDir = process.cwd();

  async getSystemInfo() {
    const version = await this.getVersion();
    const changelog = await this.getLatestChangelog();

    return {
      version,
      buildDate: new Date().toISOString(), // In a real build, this might be injected
      nodeVersion: process.version,
      platform: `${os.platform()} ${os.release()} (${os.arch()})`,
      submodules: this.getSubmodules(),
      changelogSnippet: changelog,
    };
  }

  private async getVersion(): Promise<string> {
    try {
      const versionPath = path.resolve(this.rootDir, "VERSION");
      return (await fs.readFile(versionPath, "utf-8")).trim();
    } catch {
      return "unknown";
    }
  }

  private async getLatestChangelog(): Promise<string> {
    try {
      const changelogPath = path.resolve(this.rootDir, "CHANGELOG.md");
      const content = await fs.readFile(changelogPath, "utf-8");

      // Extract the first version block
      const match = content.match(/## \[\d+\.\d+\.\d+\].*?(?=## \[|$)/s);
      return match ? match[0].trim() : "No changelog found.";
    } catch {
      return "Changelog not available.";
    }
  }

  private getSubmodules() {
    return [
      {
        name: "mcp-shark",
        path: "apps/backend/mcp-shark",
        description: "Traffic inspection and logging sidecar",
        url: "https://github.com/mcp-shark/mcp-shark"
      },
      {
        name: "mcp-directories",
        path: "submodules/mcp-directories",
        description: "Aggregated MCP server registry sources",
        url: "https://github.com/metatool-ai/mcp-directories"
      },
      {
        name: "mcpdir",
        path: "submodules/mcpdir",
        description: "Large-scale MCP server index (mcpdir.dev)",
        url: "https://github.com/eL1fe/mcpdir"
      }
    ];
  }
}

export const systemService = new SystemService();
