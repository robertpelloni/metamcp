import * as fs from "fs/promises";
import * as path from "path";
import { CatalogItemSchema } from "@repo/zod-types";
import { z } from "zod";

// Calculate path relative to where the process runs (apps/backend)
const REGISTRY_PATH = path.join(process.cwd(), "../../submodules/mcp-directories/registry.json");

export const catalogImplementations = {
  list: async () => {
    try {
      const content = await fs.readFile(REGISTRY_PATH, "utf-8");
      const data = JSON.parse(content);

      const items: z.infer<typeof CatalogItemSchema>[] = [];
      for (const [url, info] of Object.entries(data)) {
        const i = info as any;
        items.push({
            url,
            name: i.name || "",
            description: i.description || "",
            categories: i.categories || [],
            sources: i.sources || [],
        });
      }
      return items;
    } catch (error) {
        console.error("Failed to read registry.json", error);
        // Fallback to empty array if file missing (e.g. in minimal dev setups)
        return [];
    }
  },
};
