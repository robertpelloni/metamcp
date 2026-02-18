
import fs from "fs/promises";
import path from "path";
import { EventEmitter } from "events";
import logger from "../utils/logger";

export class JsonStore<T> extends EventEmitter {
    private filePath: string;
    private data: T | null = null;
    private savePromise: Promise<void> | null = null;

    constructor(filename: string, private defaultValue: T) {
        super();
        this.filePath = path.resolve(process.cwd(), filename);
    }

    async init() {
        try {
            await fs.access(this.filePath);
            const content = await fs.readFile(this.filePath, "utf-8");
            this.data = JSON.parse(content);
        } catch (error) {
            if ((error as any).code === "ENOENT") {
                logger.info(`[JsonStore] ${this.filePath} not found. Creating default.`);
                this.data = this.defaultValue;
                await this.save(true);
            } else {
                throw error;
            }
        }
    }

    get(): T {
        if (!this.data) {
            throw new Error(`JsonStore for ${this.filePath} not initialized. Call init() first.`);
        }
        return this.data;
    }

    async set(data: T) {
        this.data = data;
        await this.save();
        this.emit("updated", this.data);
    }

    async update(updater: (data: T) => T) {
        if (!this.data) await this.init();
        this.data = updater(this.data!);
        await this.save();
        this.emit("updated", this.data);
    }

    private async save(force = false) {
        // Simple debounce/queueing to avoid race conditions on write
        if (this.savePromise && !force) {
            return this.savePromise;
        }

        this.savePromise = (async () => {
            try {
                await fs.writeFile(
                    this.filePath,
                    JSON.stringify(this.data, null, 2),
                    "utf-8"
                );
            } catch (err) {
                logger.error(`[JsonStore] Failed to write to ${this.filePath}:`, err);
            } finally {
                this.savePromise = null;
            }
        })();

        return this.savePromise;
    }
}
