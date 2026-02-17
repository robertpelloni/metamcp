# MetaMCP Master TODO (Implementation-Ordered)

**Date**: 2026-02-16  
**Source**: Full repository/documentation audit for implementor handoff  
**Goal**: Convert feature intent into verifiable, fully wired, production-grade behavior.

---

## How to use this TODO

- Execute top to bottom.
- Do not mark an item complete unless all acceptance criteria pass.
- “Implemented” means: backend mounted + frontend represented + documented + tested.

---

## P0 — Contract and Runtime Truth (Blockers)

### 1) Unify frontend tRPC contract with backend mounted routers

- [x] Reconcile `packages/trpc/src/routers/frontend/index.ts` and `apps/backend/src/routers/trpc.ts`.
- [ ] Decide feature-by-feature whether each namespace is:
  - [ ] mounted and supported
  - [ ] intentionally experimental (behind explicit flag)
  - [ ] deprecated and removed
- [x] Resolve mismatches for namespaces currently present in code but not mounted:
  - [x] `analytics`
  - [x] `audit`
  - [x] `autoDiscovery`
  - [x] `autoReconnect`
  - [x] `catalog`
  - [x] `memories`
  - [x] `registry`
  - [x] `system`

**Acceptance Criteria**
- [x] `pnpm build` passes with no route contract/type drift.
- [ ] Every `trpc.frontend.*` usage resolves to mounted backend behavior.
- [ ] No page depends on non-mounted namespace.

---

### 2) Remove dead/legacy route confusion

- [x] Remove or refactor unmounted `apps/backend/src/routers/logs.ts` mock route.
- [ ] Ensure one authoritative logs API path is documented and used.

**Acceptance Criteria**
- [x] No stale mock logs route remains in source.
- [ ] Logs API behavior is consistent between UI, router, and docs.

---

### 3) Eliminate product-level simulated behavior in actionable UI

- [ ] Replace Settings Docker-image stub in `settings/page.tsx` with real backend endpoint and persistence.
- [ ] Replace `/scripts` “run_agent coming soon” simulation with real invocation path or downgrade to docs-only panel.
- [ ] Replace inspector roots placeholder flow with real capability-bound behavior.
- [ ] Replace inspector sampling simulation with real execution or remove tab when unsupported.

**Acceptance Criteria**
- [ ] No UI action button performs mock/simulated business behavior without explicit “demo only” labeling.
- [ ] User-visible behavior matches backend reality.

---

## P1 — Feature Completion and Robustness

### 4) Audit + analytics correctness

- [ ] Implement true audit log totals (count query, pagination metadata).
- [ ] Complete filter support (`userId`, `action`) in `audit.service.ts`.
- [ ] Verify row/field shape parity between DB schema and UI display models.
- [ ] If analytics is mounted, validate user-scoped access semantics and chart consistency.

**Acceptance Criteria**
- [ ] Audit list response totals reflect full dataset, not current page length.
- [ ] Filters work and are tested.
- [ ] UI and API use identical audit model semantics.

---

### 5) Discovery + registry + catalog end-to-end behavior

- [ ] Confirm whether `registry` and `catalog` are both needed; consolidate if redundant.
- [ ] Ensure mounted routes support all UI flows in `/registry` and catalog pages.
- [ ] Validate one-click install defaults (command/args/env) and required env handling.

**Acceptance Criteria**
- [ ] Registry search/category/install are fully operational.
- [ ] No placeholder fallback in install workflow for verified templates.

---

### 6) Auto-discovery and auto-reconnect productionization

- [ ] Mount and validate auto-discovery APIs used by UI.
- [ ] Mount and expose auto-reconnect status/config controls in UI (or remove dead code).
- [ ] Add explicit status indicators for “scan/import success, partial, failed.”

**Acceptance Criteria**
- [ ] Auto-discovery UI reflects real results and imported state.
- [ ] Auto-reconnect behavior is configurable and observable from UI.

---

### 7) System and memories feature parity

- [ ] Mount/verify `system` API used by `/system` page.
- [ ] Decide and execute memory product direction:
  - [ ] either ship `/memories` UI and nav integration
  - [ ] or update docs to mark memory as backend/tool-only.

**Acceptance Criteria**
- [ ] System page never relies on non-mounted endpoint.
- [ ] Memory feature representation is truthful across UI and docs.

---

## P1 — UI Information Architecture and Representation

### 8) Align navigation with actual product surface

- [ ] Define canonical sidebar IA.
- [ ] Decide visibility for currently off-nav pages (e.g., `agent`, `tool-sets`, `registry`, `system`, `audit`, `observability`, `scripts`, `catalog`).
- [ ] Add explicit experimental badges where needed.

**Acceptance Criteria**
- [ ] Users can discover all supported features from primary navigation.
- [ ] Hidden/partial features are not represented as production-ready.

---

### 9) Harden observability UX

- [ ] Replace hardcoded observability iframe assumptions with configurable endpoint + health checks.
- [ ] Provide fallback guidance when MCP Shark service is unavailable.

**Acceptance Criteria**
- [ ] Observability page does not silently fail when local sidecar is absent.

---

## P2 — Quality Gates and Tech Debt

### 10) Remove schema/type suppressions in inspector

- [ ] Replace `@ts-expect-error` MCP SDK schema mismatch patches with explicit type adapters.

**Acceptance Criteria**
- [ ] Inspector compiles without route-critical suppressions.

---

### 11) Connection configurability polish

- [ ] Complete TODOs in `useConnection.ts` for configurable retry/timeout values.
- [ ] Surface defaults in settings with validation.

**Acceptance Criteria**
- [ ] Runtime transport behavior is user-configurable and documented.

---

### 12) Test coverage for feature completeness

- [ ] Add integration tests per mounted namespace.
- [ ] Add smoke tests for each sidebar page route.
- [ ] Add regression tests for route-contract drift (frontend usage vs mounted backend namespaces).

**Acceptance Criteria**
- [ ] CI fails if UI references non-mounted tRPC namespaces.
- [ ] CI fails if simulated placeholders regress into production flows.

---

## Documentation Synchronization Checklist (Required each cycle)

- [ ] Update `docs/ROADMAP.md` with real status changes.
- [ ] Update `DASHBOARD.md` support matrix (mounted vs partial vs planned).
- [ ] Update `HANDOFF.md` with what changed, what remains, and evidence.
- [ ] Keep this `TODO.md` prioritized and current.

---

## Definition of Done (Project-Level)

A feature is considered done only when all are true:

- [ ] Backend implementation exists.
- [ ] Route is mounted in active runtime.
- [ ] Frontend has comprehensive representation (labels, help, empty/error states).
- [ ] End-to-end behavior tested.
- [ ] Docs reflect current behavior precisely.
