# Changelog

All notable changes to this project will be documented in this file.

## [3.3.0] - 2025-12-25

### Added
- **Python Bridge**: Enabled `run_python` to act as an orchestrator. Python scripts can now call MCP tools via `mcp.call()`, unlocking data science workflows.
- **LLM Sampling**: Added `ask_llm` tool for scripts to query LLMs directly. Added MCP Sampling Protocol (`sampling/createMessage`) support.
- **Scripts Editor (IDE)**: Full-featured Monaco Editor in the UI with IntelliSense (Type-Safe `mcp` object) and Create/Edit/Run lifecycle.
- **Type Generation**: `ToolTypeGenerator` creates TypeScript definitions for discovered tools, injected into the Agent's context.
- **Agent Thought Streaming**: Agent UI now streams tool calls and "Thoughts" in real-time, providing immediate feedback.
- **Notifications**: Full-stack notification system (`notify_user`) and frontend alert center.
- **Context RAG**: Agent now automatically searches `memories` and injects relevant context into the system prompt.
- **Configurability**: Added `AGENT_MODEL` and `DESCRIPTION_MODEL` environment variables.

### Changed
- **Logging**: Enhanced `tool_call_logs` to support "Pending" state and updates, enabling real-time status tracking.
- **Frontend**: Polished Agent UI with collapsible thought bubbles and JSON payload inspection.

## [3.2.0] - 2025-12-15

### Added
- **Task Scheduler**: New `scheduled_tasks` table and `SchedulerService` to run Agents or Scripts on a cron schedule. Added `schedule_task` meta-tool.
- **Long-Term Memory**: New `memories` table and `MemoryService` using `pgvector` for saving/searching text content. Added `save_memory` and `search_memory` meta-tools.
- **Policy Discovery**: Added `list_policies` meta-tool so Agents can discover available security scopes for sub-task delegation.
- **Agent Evolution**: Updated Agent System Prompt to be aware of its new Scheduling, Memory, and Sub-Agent capabilities.

### Changed
- **Proxy**: Refactored `metamcp-proxy.ts` to include the new meta-tools.
- **Database**: Added `memories` and `scheduled_tasks` tables.

## [3.1.0] - 2025-12-15

### Added
- **Config Watcher**: New service `McpConfigWatcherService` that watches `/app/config/mcp/*.json` and auto-imports server configurations.
- **Agent Chat UI**: Dedicated frontend page (`/agent`) for interacting with the Autonomous Agent.
- **Agent Optimization**: Agent now requests `_meta: { toon: true }` for data-heavy tools to save tokens.
- **Frontend Policies**: Policy management UI (`/policies`) connected to backend via TRPC.

### Changed
- **Config**: Bumped version to 3.1.0.
- **Agent Execution**: Updated sandbox to support passing `_meta` arguments to tools.

## [3.0.0] - 2025-12-15

### Added
- **Autonomous Agent**: New `run_agent` tool that uses an LLM to generate and execute code for natural language tasks.
- **Policy Engine**: Access control system for agents (subagents) to restrict tool usage based on allow/deny patterns.
- **Code Mode**: Secure, sandboxed JavaScript/TypeScript execution via `isolated-vm` with `run_code` tool.
- **Semantic Tool Search**: `search_tools` uses OpenAI embeddings and `pgvector` to find tools by description.
- **Progressive Disclosure**: The MCP Hub now hides downstream tools by default, exposing only meta-tools to save context.
- **Tool Sets**: Ability to save and load groups of tools as profiles.
- **Saved Scripts**: Ability to save successful code snippets as reusable tools.
- **Traffic Inspection**: Persistent logging of tool calls, arguments, and results to Postgres, visible in "Live Logs".
- **MCP Shark Integration**: Added `mcp-shark` as a sidecar service for advanced traffic inspection.
- **UI Improvements**: New sidebar links for Policies, Scripts, Tool Sets, and Live Logs.
- **Configuration**: Added `CODE_EXECUTION_MEMORY_LIMIT` environment variable.

### Changed
- **Infrastructure**: Switched database to `pgvector/pgvector:pg16` to support vector embeddings.
- **Proxy Logic**: Refactored `metamcp-proxy.ts` to support recursive middleware routing for sandboxed code.
- **Logging**: Enhanced logging middleware to capture execution duration and errors.

### Fixed
- **Memory Leaks**: Implemented FIFO eviction for `loadedTools` in proxy sessions.
- **Error Handling**: Improved error reporting in `run_code` to include stack traces.
