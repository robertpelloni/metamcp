# Changelog

All notable changes to this project will be documented in this file.

## [3.2.12] - 2026-01-09

### Added

- **submodules/mcpdir**: Added [mcpdir](https://github.com/eL1fe/mcpdir) as git submodule
  - 7,600+ MCP servers indexed from 5+ sources (MCP Registry, npm, GitHub, Glama, PulseMCP)
  - Powers [mcpdir.dev](https://mcpdir.dev) directory website
- **submodules/mcp-directories/scripts/extract-mcpdir.py**: Extraction script for mcpdir data
  - Parses `data/pulsemcp-slugs.json` structured server data
  - Generates `MCPDIR_INDEX.md` with categorized server listings
  - Outputs `mcpdir-servers.json` for programmatic access
- **submodules/mcp-directories/MCPDIR_INDEX.md**: Generated index of 7,642 servers
  - 1,002 Official servers, 22 Reference implementations, 6,618 Community servers
  - Top servers by stars table (MarkItDown 85k, Netdata 77k, etc.)

### Changed

- **submodules/mcp-directories/README.md**: Updated to include mcpdir in registry sources
- **LLM_INSTRUCTIONS.md**: Added mcpdir to Git Submodules documentation
  - New MCP Server Directories section explaining aggregation sources

## [3.2.11] - 2026-01-09

### Added

- **apps/backend/src/lib/ai/hybrid-search.service.ts**: Hybrid search combining keyword and semantic search
  - `HybridSearchService` class with RRF (Reciprocal Rank Fusion) algorithm
  - `search()` method combining keyword + vector search with configurable options
  - `quickSearch()` for fast keyword-only search (no embedding API call)
  - `deepSearch()` for high-accuracy semantic-heavy search
  - RRF formula: `score(d) = Σ 1/(k + rank_i(d))` with k=60 (standard constant)
  - Supports `keywordOnly` and `semanticOnly` modes
  - Over-fetches 2x candidates for better fusion results

### Changed

- **tool-search.service.ts**: Extended with hybrid search methods
  - Added `hybridSearch()`, `quickSearch()`, `deepSearch()` methods
  - Re-exports `HybridSearchResult` and `HybridSearchOptions` types
  - Original `searchTools()` method preserved for backward compatibility

## [3.2.10] - 2026-01-09

### Added

- **docs/DEVELOPMENT.md**: Comprehensive development guide (~350 lines)
  - Hot reload architecture documentation
  - Development scripts reference table
  - Isolated development workflows (backend-only, frontend-only)
  - Debugging setup for VS Code
  - Performance optimization tips
  - Troubleshooting common issues
  - IDE configuration recommendations
  - Common workflow guides (API endpoints, MCP tools, DB schema)

- **docs/WORKSPACE_VISION_SUMMARY.md**: Consolidated vision documentation
  - MetaMCP's position within AIOS ecosystem
  - Three pillars overview (AIOS, MetaMCP, Bobcoin)
  - "Mecha Suit" architecture explanation
  - Strategic alignment with workspace goals

### Changed

- **turbo.json**: Enhanced task configuration
  - Added `dependsOn: ["^dev"]` to dev task for proper package ordering
  - Added `dev:backend` and `dev:frontend` tasks for isolated development

- **package.json** (root): Added isolated dev scripts
  - `dev:backend`: Start backend only via turborepo filter
  - `dev:frontend`: Start frontend only via turborepo filter

- **apps/backend/package.json**: Improved hot reload
  - Added `--clear-screen=false` to tsx watch for cleaner output
  - Added `dev:backend` script alias

- **apps/frontend/package.json**: Added `dev:frontend` script alias

## [3.2.9] - 2026-01-09

### Added

- **packages/zod-types/src/config-schemas.zod.ts**: JSON Schema validation for configuration files
  - `ClaudeDesktopConfigSchema` for claude_desktop_config.json validation
  - `ClaudeStdioServerSchema` and `ClaudeSseServerSchema` for MCP server definitions
  - `EnvVarsSchema` and `HttpHeadersSchema` for server configuration
  - Config key validators: `TimeoutConfigValueSchema`, `MaxAttemptsConfigValueSchema`, `SessionLifetimeConfigValueSchema`
  - `validateClaudeDesktopConfig()` function for full config validation
  - `validateConfigValue()` for individual config key validation
  - Type guards: `isStdioServer()`, `isSseServer()`

### Changed

- **config-import.service.ts**: Now uses JSON Schema validation
  - Validates entire config structure before import
  - Clear error messages with paths to invalid fields
  - Type-safe server definition parsing

## [3.2.8] - 2026-01-09

### Added

- **apps/backend/src/lib/errors.ts**: Comprehensive error handling system (~350 lines)
  - `MetaMCPError` base class with error codes, context, timestamps, and serialization
  - Typed error classes: `NotFoundError`, `AlreadyExistsError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`
  - MCP-specific errors: `MCPConnectionError`, `MCPTimeoutError`, `ToolExecutionError`, `MCPServerCrashedError`
  - Domain errors: `PolicyNotFoundError`, `ToolBlockedByPolicyError`, `DatabaseError`, `ConfigError`
  - Utility functions: `wrapError()`, `isMetaMCPError()`, `getErrorMessage()`, `createErrorResponse()`, `logError()`
  - `ErrorCode` enum with 25+ categorized error codes

### Changed

- **policies.impl.ts**: Added comprehensive error handling
  - Try/catch blocks on all operations (list, create, update, delete)
  - `NotFoundError` for missing policies
  - `ValidationError` for duplicate names and constraint violations
  - Structured logging with operation context

- **config.impl.ts**: Added validation and error handling
  - Input validation for timeout ranges (1s-1h for MCP, 1s-2h for max total)
  - Input validation for max attempts (1-10)
  - Input validation for session lifetime (1min-1year)
  - `ConfigError` for invalid configuration keys
  - Structured logging on all operations

- **logs.impl.ts**: Improved error handling with `DatabaseError`
- **tool-sets.impl.ts**: Added `NotFoundError` checks before delete
- **saved-scripts.impl.ts**: Added `NotFoundError` checks before delete

## [3.2.7] - 2026-01-09

### Added

- **docs/MIDDLEWARE.md**: Comprehensive middleware development guide (~600 lines)
  - Core architecture: MetaMCPHandlerContext, handler types, middleware signatures
  - Middleware composition with `compose()` function and execution flow diagrams
  - Built-in middleware documentation: logging, policy, filter-tools, tool-overrides
  - Custom middleware patterns using `createFunctionalMiddleware()` factory
  - Caching strategies with TTL recommendations (ToolStatusCache, ToolOverridesCache)
  - 5 example implementations: request validation, audit trail, response sanitization, timeout, feature flags

### Changed

- **LLM_INSTRUCTIONS.md**: Added reference to MIDDLEWARE.md in Middleware Stack section
- **ROADMAP.md**: Marked "Middleware Development Guide" as completed

## [3.2.6] - 2026-01-09

### Added

- **docs/CONFIGURATION.md**: Comprehensive configuration guide (~450 lines)
  - Database-stored settings: authentication, MCP timeouts, session management
  - Environment variables: DATABASE_URL, OPENAI_API_KEY, CODE_EXECUTION_MEMORY_LIMIT
  - OIDC/SSO configuration with provider-specific examples (Okta, Auth0, Google, Azure AD, Keycloak)
  - Per-endpoint authentication options (API key, OAuth, query parameter auth)
  - Configuration management via Admin UI and tRPC API
  - Configuration precedence documentation
  - Production deployment examples (minimal, SSO, high-availability, air-gapped)

### Changed

- **LLM_INSTRUCTIONS.md**: Added reference to CONFIGURATION.md
  - Added "Full Documentation" link at top of Configuration Reference section
  - Added OIDC provider examples note with link to detailed setup instructions
- **ROADMAP.md**: Marked "Configuration Guide" as completed

## [3.2.5] - 2026-01-09

### Added

- **docs/REST_API.md**: Comprehensive REST API documentation
  - OpenAPI/Swagger UI documentation (`/metamcp/:endpoint/api`)
  - Tool execution endpoints (GET/POST `/metamcp/:endpoint/api/:tool_name`)
  - MCP transport endpoints (SSE, Streamable HTTP)
  - Authentication methods (API Key, OAuth 2.0, query parameter)
  - Session management and lifecycle
  - Error handling and HTTP status codes
  - Code examples (cURL, Python, JavaScript, HTTPie)

### Changed

- **LLM_INSTRUCTIONS.md**: Updated to reference REST_API.md
  - Added link to REST API documentation
  - Added quick start examples for REST API usage
  - Corrected OpenAPI version to 3.1.0
- **ROADMAP.md**: Marked "REST API Documentation" as completed
  - Removed "Tool Override Documentation" (completed in v3.2.4)

## [3.2.4] - 2026-01-09

### Changed

- **ROADMAP.md**: Moved "Tool Override UI" from Planned to Completed
  - Added new "Tool Customization" section under Completed Features
  - Tool Override System and UI are fully implemented (not planned)
- **DISCOVERED_FEATURES.md**: Updated Tool Override System status
  - Changed from "Schema exists, implementation status unclear" to "Fully Implemented"
  - Added implementation details: backend API location, frontend UI component paths
  - Updated documentation gap status to reflect ROADMAP.md addition

### Documentation

- Corrected feature audit findings based on codebase verification
- Tool Override UI exists in `enhanced-namespace-tools-table.tsx` (1300+ lines)
- Backend API: `namespaces.impl.ts` → `updateToolOverrides()` (lines 585-647)

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
