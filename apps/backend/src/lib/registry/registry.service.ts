import fs from "fs/promises";
import path from "path";

export interface RegistryItem {
  url: string;
  name: string;
  description: string;
  categories: string[];
  sources: string[];
}

export interface ListRegistryOptions {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export class RegistryService {
  private registryPath = path.resolve(process.cwd(), "submodules/mcp-directories/registry.json");
  private cache: RegistryItem[] | null = null;

  private async loadRegistry(): Promise<RegistryItem[]> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const data = await fs.readFile(this.registryPath, "utf-8");
      const json = JSON.parse(data);

      this.cache = Object.entries(json).map(([url, item]: [string, any]) => ({
        url,
        name: item.name,
        description: item.description,
        categories: item.categories || [],
        sources: item.sources || [],
      }));

      return this.cache!;
    } catch (error) {
      console.error("Failed to load registry:", error);
      return [];
    }
  }

  async listRegistryItems(options: ListRegistryOptions = {}): Promise<{ items: RegistryItem[]; total: number }> {
    const allItems = await this.loadRegistry();
    let filtered = allItems;

    if (options.query) {
      const q = options.query.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q)
      );
    }

    if (options.category) {
        const c = options.category.toLowerCase();
        filtered = filtered.filter(item =>
            item.categories.some(cat => cat.toLowerCase().includes(c))
        );
    }

    const total = filtered.length;
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : undefined;

    const items = filtered.slice(start, end);

    return { items, total };
  }

  async getCategories(): Promise<string[]> {
      const allItems = await this.loadRegistry();
      const categories = new Set<string>();
      allItems.forEach(item => {
          item.categories.forEach(c => categories.add(c));
      });
      return Array.from(categories).sort();
  }
}

export const registryService = new RegistryService();
