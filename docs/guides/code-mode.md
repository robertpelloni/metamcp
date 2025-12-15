# Code Mode & Autonomous Agents Guide

MetaMCP provides powerful capabilities to execute code and run autonomous agents directly within your MCP environment. This reduces token usage, latency, and enables complex workflows that would be impossible with standard tool calling.

## Core Concepts

### 1. Code Mode (`run_code`)

The `run_code` tool allows you to execute arbitrary TypeScript/JavaScript code in a secure sandbox (`isolated-vm`).

**Why use it?**
- **Batching:** Perform multiple tool calls in a single round-trip.
- **Logic:** Use loops, conditionals, and data transformation.
- **Filtering:** Fetch large datasets and filter them *before* returning to the LLM context.

**Example Usage:**

```javascript
// Request: run_code
const code = `
  // 1. Fetch data
  const issues = await mcp.call('github__list_issues', { state: 'open' });

  // 2. Filter locally (saves context)
  const urgent = issues.filter(i => i.labels.includes('urgent'));

  // 3. Action
  for (const issue of urgent) {
     await mcp.call('slack__post_message', {
         channel: '#alerts',
         text: \`Urgent issue: \${issue.title}\`
     });
  }

  return { processed: urgent.length };
`;
```

### 2. Autonomous Agent (`run_agent`)

The `run_agent` tool takes a natural language task, discovers the necessary tools, writes its own code, and executes it.

**Why use it?**
- **Abstraction:** "Just do it" without knowing the exact tool names.
- **Self-Correction:** The agent can (in future versions) handle errors and retry.
- **Efficiency:** The LLM powering the agent is optimized for coding.

**Example Usage:**

```json
// Request: run_agent
{
  "task": "Find the latest PR in 'metamcp/core' and summarize the changes using the 'summarizer' tool."
}
```

**How it works:**
1. **Discovery:** MetaMCP searches its Semantic Index (pgvector) for tools relevant to "Find PR", "summarize".
2. **Context:** It retrieves the schemas for `github__list_pull_requests` and `summarizer__summarize`.
3. **Generation:** It prompts an internal LLM (e.g., GPT-4o) to write a script.
4. **Execution:** It runs the script in the `run_code` sandbox.

## Security & Recursion

MetaMCP implements **Recursive Middleware Routing**.

When `run_code` or `run_agent` calls `await mcp.call(...)`, that call is **not** direct. It is routed back through the MetaMCP Proxy Middleware stack.

This means:
1. **Logging:** The internal tool call is logged to `tool_call_logs` (visible in the Inspector).
2. **Auth:** Permissions are checked (future feature).
3. **Safety:** Infinite recursion (calling `run_code` inside `run_code`) is blocked by default.

## Best Practices

1. **Use `save_script`:** If you find a useful `run_code` pattern, save it!
   ```javascript
   await mcp.call('save_script', {
     name: 'daily_standup',
     code: '...',
     description: 'Fetch stats for standup'
   });
   ```
   It will appear as `script__daily_standup` in your tool list.

2. **Keep it stateless:** The sandbox is reset after execution. Do not rely on global variables persisting between calls (unless you use the `memory` MCP server tools).
