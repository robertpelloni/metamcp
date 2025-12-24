import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { agentService } from "../../ai/agent.service";
import { codeExecutorService } from "../../sandbox/code-executor.service";
import { pythonExecutorService } from "../../sandbox/python-executor.service";
import { MetaToolContext } from "./meta-tools.handler";
import { pythonBridgeService } from "../python-bridge";

export const handleExecutionTools = async (
    name: string,
    args: any,
    meta: any,
    context: MetaToolContext
): Promise<CallToolResult | null> => {

    if (name === "run_code") {
        const { code } = args as { code: string };
        try {
            const result = await codeExecutorService.executeCode(
                code,
                async (toolName, toolArgs, toolMeta) => {
                    if (["run_code", "run_agent", "run_python"].includes(toolName)) {
                        throw new Error("Recursive execution restricted.");
                    }
                    const res = await context.recursiveHandler(toolName, toolArgs, toolMeta);
                    return res;
                }
            );
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) {
            return {
                content: [{ type: "text", text: `Error: ${e.message}\nStack: ${e.stack}` }],
                isError: true
            };
        }
    }

    if (name === "run_python") {
        const { code } = args as { code: string };
        try {
            // Setup Bridge
            const token = randomUUID();
            const callbackUrl = `http://localhost:12009/internal/python-bridge/call`; // Internal URL

            // Register handler
            pythonBridgeService.registerHandler(token, async (toolName, toolArgs, toolMeta) => {
                 if (["run_code", "run_agent", "run_python"].includes(toolName)) {
                     throw new Error("Recursive execution restricted.");
                 }
                 const res = await context.recursiveHandler(toolName, toolArgs, toolMeta);
                 // We need to unwrap result content for Python simplicity?
                 // Or return full result. Python client should parse.
                 return res;
            });

            // Inject Preamble
            const preamble = `
import os
import json
import urllib.request
import urllib.error

class MCPClient:
    def __init__(self):
        self.url = os.environ.get("METAMCP_CALLBACK_URL")
        self.token = os.environ.get("METAMCP_CALLBACK_TOKEN")

    def call(self, name, args={}, meta={}):
        if not self.url or not self.token:
            raise Exception("MCP Bridge not configured")

        payload = {
            "token": self.token,
            "name": name,
            "args": args,
            "meta": meta
        }

        req = urllib.request.Request(
            self.url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                if "error" in result:
                    raise Exception(result["error"])
                return result["result"]
        except urllib.error.HTTPError as e:
            raise Exception(f"HTTP Error: {e.code} {e.reason}")
        except Exception as e:
            raise Exception(f"Bridge Error: {str(e)}")

mcp = MCPClient()
`;

            const fullCode = `${preamble}\n\n${code}`;

            const result = await pythonExecutorService.execute(fullCode, {
                METAMCP_CALLBACK_URL: callbackUrl,
                METAMCP_CALLBACK_TOKEN: token
            });

            // Cleanup
            pythonBridgeService.unregisterHandler(token);

            return { content: [{ type: "text", text: result }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Python Error: ${e.message}` }], isError: true };
        }
    }

    if (name === "run_agent") {
        const { task, policyId } = args as { task: string; policyId?: string };
        try {
            const result = await agentService.runAgent(
                task,
                async (toolName, toolArgs, toolMeta) => {
                    if (["run_code", "run_agent", "run_python"].includes(toolName)) {
                         throw new Error("Recursive execution restricted.");
                    }
                    const callMeta = { ...toolMeta, ...(policyId ? { policyId } : {}) };
                    const res = await context.recursiveHandler(toolName, toolArgs, callMeta);
                    return res;
                },
                policyId
            );
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (e: any) {
            return {
                content: [{ type: "text", text: `Agent Error: ${e.message}\nStack: ${e.stack}` }],
                isError: true
            };
        }
    }

    // Saved Scripts
    if (name.startsWith("script__")) {
        const scriptName = name.replace("script__", "");
        // We need savedScriptService. Accessing it via import.
        const { savedScriptService } = await import("../../sandbox/saved-script.service");
        const script = await savedScriptService.getScript(scriptName);

        if (script) {
             try {
                const result = await codeExecutorService.executeCode(
                    script.code,
                    async (toolName, toolArgs, toolMeta) => {
                        if (toolName.startsWith("script__") || ["run_code", "run_agent", "run_python"].includes(toolName)) {
                            throw new Error("Recursive execution restricted.");
                        }
                        const res = await context.recursiveHandler(toolName, toolArgs, toolMeta);
                        return res;
                    }
                );
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: "text", text: `Script Error: ${e.message}` }], isError: true };
            }
        }
    }

    return null;
}
