import { describe, it, expect, vi } from "vitest";
import { MemoryService } from "../memory.service";

// Mock DB
vi.mock("../../../db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ uuid: "mock-uuid" }]))
      }))
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([]))
            }))
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ uuid: "mock-uuid" }]))
      }))
    }))
  }
}));

// Mock EmbeddingService
vi.mock("../../ai/embedding.service", () => ({
  embeddingService: {
    generateEmbedding: vi.fn(() => Promise.resolve([0.1, 0.2, 0.3]))
  }
}));

describe("MemoryService", () => {
  const memoryService = new MemoryService();

  it("should save memory", async () => {
    const result = await memoryService.saveMemory("test content", {}, "user-123");
    expect(result).toBeDefined();
    expect(result.uuid).toBe("mock-uuid");
  });

  it("should list memories", async () => {
    const result = await memoryService.listMemories("user-123");
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should delete memory", async () => {
    const result = await memoryService.deleteMemory("mock-uuid", "user-123");
    expect(result).toBeDefined();
  });
});
