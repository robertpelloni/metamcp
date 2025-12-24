import OpenAI from "openai";

import { toolSearchService } from "./tool-search.service";
import { codeExecutorService } from "../sandbox/code-executor.service";
import { policyService } from "../access-control/policy.service";
import { memoryService } from "./memory.service";

export class AgentService {
  private openai: OpenAI | null = null;
  private model = "gpt-4o"; // Capable model for coding

  private getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Execute an autonomous task using available tools.
   *
   * @param task The natural language task description
   * @param callToolCallback The callback to execute tools (passed from proxy)
   * @param policyId Optional policy ID to restrict the agent
   */
  async runAgent(
    task: string,
    callToolCallback: (name: string, args: any, meta?: any) => Promise<any>,
    policyId?: string
  ): Promise<any> {
    const client = this.getClient();

    // 1. Context Retrieval
    // A. Search for relevant tools
    let searchResults = await toolSearchService.searchTools(task, 15);

    // Filter by Policy if active
    if (policyId) {
        try {
            const policy = await policyService.getPolicy(policyId);
            if (policy) {
                searchResults = searchResults.filter(t =>
                    policyService.evaluateAccess(policy, t.name)
                );
                console.log(`[Agent] Filtered tools by policy '${policy.name}'. Remaining: ${searchResults.length}`);
            } else {
                console.warn(`[Agent] Policy ID ${policyId} not found. Proceeding with full access context (enforcement will still apply).`);
            }
        } catch (e) {
            console.error("[Agent] Error applying policy filter:", e);
        }
    }

    // B. Search for relevant memories (Context RAG)
    let memoryContext = "";
    try {
        const memories = await memoryService.searchMemory(task, 5, 0.6); // Higher threshold for relevance
        if (memories.length > 0) {
            memoryContext = "RELEVANT MEMORIES:\n" + memories.map(m => `- ${m.content}`).join("\n");
            console.log(`[Agent] Found ${memories.length} relevant memories.`);
        }
    } catch (error) {
        console.warn("[Agent] Failed to search memories:", error);
    }

    const toolsContext = searchResults.map(t =>
        `- ${t.name}: ${t.description}`
    ).join("\n");

    if (searchResults.length === 0) {
        console.warn("[Agent] No tools found for task via search.");
    }

    // 2. Planning & Code Generation
    const prompt = `
You are an autonomous AI agent running in a secure Code Execution Sandbox.
Your goal is to complete the following task: "${task}"

${memoryContext ? memoryContext + "\n" : ""}

You have access to the following tools (via the 'mcp' object):
${toolsContext}

${policyId ? "NOTE: You are running under a restricted security policy. Access to tools outside your allowed scope will fail." : ""}

INSTRUCTIONS:
1. Analyze the task and available tools.
2. Write a TypeScript/JavaScript script to accomplish the task.
3. Use \`await mcp.call('tool_name', { args }, { toon: true })\` if calling tools that return large lists or data (like filesystem lists, database rows, or git logs). This uses TOON format to save tokens.
4. Otherwise use \`await mcp.call('tool_name', { args })\`.
5. You can use console.log() to debug or print intermediate steps.
6. Return a final result object at the end of the script.
7. Do NOT import external libraries. Use standard JS features.
8. Handle errors gracefully.
9. If the task is simple, just do it. If complex, break it down.

CAPABILITIES:
- **Long-Term Memory**: Use \`save_memory\` and \`search_memory\` to store and retrieve information across sessions.
- **Scheduling**: Use \`schedule_task\` to run this agent or scripts periodically.
- **Sub-Agents**: Use \`list_policies\` to discover available scopes, and use \`run_agent(task, policyId)\` to spawn restricted sub-agents for specialized tasks.
- **Python**: Use \`run_python\` for data analysis, math, or **tool orchestration**.
  - The Python environment includes a pre-configured \`mcp\` object.
  - You can call tools from Python: \`result = mcp.call('tool_name', {'arg': 'val'})\`.
  - This is useful for data science workflows where you fetch data via MCP, process it with pandas/numpy, and save it via MCP.

Generate ONLY the code. No markdown formatting.
`;

    const completion = await client.chat.completions.create({
        model: this.model,
        messages: [
            { role: "system", content: "You are a coding agent." },
            { role: "user", content: prompt }
        ],
        temperature: 0,
    });

    // Log Token Usage
    if (completion.usage) {
        console.log(`[Agent] Token Usage - Prompt: ${completion.usage.prompt_tokens}, Completion: ${completion.usage.completion_tokens}, Total: ${completion.usage.total_tokens}`);
    }

    const code = completion.choices[0].message.content?.replace(/```typescript|```js|```/g, "").trim();

    if (!code) {
        throw new Error("Failed to generate agent code");
    }

    console.log(`[Agent] Generated code for task: ${task}\n${code}`);

    // 3. Execution
    return await codeExecutorService.executeCode(code, callToolCallback);
  }
}

export const agentService = new AgentService();
