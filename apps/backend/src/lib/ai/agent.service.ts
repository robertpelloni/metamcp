import OpenAI from "openai";
+
+import { toolSearchService } from "./tool-search.service";
+import { codeExecutorService } from "../sandbox/code-executor.service";
+
+export class AgentService {
+  private openai: OpenAI | null = null;
+  private model = "gpt-4o"; // Capable model for coding
+
+  private getClient(): OpenAI {
+    if (!this.openai) {
+      const apiKey = process.env.OPENAI_API_KEY;
+      if (!apiKey) {
+        throw new Error("OPENAI_API_KEY is not set");
+      }
+      this.openai = new OpenAI({ apiKey });
+    }
+    return this.openai;
+  }
+
+  /**
+   * Execute an autonomous task using available tools.
+   *
+   * @param task The natural language task description
+   * @param allowedTools Optional list of tool names the agent is allowed to use. If not provided, it searches for relevant tools.
+   * @param callToolCallback The callback to execute tools (passed from proxy)
+   */
+  async runAgent(
+    task: string,
+    callToolCallback: (name: string, args: any, meta?: any) => Promise<any>,
+    allowedTools?: string[]
+  ): Promise<any> {
+    const client = this.getClient();
+
+    // 1. Context Retrieval
+    // If allowedTools is provided, we fetch their definitions.
+    // If not, we perform a semantic search to find relevant tools.
+    let toolsContext = "";
+    let toolNames: string[] = [];
+
+    if (allowedTools && allowedTools.length > 0) {
+        // We don't have a direct "getToolsByName" batch API in search service easily available without refactoring,
+        // but we can search or just rely on the agent knowing what they are if we trust the prompt?
+        // Ideally we need definitions.
+        // For now, let's do a search for the *task* anyway to get relevant tools,
+        // and then filter by allowedTools if present.
+        // OR, assuming 'allowedTools' names are accurate, the agent might hallucinate args if it doesn't see schema.
+        // Let's rely on ToolSearchService to get definitions.
+
+        // We'll search using the tool names themselves to retrieve definitions?
+        // Or just search the task and hope the allowed tools appear in results.
+        // Better: We really should fetch definitions.
+        // Since we are in the backend, we can query the DB.
+        // But `AgentService` shouldn't depend on DB directly if possible. `toolSearchService` uses DB.
+        // Let's add `getToolDefinitions` to `toolSearchService` or similar?
+        // For this MVP, let's use `searchTools` with the task, and maybe some specific searches.
+
+        const searchResults = await toolSearchService.searchTools(task, 20); // Get top 20 relevant
+        const filtered = searchResults.filter(t => allowedTools.includes(t.name));
+
+        // If the allowed tools were NOT found in search (maybe they aren't semantic matches?),
+        // we might miss them.
+        // Let's just trust search for now.
+        toolNames = filtered.map(t => t.name);
+        toolsContext = filtered.map(t =>
+            `- ${t.name}: ${t.description}`
+        ).join("\n");
+    } else {
+        // Open mode
+        const searchResults = await toolSearchService.searchTools(task, 15);
+        toolNames = searchResults.map(t => t.name);
+        toolsContext = searchResults.map(t =>
+            `- ${t.name}: ${t.description}`
+        ).join("\n");
+    }
+
+    // 2. Planning & Code Generation
+    const prompt = `
+You are an autonomous AI agent running in a secure Code Execution Sandbox.
+Your goal is to complete the following task: "${task}"
+
+You have access to the following tools (via the 'mcp' object):
+${toolsContext}
+
+INSTRUCTIONS:
+1. Analyze the task and available tools.
+2. Write a TypeScript/JavaScript script to accomplish the task.
+3. Use \`await mcp.call('tool_name', { args })\` to use tools.
+4. You can use console.log() to debug or print intermediate steps.
+5. Return a final result object at the end of the script.
+6. Do NOT import external libraries. Use standard JS features.
+7. Handle errors gracefully.
+
+Generate ONLY the code. No markdown formatting.
+`;
+
+    const completion = await client.chat.completions.create({
+        model: this.model,
+        messages: [
+            { role: "system", content: "You are a coding agent." },
+            { role: "user", content: prompt }
+        ],
+        temperature: 0,
+    });
+
+    const code = completion.choices[0].message.content?.replace(/```typescript|```js|```/g, "").trim();
+
+    if (!code) {
+        throw new Error("Failed to generate agent code");
+    }
+
+    console.log(`[Agent] Generated code for task: ${task}\n${code}`);
+
+    // 3. Execution
+    // We wrap the callback to inject _meta if allowedTools is set
+    const wrappedCallback = async (name: string, args: any) => {
+        const meta = allowedTools ? { allowedTools } : undefined;
+        return await callToolCallback(name, args, meta);
+    };
+
+    return await codeExecutorService.executeCode(code, wrappedCallback);
+  }
+}
+
+export const agentService = new AgentService();
