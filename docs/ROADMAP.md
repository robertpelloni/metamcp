# MetaMCP Roadmap (Reality-Aligned)

**Current Version**: 3.6.6  
**Last Updated**: 2026-02-17

This roadmap tracks what is truly shippable now versus what still contains simulation paths, placeholders, or correctness debt.

---

## Status Legend

| Status | Meaning |
| :-- | :-- |
| ✅ | Implemented, mounted, and actively used |
| 🟡 | Implemented but partial/fragile or still needs correctness hardening |
| 🧪 | Simulated/stubbed UX path |
| 📋 | Planned and not yet implemented |

---

## Snapshot (2026-02-17)

### Newly completed in this cycle

- ✅ **Hybrid Storage Architecture (v3.7.0)**:
  - `mcp.json` is now the source of truth for configuration.
  - API Keys are stored in `api-keys.json`.
  - Memories use pluggable storage (`memories.json` default).
  - 500 Errors on API Key list resolved.
- ✅ `mcp.json` startup load + live file watch/hot-reload pipeline.
- ✅ Audit log correctness (filtered totals).
- ✅ Frontend stderr-noise reduction for malformed/empty MCP stderr payloads:
  - `apps/frontend/hooks/useConnection.ts`
  - `apps/frontend/app/[locale]/(sidebar)/mcp-servers/[uuid]/page.tsx`
  - `apps/frontend/app/[locale]/(sidebar)/namespaces/[uuid]/page.tsx`
- ✅ Browser storage hardening (safe local/session storage access):
  - `apps/frontend/lib/oauth-provider.ts`
  - `apps/frontend/lib/stores/logs-store.ts`

### Previously completed and still valid

- ✅ Frontend router contract parity with mounted backend namespaces (`analytics`, `audit`, `autoDiscovery`, `autoReconnect`, `catalog`, `memories`, `registry`, `system`).
- ✅ Legacy dead/mock backend route removed (`apps/backend/src/routers/logs.ts`).
- ✅ Build health currently green (`backend` + `frontend` builds succeed).

---

## Current Feature Matrix

### Core proxy and middleware

- ✅ Progressive disclosure flow (`search_tools` → `load_tool` → use loaded tool).
- ✅ Middleware chain active for tool calls.
- 🟡 Typing cleanup remains in functional middleware (`apps/backend/src/lib/metamcp/metamcp-middleware/functional-middleware.ts`, TODO marker).

### Logs / audit / observability

- ✅ Logs route is mounted and active via tRPC implementation.
- ✅ Audit list now uses real filtered totals via count query (`auditService.countLogs` + filtered `listLogs`).
- 🟡 User-reported runtime drift still needs final end-to-end confirmation for logs-query reliability after clean restarts.

### Agent / scripts / execution UX

- ✅ Backend `run_agent` flow exists and is mounted.
- ✅ `/scripts` page now routes users to the real `/agent` execution flow (no fake execution simulation).
- 🟡 `/agent` route works but UX and policy-scope clarity need polish.

### Inspector

- ✅ Core tabs/tools are implemented.
- ✅ Roots tab is now explicit capability/read-only status (no simulated root CRUD actions).
- 🟡 Sampling tab now attempts real `sampling/createMessage` request and reports unsupported capability when unavailable.
- 🟡 Inspector tools still include schema mismatch suppressions with `@ts-expect-error` comments.

### Registry / catalog / discovery

- ✅ Backend routes mounted.
- 🟡 Registry page still contains install defaults/placeholder behavior (`setServerArgs(["-y", "package-name"])`).
- 🟡 End-to-end install correctness needs hardening and validation across template variants.

### Settings and runtime reliability

- 🧪 Settings Docker image management remains a frontend-only stub (no backend endpoint).
- 🟡 Auth/session stability has improved but still needs runtime validation for logout persistence edge cases.
- 🟡 Hydration mismatch warnings need final root-cause closure and regression coverage.

---

## Priority Execution Order

1. **P0 — Replace simulated production UX paths**
   - Remove/replace stubs in `settings`, `scripts`, inspector roots/sampling.
2. **P0 — Correctness hardening for audit/logs**
   - True totals and filtering semantics; verify runtime behavior after full clean restart.
3. **P1 — Auth/hydration reliability closure**
   - Resolve persistent logout reports and hydration mismatch edge cases.
4. **P1 — Registry/discovery product hardening**
   - Eliminate placeholder defaults and validate full install path behavior.
5. **P2 — Typing and technical debt cleanup**
   - Remove suppressions and middleware typing TODOs.

---

## Workstreams

### Workstream A — Runtime Truthfulness

- [x] Implement `mcp.json` startup + hot reload integration.
- [x] Replace simulated inspector roots/sampling behavior with capability-driven real behavior or explicit unsupported state.
- [x] Replace `/scripts` placeholder experience with real frontend invocation path to `/agent`.
- [ ] Replace settings Docker stub with backend-backed persisted configuration.

### Workstream B — Data Correctness

- [x] Implement real audit totals/count query.
- [x] Implement backend audit filters (`userId`, `action`) for list + count queries.
- [ ] Finalize end-to-end verification of audit filter semantics in UI/runtime.
- [ ] Confirm logs-query behavior in clean runtime and remove drift between observed SQL and active source.

### Workstream C — Reliability

- [x] Harden frontend storage access for restricted browser contexts.
- [x] Suppress malformed empty stderr noise.
- [ ] Close auth/session logout instability with explicit regression coverage.
- [ ] Close hydration mismatch instability with deterministic reproduction + fix.

### Workstream D — Documentation and Handoff Discipline

- [ ] Keep `ROADMAP.md`, `TODO.md`, `HANDOFF.md`, and `DASHBOARD.md` synchronized after each implementation cycle.
- [ ] Maintain a "simulated vs real" matrix to prevent product-status drift.

---

## Definition of Complete (per feature)

A feature is complete only when all are true:

1. Backend implementation exists and is mounted.
2. Frontend representation is truthful (no hidden simulation unless explicitly labeled).
3. End-to-end runtime behavior is verified after clean restart.
4. Tests/diagnostics cover critical behavior.
5. Docs and handoff artifacts reflect current reality.