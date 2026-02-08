import { describe, it, expect, vi } from "vitest";
import { RegistryService } from "../registry.service";
import fs from "fs/promises";

// Mock fs
vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(() => Promise.resolve(JSON.stringify({
      "https://github.com/test/server": {
        name: "Test Server",
        description: "A test server",
        categories: ["Test"],
        sources: ["source1"]
      },
      "https://github.com/test/server2": {
        name: "Another Server",
        description: "Another one",
        categories: ["Utility"],
        sources: ["source2"]
      }
    })))
  }
}));

describe("RegistryService", () => {
  const registryService = new RegistryService();

  it("should list all registry items", async () => {
    const result = await registryService.listRegistryItems();
    expect(result.total).toBe(2);
    expect(result.items.length).toBe(2);
    expect(result.items[0].name).toBe("Test Server");
  });

  it("should filter by query", async () => {
    const result = await registryService.listRegistryItems({ query: "Another" });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Another Server");
  });

  it("should filter by category", async () => {
    const result = await registryService.listRegistryItems({ category: "Test" });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Test Server");
  });

  it("should get categories", async () => {
    const categories = await registryService.getCategories();
    expect(categories).toContain("Test");
    expect(categories).toContain("Utility");
  });
});
