import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import { configImportService } from "./metamcp/config-import.service";

export class McpConfigWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private watchPath = "/app/config/mcp"; // Default internal path

  constructor() {
    // Ensure directory exists or gracefully fail until startup
  }

  async start(): Promise<void> {
    try {
        // Create directory if not exists
        await fs.mkdir(this.watchPath, { recursive: true });

        console.log(`[ConfigWatcher] Starting watch on ${this.watchPath}/*.json`);

        this.watcher = chokidar.watch(`${this.watchPath}/*.json`, {
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
      // TODO: Decide if we want to delete servers when config is removed.
      // For now, we keep them as "inactive" or just leave them.
      // Deleting might destroy manual edits or logs.
      // Safe default: Do nothing.
  }

  async stop(): Promise<void> {
      if (this.watcher) {
          await this.watcher.close();
      }
  }
}

export const mcpConfigWatcherService = new McpConfigWatcherService();
