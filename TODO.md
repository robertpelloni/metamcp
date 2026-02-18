# MetaMCP Master TODO (Execution-Ordered)

**Date**: 2026-02-17  
**Version Context**: 3.6.6  
**Objective**: Finish remaining partial/simulated features and close runtime correctness gaps.

---

## Completion Standard

Do not mark an item done unless all are true:

- Backend path is implemented and mounted.
- Frontend is truthful (no hidden simulation).
- Behavior is verified after clean runtime restart.
- Docs are updated (`docs/ROADMAP.md`, `TODO.md`, `HANDOFF.md`).

---

## P0 — Must Finish First

### 1) Remove simulated/stubbed UX in production routes

- [ ] Replace settings Docker image stub with backend endpoint + persistence.
  - File evidence: `apps/frontend/app/[locale]/(sidebar)/settings/page.tsx`.
- [x] Replace `/scripts` placeholder "frontend execution coming soon" with real actionable flow to `/agent`.
- [x] Replace inspector roots placeholder flow with explicit capability-backed unavailable/read-only state.
- [x] Replace inspector sampling simulation with real call path and explicit unsupported feedback.

**Acceptance Criteria**

- [ ] No primary action button performs simulated business behavior without explicit labeling.
- [ ] UI labels and backend capability are aligned (settings Docker control still pending).

---

### 2) Completed: Hybrid Storage & API Keys (v3.7.0)

- [x] Migrate `mcp.json` to be source of truth.
- [x] Implement JSON-based API Keys storage (`api-keys.json`).
- [x] Implement JSON-based Memory storage (`memories.json`).
- [x] Resolve 500 Error on API Keys list.
- [x] Audit/logs correctness and runtime consistency (backend implemented).

---

### 3) Runtime reliability closure (auth/hydration)a**

- [x] Verify audit filters end-to-end through frontend runtime behavior.
- [ ] Reproduce and close any remaining logs-query drift after clean restart (no stale SQL shape mismatch).
### 3) Runtime reliability closure (auth/hydration)

- [ ] Confirm and fix persistent logout/session loss edge cases.
- [ ] Confirm and fix hydration mismatch edge cases in sidebar routes.
- [x] Keep safe-storage wrappers and stderr noise guards (already implemented) and ensure no regressions.

**Acceptance Criteria**

- [ ] No unexpected forced logout under normal navigation.
- [ ] No recurring hydration mismatch warnings in verified routes.

---

## P1 — Product Hardening

### 4) Registry/discovery/install behavior hardening

- [ ] Remove placeholder install defaults in registry UX.
- [ ] Validate command/args/env mapping for one-click installs.
- [ ] Add failure-state messaging for partial template requirements.

### 5) Inspector type safety cleanup

- [ ] Replace `@ts-expect-error` schema mismatch suppressions with typed adapters.

### 6) Middleware/auth technical debt cleanup

- [ ] Address TODO in `better-auth-mcp.middleware.ts`.
- [ ] Address middleware typing TODO in functional middleware.

---

## P2 — Guardrails and Regression Coverage

### 7) Add regression tests for known weak spots

- [ ] Audit totals + filters integration tests.
- [ ] Logs query shape compatibility tests.
- [ ] Auth/session persistence smoke tests.
- [ ] Inspector roots/sampling behavior tests (real or explicit unsupported state).

### 8) Keep project truth docs synchronized each cycle

- [ ] `docs/ROADMAP.md` updated after each meaningful change.
- [ ] `HANDOFF.md` append session summary with evidence.
- [ ] `DASHBOARD.md` support matrix updated when feature reality changes.

---

## Completed Recently (for continuity)

- [x] Mounted previously unwired frontend namespaces in active tRPC runtime.
- [x] Removed dead legacy `apps/backend/src/routers/logs.ts` mock route.
- [x] Implemented `mcp.json` startup sync + live hot reload watcher.
- [x] Hardened frontend storage access wrappers.
- [x] Suppressed empty malformed MCP stderr UI noise.
- [x] Replaced audit placeholder total logic with real count + backend filters.
- [x] Replaced scripts and inspector simulated flows with truthful behavior.
- [x] Confirmed backend/frontend builds currently pass.