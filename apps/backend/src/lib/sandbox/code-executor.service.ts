import ivm from "isolated-vm";

// Type definition for the sandbox tool call function
type SandboxCallTool = (name: string, args: any) => Promise<any>;

export class CodeExecutorService {
  /**
   * Run code in a secure sandbox.
   *
   * @param code The JavaScript/TypeScript code to execute.
   * @param callToolCallback A callback to invoke actual MCP tools from within the sandbox.
   * @param timeoutMs Timeout in milliseconds (default 30s).
   */
  async executeCode(
    code: string,
    callToolCallback: SandboxCallTool,
    timeoutMs: number = 30000,
  ): Promise<any> {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();
    const jail = context.global;

    // Make the global object available as 'global' (like Node.js)
    await jail.set("global", jail.derefInto());

    // Inject console.log
    await jail.set("log", new ivm.Reference((...args: any[]) => {
      console.log("[Sandbox Log]:", ...args);
    }));

    // Inject the tool calling capability
    await jail.set(
      "callTool",
      new ivm.Reference(async (name: string, argsJson: string) => {
        try {
          const args = JSON.parse(argsJson);
          console.log(`[Sandbox] calling tool: ${name}`, args);

          const result = await callToolCallback(name, args);

          // Return the result stringified to avoid transfer issues
          return JSON.stringify(result);
        } catch (error: any) {
            console.error(`[Sandbox] Tool call failed: ${error.message}`);
            // We return a specific error structure or throw
            // If we throw, ivm propagates it.
            throw new Error(error.message);
        }
      }),
    );

    // Setup the script
    // We wrap the user code in an async IIFE to allow top-level await
    const wrappedCode = `
      (async () => {
        // Alias console.log to our injected log
        const console = { log: log.applySync ? (...args) => log.applySync(undefined, args) : log };

        // Helper wrapper for callTool to handle the async/await cleanly
        // We handle JSON serialization here to simplify the boundary crossing
        const mcp = {
          call: async (name, args) => {
             const argsJson = JSON.stringify(args || {});
             const resultJson = await callTool.apply(undefined, [name, argsJson], { result: { promise: true } });
             return JSON.parse(resultJson);
          }
        };

        // User code starts here
        ${code}
      })();
    `;

    try {
      const script = await isolate.compileScript(wrappedCode);
      const result = await script.run(context, { timeout: timeoutMs, promise: true });
      return result;
    } catch (error) {
       console.error("Sandbox execution error:", error);
       throw error;
    } finally {
        context.release();
        isolate.dispose();
    }
  }
}

export const codeExecutorService = new CodeExecutorService();
