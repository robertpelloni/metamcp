import OpenAI from "openai";

import { toolSearchService } from "./tool-search.service";
import { codeExecutorService } from "../sandbox/code-executor.service";
import { policyService } from "../access-control/policy.service";

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
    // We search for relevant tools based on the task
    let searchResults = await toolSearchService.searchTools(task, 15);

    // Filter tools if a policy is active
    if (policyId) {
        const policy = await policyService.getPolicy(policyId);
        if (policy) {
            searchResults = searchResults.filter(tool => 
                policyService.evaluateAccess(policy, tool.name)
            );
        }
    }

    const toolsContext = searchResults.map(t =>
        `- ${t.name}: ${t.description}`
    ).join("\n");

    if (searchResults.length === 0) {
        // Fallback if no tools found? Or just proceed?
        console.warn("[Agent] No tools found for task via search (or all filtered by policy).");
    }

    // 2. Planning & Code Generation
    const prompt = `
You are an autonomous AI agent running in a secure Code Execution Sandbox.
Your goal is to complete the following task: "${task}"

You have access to the following tools (via the 'mcp' object):
${toolsContext}

${policyId ? "NOTE: You are running under a restricted security policy. Access to tools outside your allowed scope will fail." : ""}

INSTRUCTIONS:
1. Analyze the task and available tools.
2. Write a TypeScript/JavaScript script to accomplish the task.
3. Use \`await mcp.call('tool_name', { args })\` to use tools.
4. You can use console.log() to debug or print intermediate steps.
5. Return a final result object at the end of the script.
6. Do NOT import external libraries. Use standard JS features.
7. Handle errors gracefully.
8. If the task is simple, just do it. If complex, break it down.

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
