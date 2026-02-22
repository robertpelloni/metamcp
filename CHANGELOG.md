# Changelog

All notable changes to this project will be documented in this file.

## [3.11.0] - 2026-01-26

### Added

- **Dynamic Rate Limiting**: Configurable request limits per user/tool
  - **Backend**: `rate_limits` table and `RateLimitService`
  - **Frontend**: `/settings/rate-limits` page for managing rules
  - **Middleware**: Updated to use dynamic rules from database
  - **Features**: Glob pattern matching, custom windows/limits, active toggle

- **Tool Personas**: Enhanced Tool Sets (Profiles)
  - **Backend**: `icon`, `color`, `is_public` fields added to `tool_sets` schema
  - **Frontend**: New grid view with visual cards, Edit Dialog, and Search
  - **Features**: Create, Update, Delete personas with custom icons and colors

- **System Dashboard Enhancement**: Comprehensive project visibility
  - **Backend**: Dynamic `.gitmodules` parsing to list all submodules and versions
  - **Frontend**: New "Project Structure" tab explaining the monorepo layout

## [3.10.0] - 2026-01-26

### Added

- **Tool Sets Foundation**: Initial implementation of Tool Sets (Profiles)
  - **Backend**: `tool_sets` table and `ToolSetService`
  - **Frontend**: Basic list view
  - **Tools**: `save_tool_set` and `load_tool_set` meta-tools

## [3.6.0] - 2026-01-26

### Added

- **Audit Logging System**: Security and administrative event tracking
  - **Backend**: `audit_logs` table and `AuditService`
  - **Frontend**: `/audit` page for viewing security events
  - **Features**: Tracks Policy changes, Server installations, Config updates, and Logins

- **Rate Limiting Middleware**: Protection against abuse
  - **Service**: `RateLimiterService` using in-memory token bucket
  - **Middleware**: `rate-limit.functional.ts` integrated into Proxy
  - **Default**: 60 requests per minute per user/session

## [3.7.0] - 2026-01-26

### Added

- **Cost Tracking**: Estimate and track LLM usage costs
  - **Backend**: `CostTrackingService` and `llm_usage_logs` table
  - **UI**: New "Cost & Usage" tab in Observability dashboard
  - **Integration**: Tracks usage for Agent (GPT-4o) and Embeddings (text-embedding-3-small)

## [3.9.0] - 2026-01-26

### Added

- **Scheduled Tasks System**: Automate tool execution and agent tasks
  - **Backend**: `SchedulerService` (node-cron), `scheduled_tasks` table
  - **Frontend**: `/scheduler` page for managing CRON jobs
  - **Features**: Support for Agent Tasks (prompts) and Tool Calls (future)

- **Notification System**: Real-time user alerts
  - **Backend**: `NotificationService`, `notifications` table
  - **Frontend**: `NotificationBell` component in sidebar
  - **Features**: Unread count badge, mark as read, auto-polling

## [3.8.0] - 2026-01-26

### Added

- **OAuth Client Management**: Admin UI for managing OAuth 2.0 clients
  - **Frontend**: `/settings/oauth` page for registering and managing apps
  - **Backend**: `OAuthClientService` and `oauthClients` TRPC router
  - **Features**: Create clients, view secrets (once), rotate secrets, delete clients

## [3.5.0] - 2026-01-26

### Added

- **Agent Memory System**: Comprehensive long-term memory for agents
  - **Backend**: `MemoryService` with `pgvector` for semantic storage and retrieval
  - **Frontend**: `/memories` page for managing memories
  - **Tools**: `save_memory`, `search_memory`, `list_memories`, `delete_memory`
  - **Integration**: Automatic context injection into `run_agent` prompts

- **MCP Registry & Templates**: Centralized server discovery and installation
  - **Backend**: `RegistryService` aggregating 950+ servers
  - **Frontend**: `/registry` page with search, filtering, and "Verified" badges
  - **Templates**: `server-templates.json` and `TemplateService` for one-click configuration
  - **One-Click Install**: Streamlined UI for installing community tools

- **Analytics Dashboard**: Observability and usage metrics
  - **Backend**: `AnalyticsService` for aggregating `tool_call_logs`
  - **Frontend**: `/observability` page with "Dashboard" and "Inspector" tabs
  - **Visualizations**: Charts for Total Calls, Success/Error Rates, Daily Activity, Top Tools
  - **Inspector**: Embedded MCP Shark traffic inspector

- **System Dashboard**: In-app overview of the project state
  - **Backend**: `SystemService` to retrieve version, environment info, and changelogs
  - **Frontend**: `/system` page displaying application version, build info, submodules list, and latest changelog

### Changed

- **Documentation**: Major overhaul of project documentation
  - Updated `README.md`, `ROADMAP.md`, `AGENTS.md`, `WORKSPACE_VISION_SUMMARY.md`
  - Created new guides: `docs/guides/memory.md`, `docs/guides/registry.md`, `docs/guides/analytics.md`
  - Updated `docs/DASHBOARD.md` with feature highlights

## [3.2.18] - 2026-01-11

### Added

- **apps/backend/src/lib/metamcp/npm-scanning.service.ts**: npm global package scanning for MCP servers
  - `NpmScanningService` class for detecting MCP servers from npm global packages
  - Detection strategies:
    - Package name contains "mcp-server" (e.g., `mcp-server-filesystem`)
    - Bin entry name starts with "mcp-server-" (e.g., `@playwright/mcp` has bin `mcp-server-playwright`)
    - Has `@modelcontextprotocol/sdk` as dependency
  - `scanGlobalPackages()` - scan npm global node_modules for MCP servers
  - `toStdioConfig(server)` - convert detected server to STDIO config for import
  - Returns package info: name, version, bin name/path, command, description, SDK presence

- **packages/zod-types/src/auto-discovery.zod.ts**: Added npm scanning schemas
  - `npm_global` added to `DiscoverySourceTypeEnum`
  - `NpmMcpServerSchema` - detected npm MCP server with alreadyRegistered flag
  - `NpmScanResultSchema` - scan result with servers, stats, and errors
  - `ScanNpmGlobalRequestSchema` / `ScanNpmGlobalResponseSchema` - tRPC request/response
  - `ImportNpmServersRequestSchema` / `ImportNpmServersResponseSchema` - import request/response

- **packages/trpc/src/routers/frontend/auto-discovery.ts**: Added npm scanning endpoints
  - `scanNpmGlobal` mutation - scan npm global packages for MCP servers
  - `importNpmServers` mutation - import selected npm packages as MCP servers

- **apps/backend/src/trpc/auto-discovery.impl.ts**: Added npm scanning implementations
  - `scanNpmGlobal` - scans npm global packages, checks against registered servers
  - `importNpmServers` - imports selected packages as STDIO servers with safe names

## [3.2.17] - 2026-01-11

### Added

- **apps/backend/src/lib/metamcp/auto-discovery.service.ts**: Auto-discovery service for MCP config files
  - `AutoDiscoveryService` class for automatic detection of MCP servers from various sources
  - Discovery sources: `claude_desktop`, `cursor`, `vscode`, `project_mcp`, `custom`
  - Discovery statuses: `found`, `not_found`, `invalid`, `permission_denied`
  - `scanForConfigs(options?)` - scan standard locations for MCP config files
  - `importFromPath(sourcePath, serverNames, userId?, skipExisting?)` - import selected servers
  - `getDiscoveryPaths(platform?)` - get all discovery paths for a platform
  - `addCustomPath(path)` / `removeCustomPath(path)` / `getCustomPaths()` - manage custom scan paths
  - Platform-specific paths:
    - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`, `%APPDATA%\Cursor\mcp.json`, `.cursor\mcp.json`
    - **macOS**: `~/Library/Application Support/Claude/...`, `~/Library/Application Support/Cursor/...`
    - **Linux**: `~/.config/claude/...`, `~/.config/Cursor/...`
  - Uses `validateClaudeDesktopConfig` from `@repo/zod-types` for config validation
  - Integrates with `mcpServersRepository` to check which servers already exist

- **packages/zod-types/src/auto-discovery.zod.ts**: Zod schemas for auto-discovery types
  - `DiscoverySourceTypeEnum` - source type enumeration (claude_desktop, cursor, vscode, project_mcp, custom)
  - `DiscoveryStatusEnum` - status enumeration (found, not_found, invalid, permission_denied)
  - `DiscoveredServerSchema` - discovered server with name, config, source, alreadyRegistered flag
  - `DiscoverySourceResultSchema` - result per source path with status, servers, error
  - `DiscoveryScanResultSchema` - aggregate scan result with sources array and summary
  - Request/Response schemas for all tRPC endpoints

- **packages/trpc/src/routers/frontend/auto-discovery.ts**: tRPC router for auto-discovery endpoints
  - `scanForConfigs` mutation - scan for MCP config files across standard locations
  - `importDiscovered` mutation - import selected discovered servers into MetaMCP
  - `getDiscoveryPaths` query - get discovery paths for current or specified platform
  - `addCustomPath` mutation - add a custom path to scan for MCP configs

- **apps/backend/src/trpc/auto-discovery.impl.ts**: tRPC implementation connecting router to service

### Changed

- **packages/zod-types/src/index.ts**: Added export for `auto-discovery.zod`
- **packages/trpc/src/routers/frontend/index.ts**: Added `createAutoDiscoveryRouter` to frontend router
- **packages/trpc/src/router.ts**: Added `autoDiscovery` to frontend router definition
- **apps/backend/src/routers/trpc.ts**: Added `autoDiscoveryImplementations` to app router

## [3.2.16] - 2026-01-11

### Added

- **apps/backend/src/lib/metamcp/auto-reconnect.service.ts**: Auto-reconnection service with exponential backoff
  - `AutoReconnectService` singleton class for automatic server reconnection
  - Reconnection states: `IDLE`, `PENDING`, `RECONNECTING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `MAX_RETRIES_EXCEEDED`
  - `scheduleReconnection(serverUuid, serverName, reason)` - schedule reconnection with backoff
  - `attemptReconnection(serverUuid)` - attempt to reconnect a server
  - `cancelReconnection(serverUuid?)` - cancel pending reconnections (single or all)
  - `calculateBackoffDelay(attempt)` - exponential backoff with jitter to prevent thundering herd
  - Configurable: `maxAttempts` (5), `baseDelayMs` (1000), `maxDelayMs` (60000), `jitterFactor` (0.2)
  - Event listeners: `onReconnectSuccess`, `onReconnectFailure`, `onMaxRetriesExceeded`
  - Toggle options: `autoReconnectOnCrash`, `autoReconnectOnHealthFailure`

- **packages/zod-types/src/auto-reconnect.zod.ts**: Zod schemas for auto-reconnection types
  - `ReconnectionStatusEnum` - reconnection status enumeration
  - `ReconnectionStateSchema` - state with status, serverUuid, serverName, attempt, nextRetryAt, error
  - `ReconnectionResultSchema` - result of reconnection attempt
  - `ReconnectionConfigSchema` - configuration options
  - Request/Response schemas for all tRPC endpoints

- **packages/trpc/src/routers/frontend/auto-reconnect.ts**: tRPC router for auto-reconnection endpoints
  - `triggerReconnection` mutation - manually trigger reconnection for a server
  - `cancelReconnection` mutation - cancel pending reconnection(s)
  - `getState` query - get reconnection state for specific server(s)
  - `getSummary` query - get aggregate reconnection statistics
  - `configure` mutation - update reconnection configuration
  - `setEnabled` mutation - enable/disable auto-reconnection features

- **apps/backend/src/trpc/auto-reconnect.impl.ts**: tRPC implementation connecting router to service

### Changed

- **apps/backend/src/lib/metamcp/mcp-server-pool.ts**: Integrated auto-reconnection on server crash
  - `handleServerCrash()` now calls `autoReconnectService.scheduleReconnection()` with reason "crash"
  - `handleServerCrashWithoutNamespace()` also triggers reconnection scheduling

- **apps/backend/src/lib/metamcp/server-health.service.ts**: Integrated auto-reconnection on health failure
  - `updateHealthState()` triggers `autoReconnectService.scheduleReconnection()` when server becomes UNHEALTHY

- **packages/zod-types/src/index.ts**: Added export for `auto-reconnect.zod`
- **packages/trpc/src/routers/frontend/index.ts**: Added `createAutoReconnectRouter` to frontend router
- **packages/trpc/src/router.ts**: Added `autoReconnect` to frontend router definition
- **apps/backend/src/routers/trpc.ts**: Added `autoReconnectImplementations` to app router

## [3.2.15] - 2026-01-09

### Added

- **apps/backend/src/lib/metamcp/server-health.service.ts**: Server health monitoring service
  - `ServerHealthService` singleton class for tracking MCP server health status
  - Health states: `HEALTHY`, `UNHEALTHY`, `UNKNOWN`, `CHECKING`
  - `checkServerHealth(serverUuid)` - connects to server and lists tools to verify health
  - `checkMultipleServers(serverUuids?)` - batch health check for multiple/all servers
  - `getServerHealth(serverUuid)` - retrieve current health status for a server
  - `getHealthSummary()` - returns aggregate stats (total, healthy, unhealthy, unknown)
  - Periodic health checks with configurable interval (default 60s)
  - Consecutive failure tracking - marks server `UNHEALTHY` after 3 failures
  - Integration with `serverErrorTracker` for error state synchronization

- **packages/zod-types/src/server-health.zod.ts**: Zod schemas for health check types
  - `ServerHealthStatusEnum` - health status enumeration
  - `ServerHealthInfoSchema` - health info with status, lastCheck, consecutiveFailures, error
  - `HealthCheckResultSchema` - individual check result
  - `HealthSummarySchema` - aggregate health statistics
  - `CheckHealthRequestSchema`, `GetHealthRequestSchema` - request schemas

- **packages/trpc/src/routers/frontend/server-health.ts**: tRPC router for health endpoints
  - `checkHealth` mutation - trigger health checks for servers
  - `getHealth` query - get health status for specific servers
  - `getSummary` query - get aggregate health summary

- **apps/backend/src/trpc/server-health.impl.ts**: tRPC implementation connecting router to service

### Changed

- **packages/zod-types/src/index.ts**: Added export for `server-health.zod`
- **packages/trpc/src/routers/frontend/index.ts**: Added `createServerHealthRouter` to frontend router
- **packages/trpc/src/router.ts**: Added `serverHealth` to frontend router definition
- **apps/backend/src/routers/trpc.ts**: Added `serverHealthImplementations` to app router

## [3.2.14] - 2026-01-09

### Added

- **apps/backend/src/lib/metamcp/deferred-loading.service.ts**: Deferred loading service for lazy tool schema fetching
  - `DeferredLoadingService` class with schema caching (5-min TTL)
  - `DeferredTool` interface (name, summary, serverUuid, hasSchema)
  - `ToolManifest` interface for lightweight tool listings
  - `createDeferredTool()` - creates minimal tool representation
  - `createMinimalTool()` - returns tool with empty schema `{type: "object", properties: {}}`
  - `cacheToolSchema()` / `getCachedSchema()` - schema caching with TTL
  - `calculateTokenSavings()` - utility to measure token reduction

- **apps/backend/src/lib/metamcp/metamcp-proxy.ts**: Integrated deferred loading
  - Added `get_tool_schema` meta-tool - fetches full schema for a specific tool on-demand
  - Modified `load_tool` to return cached schema when loading a tool
  - Modified `originalListToolsHandler` to cache full schemas and return minimal schemas
  - ~95% token reduction: tools now return `{type: "object", properties: {}}` instead of full schemas
  - Full schemas fetched on-demand via `get_tool_schema` or when `load_tool` is called

### Changed

- **Token Optimization**: `tools/list` now returns minimal schemas by default
  - Full schemas cached in `DeferredLoadingService` on first fetch
  - Schemas returned on-demand via `get_tool_schema` or `load_tool`
  - Estimated token savings: ~150 tokens/tool → ~20 tokens/tool (87% reduction)

## [3.2.13] - 2026-01-09

### Added

- **apps/backend/src/lib/ai/pattern-filter.service.ts**: Pattern-based tool filtering service
  - `PatternFilterService` class with glob, regex, and text pattern support
  - `filterTools()` - filter tools by patterns with options (caseSensitive, matchDescription, matchServer)
  - `filterByServer()` - filter tools by server name patterns
  - `excludeTools()` - exclude tools matching patterns
  - `combineFilters()` - combine include/exclude/server filters
  - `searchWithPattern()` - parse query string syntax: "term" (include), "-term" (exclude), "server:name"
  - Auto-detects pattern type: glob (`*`, `?`, `[]`), regex (`/pattern/flags`), text (substring)

- **packages/zod-types/src/tools.zod.ts**: Added pattern filter Zod schemas
  - `PatternFilterOptionsSchema`, `PatternFilterRequestSchema`
  - `PatternFilterCombinedRequestSchema`, `SmartFilterRequestSchema`
  - `FilterResultSchema`, `PatternFilterResponseSchema`

- **apps/backend/src/trpc/tools.impl.ts**: Added tRPC endpoints for pattern filtering
  - `filterByPattern` - filter tools by glob/regex/text patterns
  - `combineFilters` - apply include/exclude/server filters together
  - `smartFilter` - parse query string with pattern syntax

- **apps/backend/src/db/repositories/tools.repo.ts**: Added `findAll()` method

### Changed

- **tool-search.service.ts**: Extended with pattern filtering methods
  - Added `filterByPattern()`, `filterByServer()`, `excludeByPattern()`, `smartFilter()`, `combineFilters()`
  - All methods delegate to `PatternFilterService`

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
  - MetaMCP's position within Borg ecosystem
  - Three pillars overview (Borg, MetaMCP, Bobcoin)
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
