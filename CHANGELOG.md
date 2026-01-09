# Changelog

All notable changes to this project will be documented in this file.

## [3.2.3] - 2026-01-09

### Added

- **DISCOVERED_FEATURES.md**: Comprehensive audit of 47+ undocumented features
  - Tool Override System (namespace-scoped customization)
  - Full OAuth 2.0 Server implementation (3 tables)
  - 8 undocumented DB configuration options
  - 4 undocumented API endpoints (Swagger UI, OpenAPI, REST tool execution, /health)
  - 8+ middleware layers documentation
  - Session management internals
  - Clarification: loadedTools FIFO eviction NOT found in code

### Changed

- **LLM_INSTRUCTIONS.md**: Major enhancement with:
  - API Endpoints Reference (REST, Swagger, health)
  - Configuration Reference (DB-stored and environment variables)
  - Middleware Stack documentation
  - Tool Override System documentation
- **ROADMAP.md**: Updated with discovered feature documentation tasks:
  - Added Documentation section (REST API, Config Guide, Tool Override, Middleware)
  - Added Tool Override UI to UI/UX section
  - Added OAuth Server Documentation to Ideas
  - Version history updated

## [3.2.2] - 2026-01-09

### Added

- **MCP Directories Library**: Comprehensive MCP server directory with 951 unique servers
  - Added 6 git submodules:
    - `awesome-mcp-servers-punkpeye` (35k+ ⭐)
    - `awesome-mcp-servers-appcypher` (8k+ ⭐)
    - `awesome-mcp-servers-wong2` (4k+ ⭐)
    - `toolsdk-mcp-registry` (872 entries)
    - `awesome-ai-apps` (2k+ ⭐)
    - `mcp-official-servers` (75k+ ⭐)
  - Generated `REGISTRY_INDEX.md` with deduplicated server list across 44 categories
  - Created `registry.json` for programmatic access
  - Added `WEB_REGISTRIES.md` documenting 7 web-based registries (PulseMCP, Smithery, etc.)
  - Included scripts for URL extraction and deduplication

- **FEATURE_PARITY_PLAN.md**: Comprehensive competitive analysis document
  - Feature matrix comparing MetaMCP to ecosystem tools
  - Token reduction strategies (85-98% achievable)
  - Research findings from Tool RAG, Lazy Loading, Agent Frameworks
  - Priority roadmap for Q1-Q4 2025
  - Key tools analyzed: ToolRAG, MCP Funnel, Zypher, NCP, Plugged.in, MCPM

### Changed

- **ROADMAP.md**: Major update with research-driven features
  - Added Token Optimization section (Hybrid Search, Deferred Loading)
  - Added research-backed planned features
  - New Ideas section with UTCP, Tool Personas, N-to-1 Orchestration
  - Infrastructure section with K8s, OAuth/SSO, Docker Hub

## [3.2.1] - 2026-01-09

### Added

- **DEPENDENCIES.md**: Comprehensive dependency library index with:
  - Star ratings (⭐) for all packages based on quality, docs, and stability
  - Organized by category (Core Framework, Database, MCP/AI, Auth, etc.)
  - Documentation links for every dependency
  - Usage notes and gotchas
  - Version pinning strategy guidelines
  - Troubleshooting common issues
  - Security and performance notes

### Changed

- **ROADMAP.md**: Marked "Dependency Library Index" as completed

## [3.2.0] - 2026-01-09

### Added

- **ROADMAP.md**: Comprehensive feature roadmap with completed, in-progress, and planned features.
- **Enhanced DASHBOARD.md**: Comprehensive project dashboard with:
  - Detailed project structure documentation
  - Git submodule documentation (mcp-shark)
  - Dependency ratings and purpose documentation
  - Build commands and environment variables
- **Session Handoff System**: Documentation protocol for AI model continuity.

### Changed

- **LLM_INSTRUCTIONS.md**: Major enhancement with:
  - Detailed versioning protocol
  - Documentation requirements table
  - Prohibited actions list
  - Architecture component table
  - Git submodule documentation
  - Session handoff guidelines
- **Documentation Structure**: All LLM instruction files now reference universal `LLM_INSTRUCTIONS.md`.

### Documentation

- Added dependency ratings (⭐ relevance system) in DASHBOARD.md
- Added version history summary across documentation
- Synchronized version numbers across all package.json files and VERSION file

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
