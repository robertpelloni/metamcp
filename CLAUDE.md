# Claude & Agent Guidelines for MetaMCP

This document provides comprehensive context, architectural principles, and operational workflows for AI agents (Claude, Jules, etc.) working on the MetaMCP repository.

## 🏗️ System Architecture

MetaMCP is an **Ultimate MCP Hub** that acts as a centralized gateway for downstream MCP servers.

### Core Components
1.  **The Hub (Proxy)**: `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
    *   **Progressive Disclosure**: Hides downstream tools by default. Exposes only meta-tools (`search_tools`, `load_tool`, `run_code`, `run_agent`).
    *   **Session Management**: Maintains a session-specific `loadedTools` set with FIFO eviction (max 200 items).
    *   **Recursive Routing**: Internal calls from the Sandbox are routed *back* through the middleware stack (`recursiveCallToolHandler`) to ensure logging, auth, and policy enforcement.

2.  **Code Mode (Sandbox)**: `apps/backend/src/lib/sandbox/code-executor.service.ts`
    *   Uses `isolated-vm` for secure, memory-limited execution (configurable via `CODE_EXECUTION_MEMORY_LIMIT`).
    *   Allows tool chaining via injected `mcp.call()`.

3.  **Semantic Search**: `apps/backend/src/lib/ai/tool-search.service.ts`
    *   Uses OpenAI Embeddings (`text-embedding-3-small`) and `pgvector` (Postgres extension).
    *   Tools are indexed on upsert.

4.  **Policy Engine**: `apps/backend/src/lib/access-control/policy.service.ts`
    *   Enforces Allow/Deny patterns on tool access.
    *   Middleware: `apps/backend/src/lib/metamcp/metamcp-middleware/policy.functional.ts`.

5.  **Autonomous Agent**: `apps/backend/src/lib/ai/agent.service.ts`
    *   Self-generating code execution for natural language tasks.
    *   Can be scoped by `policyId`.

### Tech Stack
*   **Monorepo**: Turborepo, pnpm workspaces.
*   **Backend**: Node.js (v22+), Express, TRPC, Drizzle ORM, Postgres (`pgvector` image).
*   **Frontend**: Next.js 15 (App Router), Tailwind, Shadcn UI, Playwright.
*   **Infrastructure**: Docker Compose (services: `app`, `db`, `mcpshark`).

## 🛠️ Development Workflow

### 1. Build & Run
*   **Install**: `pnpm install`
*   **Database**: `docker-compose up -d db` (Ensure `DATABASE_URL` is set)
*   **Dev Server**: `pnpm dev`
*   **Build**: `pnpm build` (Checks types and builds both apps)

### 2. Testing
*   **Backend Unit**: `apps/backend/node_modules/.bin/vitest apps/backend/src/...`
*   **Frontend Visual**: `python scripts/verify_frontend.py` (Playwright) - *See `frontend_verification_instructions` tool*.

### 3. Database Changes
*   **Schema**: Edit `apps/backend/src/db/schema.ts`.
*   **Generate**: `cd apps/backend && pnpm db:generate`
*   **Migrate**: `cd apps/backend && pnpm db:migrate`
*   **Caution**: Use `IF NOT EXISTS` for indexes in migrations to avoid transaction failures.

## 📦 Versioning & Changelog (CRITICAL)

**Every significant change or build MUST result in a version bump.**

1.  **Bump Version**:
    *   Update `version` in root `package.json`.
    *   Update `version` in `apps/backend/package.json` and `apps/frontend/package.json`.
2.  **Update Changelog**:
    *   Add an entry to `CHANGELOG.md` under `## [Version] - Date`.
    *   Categories: `Added`, `Changed`, `Fixed`, `Removed`.
3.  **Frontend Display**: The frontend sidebar automatically displays the version from `package.json`.

## 🚨 Coding Standards & Gotchas

*   **Recursion**: When modifying `metamcp-proxy.ts`, beware of the circular dependency in the middleware stack. Use the **Mutable Reference Pattern** (`recursiveCallToolHandlerRef`) to ensure the handler is defined before execution.
*   **Environment**: `OPENAI_API_KEY` is validated at startup. `isolated-vm` requires native build tools (`python3`, `make`, `g++`) in the Dockerfile.
*   **Security**: Never bypass the middleware stack for internal tool calls. Always use `delegateHandler` or `recursiveCallToolHandler`.
*   **Tool Names**: Tool names are namespaced: `serverName__toolName`.

## 🧠 Memory Bank (Recent Learnings)
*   **Migration Transactions**: `CREATE INDEX CONCURRENTLY` fails inside migration transactions. Use standard creation or separate scripts.
*   **Sandbox Memory**: Default 128MB is low for some tasks; use `CODE_EXECUTION_MEMORY_LIMIT`.
*   **Frontend Verify**: Local verification needs a running dev server *and* DB.
