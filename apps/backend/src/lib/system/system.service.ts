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

  private async getSubmodules() {
    try {
      const gitmodulesPath = path.resolve(this.rootDir, ".gitmodules");
      const content = await fs.readFile(gitmodulesPath, "utf-8");

      const submodules: Array<{ name: string; path: string; url: string; description?: string; version?: string }> = [];

      const sections = content.split('[submodule "');

      for (const section of sections) {
        if (!section.trim()) continue;

        const nameMatch = section.match(/^(.*?)"]/);
        const pathMatch = section.match(/path = (.*)/);
        const urlMatch = section.match(/url = (.*)/);

        if (nameMatch && pathMatch && urlMatch) {
          const name = nameMatch[1];
          const submodulePath = pathMatch[1].trim();
          const url = urlMatch[1].trim();

          let description = "Git Submodule";
          if (name === "mcp-shark") description = "Traffic inspection and logging sidecar";
          if (name === "mcp-directories") description = "Aggregated MCP server registry sources";
          if (name === "mcpdir") description = "Large-scale MCP server index (mcpdir.dev)";
          if (name === "bobcoin") description = "Proof of Health economy integration";

          // Try to read HEAD commit
          let version = "unknown";
          try {
             // Submodules in Docker/CI might be checked out directly or via .git file
             // Check if submodulePath/.git is a file (pointing to modules) or dir
             const subGitPath = path.resolve(this.rootDir, submodulePath, ".git");
             const stats = await fs.stat(subGitPath).catch(() => null);

             if (stats && stats.isFile()) {
                // It's a file pointing to git dir
                const gitFileContent = await fs.readFile(subGitPath, "utf-8");
                const gitDirRelative = gitFileContent.replace("gitdir: ", "").trim();
                const gitDir = path.resolve(this.rootDir, submodulePath, gitDirRelative);
                const headContent = await fs.readFile(path.join(gitDir, "HEAD"), "utf-8");
                 if (headContent.startsWith("ref:")) {
                    const ref = headContent.substring(4).trim();
                    const refContent = await fs.readFile(path.join(gitDir, ref), "utf-8");
                    version = refContent.trim().substring(0, 7);
                 } else {
                    version = headContent.trim().substring(0, 7);
                 }
             } else if (stats && stats.isDirectory()) {
                 const headContent = await fs.readFile(path.join(subGitPath, "HEAD"), "utf-8");
                 if (headContent.startsWith("ref:")) {
                    const ref = headContent.substring(4).trim();
                    const refContent = await fs.readFile(path.join(subGitPath, ref), "utf-8");
                    version = refContent.trim().substring(0, 7);
                 } else {
                    version = headContent.trim().substring(0, 7);
                 }
             }
          } catch (e) {
             // ignore
          }

          submodules.push({
            name,
            path: submodulePath,
            url,
            description,
            version
          });
        }
      }
      return submodules;
    } catch (error) {
      console.warn("Failed to parse .gitmodules, falling back to static list", error);
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
}

export const systemService = new SystemService();
