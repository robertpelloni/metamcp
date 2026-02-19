# Agent Operational Directives

⚠️ **PRIMARY DIRECTIVE**: Refer to [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) for the universal guidelines, architecture, and workflows.

---

## Overview

This file provides operational directives for **all AI agents** (coding assistants, autonomous agents, CI bots) working on MetaMCP. These instructions supplement the universal LLM instructions with agent-specific behavioral guidance.

---

## 🔒 Security Constraints

1. **Policy Middleware**: Always verify policy constraints before executing tools. Every tool call must flow through the policy middleware stack.
2. **Sandbox Isolation**: Never attempt to break out of the `isolated-vm` sandbox. No filesystem, network, or process access from sandboxed code.

---

## 🛠️ Configuration & Storage (v3.7.0+)

1. **Source of Truth**: `mcp.json` is the master record for MCP servers. Do not rely on valid DB state for server configurations.
2. **File-Based Resilience**: API Keys (`api-keys.json`) and Memories (`memories.json`) persist to disk.
3. **Dual-Write**: When modifying configuration via code, ensure `McpConfigService` syncs to both JSON and DB.
4. **Input Validation**: All user-provided input must be validated via Zod schemas before processing.

---

## 🔍 Tool Usage Patterns

### The "Search → Load → Use" Pattern

This is the fundamental interaction pattern for MetaMCP's progressive disclosure:

1. **Search**: Use `search_tools` with a natural language query to discover relevant tools.
2. **Load**: Use `load_tool` to add the discovered tool to your active session.
3. **Use**: Call the loaded tool directly by its namespaced name (`serverName__toolName`).

### Code Mode Best Practices

- Use `run_code` for multi-step operations requiring tool chaining.
- Always use `await mcp.call('tool_name', args)` for tool calls within code.
- Handle errors gracefully — return meaningful error messages.
- Respect the 30-second timeout and 128MB memory limit.

### Agent Mode

- `run_agent` for complex natural language tasks requiring multi-step reasoning.
- Scope access with `policyId` when the agent should have restricted tool access.
- The agent generates code internally — do not nest `run_agent` calls.

---

## 🧠 Memory Guidelines

- Use `search_memory` to retrieve relevant context before starting complex tasks.
- Store important findings, decisions, and patterns as memories for future sessions.
- Memory is namespace-scoped — organize memories by domain/project.

---

## 📋 Session Handoff

When ending a session or handing off to another model:

1. Update `HANDOFF.md` with session summary, changes made, and outstanding items.
2. Commit and push all changes.
3. Document any known issues or ongoing investigations.
4. Reference relevant file paths and line numbers for context.

---

## 🏗️ Code Contribution Standards

1. **TypeScript Strict Mode**: All code must pass `strict: true` compilation.
2. **No Shortcuts**: Never use `as any`, `@ts-ignore`, or suppress type errors.
3. **Error Handling**: Always handle errors explicitly — no empty catch blocks.
4. **Testing**: Write unit tests for all new services in `*.test.ts` files.
5. **Naming**: Follow existing patterns — services use `*.service.ts`, handlers use `*.handler.ts`, middleware uses `*.functional.ts`.
6. **Comment Everything**: Always comment the reason behind the code, what it does, and why it's there.

---

## 🔄 Git Workflow

1. Pull latest before starting work.
2. Make changes incrementally — commit after each logical feature.
3. Include version number in commit messages when bumping.
4. Push after each commit to maintain sync.
5. Update submodules when their upstream has changes.
