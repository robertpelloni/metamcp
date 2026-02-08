# Universal LLM Instructions for MetaMCP

This document serves as the central source of truth for all AI models (Claude, GPT, Gemini, etc.) working on the MetaMCP repository.

## 🛡️ Primary Directives

1.  **Security First**:
    *   Do not modify `isolated-vm` configuration to weaken security (e.g., enabling network access directly) without explicit user authorization.
    *   Ensure all new tool execution paths route through the **Policy Middleware**.

2.  **Versioning Mandatory**:
    *   **Rule**: Every PR that touches code MUST include a version bump in `VERSION` file, `package.json` (Apps), and a `CHANGELOG.md` entry.
    *   **Format**: Semantic Versioning (Major.Minor.Patch).
    *   **Source of Truth**: The `VERSION` file in the root directory is the single source of truth for the project version.

3.  **Progressive Disclosure**:
    *   Do not expose raw downstream tools in `tools/list` by default.
    *   Maintain the "Search -> Load -> Use" pattern to conserve context.

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
    *   Update `VERSION` file in root.
    *   Update `version` in `apps/backend/package.json` and `apps/frontend/package.json`.
2.  **Update Changelog**:
    *   Add an entry to `CHANGELOG.md` under `## [Version] - Date`.
    *   Categories: `Added`, `Changed`, `Fixed`, `Removed`.
3.  **Commit Message**:
    *   Include the new version number in the commit message (e.g., "chore: bump version to 3.0.1").

## 🚨 Coding Standards & Gotchas

*   **Recursion**: When modifying `metamcp-proxy.ts`, beware of the circular dependency in the middleware stack. Use the **Mutable Reference Pattern** (`recursiveCallToolHandlerRef`) to ensure the handler is defined before execution.
*   **Environment**: `OPENAI_API_KEY` is validated at startup. `isolated-vm` requires native build tools (`python3`, `make`, `g++`) in the Dockerfile.
*   **Security**: Never bypass the middleware stack for internal tool calls. Always use `delegateHandler` or `recursiveCallToolHandler`.
*   **Tool Names**: Tool names are namespaced: `serverName__toolName`.

## 🤖 Capabilities & Constraints

### Code Mode (`run_code`)
*   **Environment**: Restricted Node.js environment.
*   **Access**: No direct filesystem/network access.
*   **Tool Calling**: Must use `await mcp.call('tool_name', args)`.
*   **Limit**: Execution time defaults to 30s. Memory defaults to 128MB (configurable).

### Autonomous Agent (`run_agent`)
*   **Scope**: By default, has access to all tools via Search.
*   **Restriction**: Can be restricted by passing `policyId`.
*   **Output**: Returns the final result of the generated script.
