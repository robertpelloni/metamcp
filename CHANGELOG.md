# Changelog

All notable changes to this project will be documented in this file.

## [3.7.0] - 2026-02-17

### Added
- **Hybrid Storage Architecture**:
  - `mcp.json` is now the authoritative source for MCP Server configuration.
  - `api-keys.json` for lightweight, file-based API key storage (resolves 500 errors).
  - `memories.json` for pluggable agent memory storage.
  - **Migration**: System seamlessly falls back to JSON storage if Database is unavailable.

### Fixed
- **API Keys 500 Error**: Resolved Internal Server Error on `apiKeys.list` by decoupling from strict DB dependency.
- **Docker Image Config**: (In Progress) implementing backend persistence for Docker settings.

## [3.6.30] - 2026-02-17

### Fixed
- **Frontend dev-server stability on Windows**:
  - Forced frontend dev script to run in explicit webpack mode (`next dev --webpack`) instead of Turbopack paths implicated in intermittent manifest `ENOENT` crashes during active development.
  - Updated:
    - `apps/frontend/package.json`

### Changed
- **Local development reliability**:
  - Frontend startup now deterministically avoids Turbopack-only manifest generation behavior in this workspace's Windows environment.

## [3.6.29] - 2026-02-17

### Fixed
- **Auth and logs page bootstrapping under partial backend/database readiness**:
  - Hardened config-setting reads used by auth/register/login flows to fail-safe with secure defaults when config storage is temporarily unavailable.
  - Added guarded handling for missing `config` table reads in repository layer to avoid surfacing tRPC 500s during startup or migration lag.
  - Added fail-safe guards inside Better Auth middleware/database hooks so auth flow config checks no longer hard-fail when config reads error.
  - Updated:
    - `apps/backend/src/lib/config.service.ts`
    - `apps/backend/src/db/repositories/config.repo.ts`
    - `apps/backend/src/auth.ts`

- **Frontend tRPC non-JSON error diagnostics**:
  - Added shared diagnostic fetch wrapper for frontend tRPC clients so non-JSON responses now surface explicit status/content-type/URL previews instead of opaque `JSON.parse` failures.
  - Updated:
    - `apps/frontend/lib/trpc.ts`

- **Backend dev startup reliability in workspace mode**:
  - Updated backend package `dev` script to avoid re-loading a package-local env file that could fail or conflict with root-loaded `.env.local` during `pnpm dev`.
  - Updated:
    - `apps/backend/package.json`

### Changed
- **Local dev resilience**:
  - Frontend now receives clearer diagnostics when backend routes are unavailable, while backend config lookups degrade safely instead of crashing auth/config tRPC procedures.
  - Login/register pages now fail open on optional config fetch failures and avoid repeated status re-queries that amplified console error noise during backend instability.
  - Updated:
    - `apps/frontend/app/[locale]/login/page.tsx`
    - `apps/frontend/app/[locale]/register/page.tsx`

## [3.6.28] - 2026-02-17

### Fixed
- **Opaque frontend `TRPCClientError` JSON parse failures**:
  - Hardened frontend tRPC transport fetch handling to detect non-JSON `/trpc` responses before tRPC parsing.
  - Replaced low-signal `JSON.parse: unexpected character` failures with explicit diagnostics including response status, content type, request URL, and response preview.
  - Updated:
    - `apps/frontend/lib/trpc.ts`

### Changed
- **tRPC transport diagnostics**:
  - Both React and vanilla frontend tRPC clients now share the same credentialed diagnostic fetch wrapper to improve runtime debugging when proxy/auth/routing layers return non-JSON payloads.

## [3.6.27] - 2026-02-17

### Added
- **Malformed `mcp.json` parser regression test**:
  - Added targeted unit coverage for `McpJsonHotReloadService` config parsing error behavior.
  - New assertion verifies malformed file content is rejected with a clear `Invalid mcp.json format` error.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload parse-failure assurance**:
  - Test matrix now explicitly covers missing file, valid parse, malformed content rejection, and managed-name collision validation paths.

## [3.6.26] - 2026-02-17

### Added
- **Debounced sync error-path regression test**:
  - Added targeted unit coverage for `McpJsonHotReloadService` debounced scheduler failure handling.
  - New assertion verifies failed `syncFromDisk(...)` execution triggered by `scheduleSync(...)` is caught and logged via `console.error`.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload debounce observability assurance**:
  - Sync orchestration test matrix now covers success replay, failure replay, and debounced execution logging on failure.

## [3.6.25] - 2026-02-17

### Added
- **Sync failure replay regression test**:
  - Added targeted unit coverage for `McpJsonHotReloadService` sync orchestration failure path.
  - New assertion verifies that when an in-flight `syncFromDisk(...)` run fails, one pending sync request is still replayed afterward.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload scheduler resilience assurance**:
  - Test matrix now explicitly validates pending-sync replay semantics across both success and failure in-flight outcomes.

## [3.6.24] - 2026-02-17

### Added
- **File-change gating regression tests**:
  - Added targeted unit coverage for `McpJsonHotReloadService` file-change gating behavior in `handleFileChange(...)`.
  - New assertions verify:
    - unchanged `mtimeMs` and `size` does not schedule a sync,
    - changed `mtimeMs` or `size` schedules a debounced sync with `file-change` reason.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload change-detection assurance**:
  - Test matrix now explicitly guards against redundant sync scheduling for no-op filesystem events while preserving responsiveness on real file mutations.

## [3.6.23] - 2026-02-17

### Added
- **Watcher lifecycle regression tests**:
  - Added targeted unit coverage for `McpJsonHotReloadService` watcher lifecycle behavior.
  - New assertions verify:
    - `initialize()` performs startup sync and enables watcher state,
    - `stop()` cancels pending debounce work and disables watcher state,
    - `stop()` is a safe no-op when watcher is not enabled.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload lifecycle assurance**:
  - Test matrix now covers scheduler behavior plus watcher state transitions, improving confidence during startup/shutdown and rapid file-change sequences.

## [3.6.22] - 2026-02-17

### Added
- **Sync orchestration regression tests**:
  - Added targeted unit coverage for `McpJsonHotReloadService` sync scheduling and in-flight replay behavior.
  - New assertions verify:
    - `syncFromDisk(...)` replays exactly one pending sync after an in-flight sync completes,
    - `scheduleSync(...)` debounces bursts and executes only the latest reason.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload coordination assurance**:
  - Test matrix now covers both reconciliation correctness and scheduler-level behavior, reducing risk of race-induced duplicate work during rapid `mcp.json` changes.

## [3.6.21] - 2026-02-17

### Added
- **Mixed-batch reconciliation regression test**:
  - Added a composite `reconcileServers(...)` unit test that exercises create, update, unchanged managed, unmanaged public, and managed removal flows in a single run.
  - New assertions verify exact aggregate counters and side effects:
    - `created=1`, `updated=1`, `removed=1`,
    - create/update/delete + idle-session create/invalidate/cleanup call counts,
    - namespace invalidation lookups only for changed server UUIDs.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Reconciliation decision-boundary assurance**:
  - Hot-reload test matrix now validates not only isolated branches but also their interaction under realistic mixed desired/existing server states.

## [3.6.20] - 2026-02-17

### Added
- **Managed-update/no-params regression test**:
  - Extended `McpJsonHotReloadService` unit coverage for `reconcileServers(...)` to verify that changed managed servers are still updated when `convertDbServerToParams(...)` returns `null`, while idle-session invalidation is correctly skipped.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload update-path gating assurance**:
  - Reconciliation test matrix now explicitly validates idle-session invalidation gating for both create and update flows based on param conversion availability.

## [3.6.19] - 2026-02-17

### Added
- **Reconcile no-op regression test**:
  - Added targeted unit coverage for `reconcileServers(...)` unchanged-managed path to verify no unnecessary repository updates or idle-session invalidations occur when managed server configuration is already aligned with desired `mcp.json` state.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload update efficiency assurance**:
  - Reconciliation test matrix now explicitly validates no-op behavior for unchanged managed records, reducing risk of redundant churn during periodic sync runs.

## [3.6.18] - 2026-02-17

### Added
- **Reconcile create-path regression tests**:
  - Extended `McpJsonHotReloadService` unit coverage for `reconcileServers(...)` create flow to verify:
    - new managed servers are created and idle sessions are initialized when converted params are available,
    - new managed servers skip idle-session initialization when converted params are unavailable.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload create-path reliability assurance**:
  - Reconciliation test matrix now explicitly covers create + update + remove decision branches, including session initialization gating.

## [3.6.17] - 2026-02-16

### Added
- **Reconcile update/skip regression tests**:
  - Extended `McpJsonHotReloadService` unit coverage for `reconcileServers(...)` to verify:
    - managed changed servers trigger repository update + idle-session invalidation,
    - unmanaged public servers with matching names are intentionally skipped (no update/invalidation).
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload reconciliation assurance**:
  - Expanded test matrix now covers create/update/remove decision boundaries for managed vs unmanaged public server records.

## [3.6.16] - 2026-02-16

### Added
- **Managed-server removal regression coverage**:
  - Added a targeted `reconcileServers(...)` unit test to verify managed servers are removed when missing from desired `mcp.json` state, while manually managed public servers remain untouched.
  - New assertions verify:
    - `cleanupIdleSession` and `deleteByUuid` are called for managed-only removals,
    - create/update paths remain untouched for an empty desired map,
    - removal counters are reported correctly.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Hot-reload cleanup semantics confidence**:
  - Expanded test matrix for `McpJsonHotReloadService` from parsing/invalidation to include reconciliation cleanup behavior under empty desired state.

## [3.6.15] - 2026-02-16

### Added
- **Hot-reload namespace invalidation regression tests**:
  - Added targeted unit coverage for `invalidateAffectedNamespaces(...)` behavior in `McpJsonHotReloadService`.
  - New assertions verify:
    - no-op behavior when no namespaces are affected,
    - deduped namespace invalidation requests,
    - explicit error logging when an invalidation step rejects,
    - override cache clearing for every affected namespace.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **Reliability hardening validation depth**:
  - Expanded backend test coverage from parsing-only paths to include namespace-level invalidation outcomes and observability guarantees.

## [3.6.14] - 2026-02-16

### Added
- **Hot-reload regression test coverage**:
  - Added targeted unit tests for `McpJsonHotReloadService` desired-server parsing and managed-name collision detection helper.
  - New test file:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.test.ts`

### Changed
- **mcp.json desired map construction testability**:
  - Extracted desired-server mapping into `buildDesiredServerMapFromConfig(...)` to keep collision-safety logic directly testable.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.ts`

### Fixed
- **Backend test runner availability**:
  - Added missing `vitest` backend dev dependency so backend unit tests can execute in workspace environments that rely on package-local binaries.

## [3.6.13] - 2026-02-16

### Fixed
- **mcp.json hot-reload reconciliation safety**:
  - Added validation to detect conflicting `mcp.json` server entries that normalize to the same managed DB name (e.g., special-character variants collapsing to identical normalized names).
  - Reconciliation now fails fast with a clear error message instead of allowing ambiguous/non-deterministic updates.
  - Updated:
    - `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.ts`

### Changed
- **Namespace invalidation observability**:
  - Added explicit error logging for rejected namespace invalidation steps (`invalidateIdleServers` / `invalidateOpenApiSessions`) after `mcp.json` sync-triggered server changes.

## [3.6.12] - 2026-02-16

### Fixed
- **Inspector notification ID stability**:
  - Replaced random-based notification entry IDs in MCP Inspector with monotonic per-session IDs.
  - Eliminated the last `Math.random()` usage in frontend source to reduce non-deterministic behavior and improve traceability.
  - Updated:
    - `apps/frontend/app/[locale]/(sidebar)/mcp-inspector/page.tsx`

### Changed
- **Runtime consistency polish**:
  - Notification IDs are now generated in a predictable sequence scoped to the selected server/session lifecycle.

## [3.6.11] - 2026-02-16

### Fixed
- **Closed final date formatting gap in API Keys UI**:
  - Replaced remaining `date-fns` local date rendering in API keys table with `formatDeterministicDateTime(...)` to keep SSR/client timestamp output consistent.
  - Updated:
    - `apps/frontend/app/[locale]/(sidebar)/api-keys/page.tsx`

### Changed
- **Hydration hardening completion polish**:
  - Completed deterministic timestamp alignment across sidebar-rendered operational tables and detail surfaces.

## [3.6.10] - 2026-02-16

### Fixed
- **Completed deterministic timestamp hardening sweep**:
  - Replaced remaining locale/timezone-dependent timestamp rendering in inspector and namespace detail client views with shared deterministic formatter.
  - Updated:
    - `apps/frontend/app/[locale]/(sidebar)/mcp-inspector/components/notifications-panel.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/mcp-inspector/components/inspector/inspector-ping.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/mcp-inspector/components/inspector/inspector-tools.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/namespaces/[uuid]/page.tsx`

### Changed
- **Hydration consistency completion**:
  - Finalized sidebar client timestamp formatting alignment on `formatDeterministicDateTime(...)` to minimize SSR/client text drift risk.

## [3.6.9] - 2026-02-16

### Fixed
- **Expanded deterministic timestamp rendering coverage**:
  - Replaced remaining locale/timezone-variant timestamp rendering in additional sidebar surfaces with shared deterministic formatter.
  - Updated:
    - `apps/frontend/app/[locale]/(sidebar)/namespaces/namespaces-list.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/namespaces/[uuid]/components/namespace-servers-table.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/mcp-servers/[uuid]/components/tools-data-table.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/namespaces/[uuid]/components/enhanced-namespace-tools-table.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/mcp-servers/[uuid]/page.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/system/page.tsx`

### Changed
- **Hydration hardening continuation**:
  - Consolidated date-time display consistency across more client-rendered list/detail tables to reduce SSR/client text drift risk.

## [3.6.8] - 2026-02-16

### Fixed
- **Additional Hydration Stability for Client-Rendered Timestamps**:
  - Added `apps/frontend/lib/datetime.ts` with `formatDeterministicDateTime(...)` using fixed locale/timezone formatting for SSR/client consistency.
  - Replaced locale-variable timestamp rendering in:
    - `apps/frontend/components/log-entry.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/audit/page.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/endpoints/endpoints-list.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/live-logs/page.tsx`
    - `apps/frontend/app/[locale]/(sidebar)/mcp-servers/mcp-servers-list.tsx`

### Changed
- **Hydration hardening scope**:
  - Focused this patch on high-traffic sidebar surfaces that render timestamps in client components during initial SSR + hydration.

## [3.6.7] - 2026-02-16

### Fixed
- **Deterministic Hydration Mismatch in Sidebar Skeletons**:
  - Updated `apps/frontend/components/ui/sidebar.tsx` to remove render-time `Math.random()` usage in `SidebarMenuSkeleton`.
  - Replaced it with deterministic width generation derived from `React.useId()`, ensuring SSR/client markup consistency.

- **mcp.json Hot Reload Service Source Integrity**:
  - Repaired accidental text corruption in `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.ts` inside `needsUpdate(...)`.
  - Restored valid TypeScript syntax for command/url comparison logic.

## [3.6.6] - 2026-02-16

### Fixed
- **Auth Session Stability Across Environments**:
  - Updated `apps/frontend/middleware.ts` to resolve auth session checks against `APP_URL` (when set) or `request.nextUrl.origin` instead of hardcoded localhost.
  - This reduces false unauthorized redirects/logout loops when running behind non-localhost hosts/proxies.

- **Locale-Aware Sign-Out Navigation**:
  - Updated `apps/frontend/app/[locale]/(sidebar)/layout.tsx` to redirect sign-out to localized login paths via `getLocalizedPath("/login", locale)`.
  - Added resilient sign-out flow that always navigates to login even if sign-out call errors.

## [3.6.5] - 2026-02-16

### Changed
- **Inspector Type-Safety Hardening**:
  - Removed `@ts-expect-error` suppressions in `apps/frontend/app/[locale]/(sidebar)/mcp-inspector/components/inspector/inspector-tools.tsx`.
  - Added safe runtime schema narrowing helpers for tool argument generation.
  - Switched first-tool auto-select logic to strict-safe `tools.at(0)` guard.

### Fixed
- **Backend Auth/Middleware Technical Debt**:
  - Removed legacy TODO/debt in `apps/backend/src/middleware/better-auth-mcp.middleware.ts`.
  - Added typed request augmentation for `req.user` and `req.session` in Better Auth MCP middleware.
  - Replaced `any`-based compose typing in `apps/backend/src/lib/metamcp/metamcp-middleware/functional-middleware.ts` with strongly typed generic tuple signature.

## [3.6.4] - 2026-02-16

### Changed
- **Audit API Correctness**:
  - Implemented real filtered total counting for audit list responses in `apps/backend/src/lib/audit/audit.service.ts`.
  - Added shared filter handling (`userId`, `action`) across audit list and count paths.
  - Updated `apps/backend/src/trpc/audit.impl.ts` to return real totals from `countLogs()` instead of page-length placeholders.

- **Simulated UX Path Removal (P0 Progress)**:
  - Updated `apps/frontend/app/[locale]/(sidebar)/scripts/page.tsx` to remove instructional fake execution and route users to real `/agent` execution flow.
  - Replaced simulated roots management in `inspector-roots.tsx` with explicit capability/read-only status messaging.
  - Replaced simulated sampling responses in `inspector-sampling.tsx` with real `sampling/createMessage` request attempts and clear unsupported-capability handling.
  - Wired Docker image controls in `apps/frontend/app/[locale]/(sidebar)/settings/page.tsx` to real backend config endpoints (`getDockerImage`/`setDockerImage`) instead of frontend stubs.

### Fixed
- **Hot Reload Service Integrity**:
  - Removed accidental text corruption in `apps/backend/src/lib/metamcp/mcp-json-hot-reload.service.ts` that could break TypeScript parsing.

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
