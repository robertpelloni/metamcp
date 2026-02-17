# MetaMCP Feature Roadmap (Reality-Aligned)

**Current Version**: 3.6.0  
**Last Updated**: 2026-02-16  
**Purpose**: Reflect actual implementation maturity (not just historical intent) to guide implementor models.

---

## Status Legend

| Status | Meaning |
| :-- | :-- |
| ✅ | Implemented and actively wired in core UX/API path |
| 🟡 | Implemented but partial/fragile/not fully productionized |
| 🧩 | Implemented in code but not mounted/wired into active router/UI |
| 🧪 | UI/demo placeholder or simulated behavior |
| 📋 | Planned (not meaningfully implemented yet) |

---

## Reality Snapshot (Critical)

### 2026-02-16 Update (P0 Progress)

- ✅ Router wiring mismatch addressed for the previously unwired namespaces.
- ✅ Legacy mock route `apps/backend/src/routers/logs.ts` removed.
- ✅ Shared schema exports and DB schema references were aligned to restore build health after wiring.
- 🟡 Remaining high-priority gaps are now primarily **UI simulation paths** and **data correctness hardening** (audit totals/filters, inspector simulation paths).

---

### High-confidence gaps found during source audit

1. **tRPC contract wiring mismatch** (high priority, now resolved)
	- This mismatch previously created drift between available code and active API surface.
	- Status: resolved in current cycle by mounting the missing namespaces in shared contract and backend router wiring.

2. **Placeholder/stubbed UI behavior in production pages** (high priority)
	- `settings/page.tsx`: Docker image update is explicitly stubbed in frontend state.
	- `scripts/page.tsx`: “Autonomous Agent Playground” includes instructional placeholder/simulated behavior instead of actual frontend execution path.
	- `mcp-inspector/inspector-roots.tsx`: roots behavior is placeholder-only (no real protocol integration).
	- `mcp-inspector/inspector-sampling.tsx`: simulated result path; not real MCP sampling execution.

3. **Legacy/dead backend route file** (medium priority, now resolved)
	- `apps/backend/src/routers/logs.ts` was removed to eliminate duplicate/mock route confusion.

4. **UI discoverability and representation gap** (medium-high priority)
	- Sidebar navigation exposes only a subset of existing pages, while additional pages/features exist under routes but are not represented in primary navigation.

5. **Documentation drift** (high priority)
	- Prior roadmap/docs marked some features as fully complete where implementation is partial, simulated, or not mounted.

---

## Feature State by Domain

### Core Hub / Proxy

- ✅ Progressive disclosure meta-tool model (`search_tools`, `load_tool`, `run_code`, `run_agent`)
- ✅ Middleware pipeline architecture exists and is active
- 🟡 Some middleware typing/cleanup debt remains (e.g., TODO in functional middleware typing)

### Logs, Audit, and Analytics

- ✅ Live logs core path (`tool_call_logs` via `logs.impl.ts`) is wired
- 🟡 Audit implementation exists but total-count handling is placeholder in `audit.impl.ts`
- ✅ Analytics/Audit/System/Registry/Catalog/Discovery/Memories/Auto-Reconnect namespaces are now mounted in active tRPC router
- ✅ Legacy additional router file `routers/logs.ts` removed

### Agent and Code Mode

- ✅ Core backend agent execution path exists and is wired (`agent.impl.ts`)
- 🟡 Frontend agent UX split:
  - dedicated `/agent` page is functional against mounted router
  - `/scripts` page “agent playground” remains instructional/simulated placeholder

### Registry / Catalog / Discovery

- 🟡 Registry and catalog implementations exist
- ✅ Registry/catalog/discovery implementation modules are mounted in active backend tRPC router
- 🟡 Frontend contains registry and auto-discovery UI; now requires end-to-end behavior hardening and UX polish

### Auto-Reconnect / System / Memories

- ✅ Implementations for `auto-reconnect`, `system`, and `memories` are now mounted in active tRPC router
- 🟡 Needs runtime verification and complete UI representation for memory product direction

### Inspector

- ✅ Tools/resources/prompts interaction is broadly implemented
- 🧪 Roots and sampling tabs currently expose placeholder/simulated behavior
- 🟡 Tool schema compatibility currently depends on `@ts-expect-error` workarounds in inspector tools component

### Settings and Config UX

- ✅ Core auth/config switches and timeout controls are connected
- 🧪 Docker image update control is currently frontend stub, not a real backend-managed setting
- 🟡 Connection/retry options in `useConnection` still include TODOs for configurability

---

## Execution Order (Recommended)

1. **Contract Unification (P0)**
	- Make one authoritative frontend router contract and mount all intended implementations.
	- Remove/replace dead or legacy route paths that are not mounted.

2. **Runtime Safety + API Completeness (P0)**
	- Replace placeholders in audit totals and related list/count semantics.
	- Ensure every UI-visible feature has a non-simulated backend path.

3. **UI Truthfulness and Coverage (P1)**
	- Replace simulated inspector roots/sampling with explicit unsupported states or real implementations.
	- Remove instructional placeholders where actions appear executable.
	- Bring hidden but important pages/features into primary navigation or explicitly mark as experimental.

4. **Documentation Realignment (P1)**
	- Keep roadmap/dashboard/manual strictly aligned with mounted production behavior.
	- Separate “implemented in code” vs “enabled and supported in product UX.”

5. **Hardening and Polish (P2)**
	- Eliminate `@ts-expect-error` compatibility patches where feasible.
	- Add integration tests for every frontend route namespace used by UI.

---

## Planned Workstreams (Updated)

### Workstream A — Router and API Surface Convergence
- [x] Wire or intentionally remove: `analytics`, `audit`, `auto-discovery`, `auto-reconnect`, `catalog`, `memories`, `registry`, `system`
- [x] Align `packages/trpc/src/routers/frontend/index.ts` with backend mounting and frontend usage
- [x] Delete or refactor `apps/backend/src/routers/logs.ts` (legacy mock route)

### Workstream B — Replace Simulated UX Paths
- [ ] Replace Settings Docker stub with real backend config endpoint (or remove control)
- [ ] Replace `/scripts` “run_agent coming soon” simulation with real invocation flow or explicit readonly docs card
- [ ] Implement real roots/sampling inspector logic or mark feature unavailable based on capabilities only

### Workstream C — Observability & Security Correctness
- [ ] Complete audit pagination/count semantics with accurate totals
- [ ] Verify role/ownership scoping behavior for logs/audit access
- [ ] Add feature-level tests for logs, audit, and system routes

### Workstream D — UI Representation and Discoverability
- [ ] Decide canonical IA: include/exclude pages (`agent`, `tool-sets`, `registry`, `system`, `audit`, `observability`, `scripts`, etc.)
- [ ] Ensure visible nav mirrors supported features
- [ ] Add “experimental” badges where behavior is intentionally incomplete

### Workstream E — Documentation Quality Gate
- [ ] Keep `ROADMAP.md`, `DASHBOARD.md`, `HANDOFF.md`, and `TODO.md` synchronized each implementation cycle
- [ ] Add explicit “support matrix” docs: `implemented`, `mounted`, `UI-exposed`, `tested`

---

## Notes for Implementor Models

- Do not assume “file exists” means “feature shipped.”
- Treat mounted router + UI + tests as the definition of feature completeness.
- Prioritize removing product-level ambiguity before adding net-new capabilities.
