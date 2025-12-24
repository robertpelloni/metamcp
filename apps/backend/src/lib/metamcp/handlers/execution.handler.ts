import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { agentService } from "../../ai/agent.service";
import { codeExecutorService } from "../../sandbox/code-executor.service";
import { pythonExecutorService } from "../../sandbox/python-executor.service";
import { MetaToolContext } from "./meta-tools.handler";

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
            const result = await pythonExecutorService.execute(code);
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
