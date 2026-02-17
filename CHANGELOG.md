# Changelog

All notable changes to this project will be documented in this file.

## [3.6.3] - 2026-02-17

### Changed
- **mcp.json Live Synchronization Reliability**:
  - Hardened `mcp.json` hot-reload reconcile flow in `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.ts`.
  - Added tracking for changed server UUIDs during create/update/remove reconciliation.
  - Improved internal map updates during reconciliation to keep in-memory name lookup current.

### Fixed
- **Namespace Runtime Refresh After mcp.json Changes**:
  - Added namespace impact detection via server-to-namespace mappings after `mcp.json` sync.
  - Added automatic invalidation of idle namespace servers and OpenAPI sessions for affected namespaces.
  - Added tool override cache clearing for affected namespaces so tool availability updates are reflected immediately.

## [3.6.2] - 2026-02-16

### Fixed
- **Frontend Build Type Regressions**:
  - Fixed log timestamp compatibility between serialized tRPC responses and UI rendering in `components/log-entry.tsx`.
  - Updated `api-keys` page to use the mounted `trpc.frontend.apiKeys.*` namespace.
  - Restored missing `DomainWarningBanner` import on registration page.
  - Updated all `useConnection` call sites to pass required `command` / `args` / `env` options after hook contract changes.
  - Fixed OAuth provider initialization by passing `serverUrl` into `createAuthProvider`.

### Changed
- **Validation Outcome**:
  - Next.js type/lint validation now completes successfully.
  - Added a Windows platform guard in `apps/frontend/next.config.js` to skip `output: "standalone"` on `win32`, preventing local `EPERM` symlink failures during trace copy while preserving standalone output for non-Windows builds.

## [3.6.1] - 2026-02-16

### Added
- **Frontend Router Namespace Coverage**: Mounted previously unwired frontend namespaces in active runtime contract and backend mounting:
  - `analytics`, `audit`, `autoDiscovery`, `autoReconnect`, `catalog`, `memories`, `registry`, `system`.
- **Database Schema Alignment**: Restored missing active schema definitions for:
  - `audit_logs` (`auditLogsTable`)
  - `memories` (`memoriesTable`)

### Changed
- **tRPC Contract Convergence**:
  - Updated `packages/trpc/src/routers/frontend/index.ts`
  - Updated `packages/trpc/src/router.ts`
  - Updated `apps/backend/src/routers/trpc.ts`
- **Zod Type Exports**: Expanded `packages/zod-types/src/index.ts` exports so all mounted frontend router schemas resolve correctly.
- **Memory Implementation Correctness**: Fixed argument mapping/signature usage in `apps/backend/src/trpc/memories.impl.ts`.
- **Documentation Realignment**:
  - Updated `docs/ROADMAP.md`, `DASHBOARD.md`, `TODO.md`, `HANDOFF.md` with current implementation state and progress.

### Fixed
- **Dead Logs Route Removal**: Deleted unmounted legacy mock route `apps/backend/src/routers/logs.ts` to avoid API-path ambiguity.
- **Build Integrity After Wiring**: Resolved compile issues caused by missing schema exports/references after namespace mounting.

## [3.6.0] - 2026-02-12

### Added
- **Dark Mode in Sidebar**: Added `ThemeToggle` component to the main sidebar layout, completing dark mode support across the entire application.
- **Dynamic Version Display**: Sidebar footer now reads version from `package.json` instead of hardcoded string.

### Changed
- **Documentation Overhaul**: Comprehensive rewrite of all LLM instruction files:
  - `LLM_INSTRUCTIONS.md` — expanded to ~200 lines with architecture, env vars, coding standards, user directives.
  - `AGENTS.md` — detailed operational guidelines for security, tool patterns, memory, and session handoff.
  - `CLAUDE.md`, `GEMINI.md`, `GPT.md`, `copilot-instructions.md` — model-specific strengths and codebase conventions.
- **VISION.md**: Fixed duplicated "Three Pillars" section, updated to v3.0.0.
- **DASHBOARD.md**: Updated all versions to 3.6.0, added complete submodule listing with URLs.
- **ROADMAP.md**: Marked Dark Mode as completed.

### Fixed
- **Merge Conflicts**: Resolved leftover merge conflict markers in root `package.json` from docker-in-docker/docker-per-mcp branch merges.
- **Submodule References**: Added missing `.gitmodules` entries for `cointrade` and `mcp-directories` submodules.

## [3.5.0] - 2025-12-25

### Added
- **Bobcoin Integration**: Added `bobcoin` submodule as the foundation for the decentralized economy layer.
- **Vision Documentation**: Added `docs/BOBCOIN_VISION.md` detailing the cryptocurrency and mesh network architecture.

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
