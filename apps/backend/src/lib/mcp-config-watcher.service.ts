import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import { configImportService } from "./metamcp/config-import.service";

export class McpConfigWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  // Watch both the internal config and the external mount point
  private internalWatchPath = "/app/config/mcp";
  private externalWatchPath = "/app/config/external";

  constructor() {}

  async start(): Promise<void> {
    try {
        // Ensure directories exist
        await fs.mkdir(this.internalWatchPath, { recursive: true });
        await fs.mkdir(this.externalWatchPath, { recursive: true });

        const paths = [
            `${this.internalWatchPath}/*.json`,
            `${this.externalWatchPath}/*.json`
        ];

        console.log(`[ConfigWatcher] Starting watch on: ${paths.join(", ")}`);

        this.watcher = chokidar.watch(paths, {
            persistent: true,
            ignoreInitial: false, // Process existing files on startup
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher
            .on("add", this.handleFile.bind(this))
            .on("change", this.handleFile.bind(this))
            .on("unlink", this.handleRemove.bind(this));

    } catch (error) {
        console.error("[ConfigWatcher] Failed to start:", error);
    }
  }

  async handleFile(filePath: string): Promise<void> {
      console.log(`[ConfigWatcher] File detected: ${filePath}`);
      try {
          const content = await fs.readFile(filePath, "utf-8");
          // Use the existing import logic which handles upsert
          const result = await configImportService.importClaudeConfig(content);
          console.log(`[ConfigWatcher] Imported ${result.imported} servers from ${path.basename(filePath)}`);
      } catch (error) {
          console.error(`[ConfigWatcher] Error processing ${filePath}:`, error);
      }
  }

  async handleRemove(filePath: string): Promise<void> {
      console.log(`[ConfigWatcher] File removed: ${filePath}`);
      // Safe default: Do nothing to preserve state.
  }

  async stop(): Promise<void> {
      if (this.watcher) {
          await this.watcher.close();
      }
  }
}

export const mcpConfigWatcherService = new McpConfigWatcherService();
