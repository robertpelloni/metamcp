import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

type ToolHandler = (
    toolName: string,
    toolArgs: Record<string, unknown>,
    toolMeta: Record<string, unknown>
) => Promise<CallToolResult>;

/**
 * Python Bridge Service — in-memory handler registry for Python-to-MCP callbacks.
 * When `run_python` is invoked, a handler is registered with a unique token.
 * Python code calls back via HTTP with that token, and the bridge dispatches
 * to the registered handler for recursive tool execution.
 */
class PythonBridgeService {
    private handlers = new Map<string, ToolHandler>();

    registerHandler(token: string, handler: ToolHandler): void {
        this.handlers.set(token, handler);
    }

    unregisterHandler(token: string): void {
        this.handlers.delete(token);
    }

    getHandler(token: string): ToolHandler | undefined {
        return this.handlers.get(token);
    }

    async handleCall(
        token: string,
        toolName: string,
        toolArgs: Record<string, unknown>,
        toolMeta: Record<string, unknown>
    ): Promise<CallToolResult> {
        const handler = this.handlers.get(token);
        if (!handler) {
            throw new Error(`No handler registered for token: ${token}`);
        }
        return handler(toolName, toolArgs, toolMeta);
    }
}

export const pythonBridgeService = new PythonBridgeService();