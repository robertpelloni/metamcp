import { describe, expect, it, vi } from "vitest";

import { CodeExecutorService } from "./code-executor.service";

describe("CodeExecutorService", () => {
  const codeExecutor = new CodeExecutorService();

  it("should execute simple arithmetic", async () => {
    const code = `
      const a = 10;
      const b = 20;
      return a + b;
    `;
    const mockCallTool = vi.fn();
    const result = await codeExecutor.executeCode(code, mockCallTool);
    expect(result).toBe(30);
  });

  it("should call tools correctly", async () => {
    const code = `
      const result = await mcp.call("test_tool", { value: 123 });
      return result.data;
    `;
    const mockCallTool = vi.fn().mockResolvedValue({ data: "called" });
    const result = await codeExecutor.executeCode(code, mockCallTool);

    expect(mockCallTool).toHaveBeenCalledWith("test_tool", { value: 123 });
    expect(result).toBe("called");
  });

  it("should fail on invalid syntax", async () => {
    const code = `syntax error`;
    const mockCallTool = vi.fn();
    await expect(codeExecutor.executeCode(code, mockCallTool)).rejects.toThrow();
  });

  it("should handle timeout", async () => {
    const code = `
      while(true) {}
    `;
    const mockCallTool = vi.fn();
    await expect(codeExecutor.executeCode(code, mockCallTool, 100)).rejects.toThrow();
  });
});
