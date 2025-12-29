# Changelog

All notable changes to this project will be documented in this file.

## [3.4.0] - 2025-12-25

### Infrastructure
- **Docker Modernization**: Updated database image to `pgvector/pgvector:pg17` for improved performance and latest vector search features.
- **Python Hardening**: Updated `Dockerfile` to explicitly install `python3-pip` and `python3-venv` for robust Code Mode execution.
- **Sandbox Security**: Hardened `pythonExecutorService` with existence checks, configurable timeouts (via `MCP_TIMEOUT`), and environment variable sanitization to prevent secret leakage.

### Added
- **Dashboard**: Added `DASHBOARD.md` to document the monorepo structure and service status.

## [3.1.0] - 2025-12-27

### Added
- **Agent Implementation**: Added core agent functionality including `agent.impl.ts` and `agent.zod.ts`.
- **Dashboard**: Added `docs/DASHBOARD.md` listing all submodules and project structure.

### Changed
- **Upstream Sync**: Merged latest changes from upstream `main` branch.
- **Schemas**: Updated Zod schemas to support agent features.

## [3.0.3] - 2025-12-27

### Changed
- **Enhanced Indexing**: Updated `DescriptionEnhancerService` to generate "Synthetic User Queries" along with rich descriptions. This significantly improves semantic search accuracy by matching user intent.

## [3.0.2] - 2025-12-27

### Added
- **Policy Engine**: Full implementation of Policy Management.
    - Added TRPC router for Policies (List, Create, Update, Delete).
    - Updated Frontend `PoliciesPage` to use real data.
    - Updated `AgentService` to filter tool search results based on the active policy.

## [3.0.1] - 2025-12-27

### Changed
- **Documentation**: Refactored LLM instructions into a universal `LLM_INSTRUCTIONS.md` file.
- **Versioning**: Implemented centralized versioning via `VERSION` file.
- **Project Structure**: Added `docs/PROJECT_STRUCTURE.md`.

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
