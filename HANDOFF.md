# 🏁 MetaMCP Hub: Handoff & Architecture Documentation (v3.6.0)

**Date:** January 26, 2026
**Author:** Jules
**Status:** Feature Complete (Hub, Agent, Memory, Registry, Analytics, Audit)

## 🎯 Project Overview

MetaMCP is the **Ultimate MCP Hub** and **Meta-Orchestrator** within the Borg ecosystem. It acts as a centralized gateway for downstream MCP servers, solving the "tool overload" problem via **Progressive Disclosure**.

### Core Value Proposition
1.  **99% Token Reduction**: Hides downstream tools by default.
2.  **Semantic Search**: Finds tools by intent using `pgvector`.
3.  **Code Mode**: Allows agents to chain tools in a secure sandbox.
4.  **Autonomous Agents**: Self-directing agents with long-term memory.

---

## 🏗️ System Architecture

### 1. The Hub (Proxy)
-   **File:** `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
-   **Function**: Intercepts `tools/list` to hide tools. Exposes "Meta Tools" (`search_tools`, `load_tool`, `run_agent`).
-   **Session Management**: Maintains a `loadedTools` set per session (FIFO eviction, max 200).
-   **Middleware Stack**: `Logging` -> `Policy` -> `Filter` -> `ToolOverrides` -> `Impl`.

### 2. Autonomous Agent & Memory
-   **Service:** `apps/backend/src/lib/ai/agent.service.ts`
-   **Memory:** `apps/backend/src/lib/memory/memory.service.ts`
-   **Flow**:
    1.  User calls `run_agent(task)`.
    2.  Agent searches `tools` (Vector DB) and `memories` (Vector DB).
    3.  Agent prompts OpenAI to generate TypeScript.
    4.  Code executes in `isolated-vm` sandbox.
    5.  Sandbox calls route back through `recursiveCallToolHandler` for security.

### 3. MCP Registry & Templates
-   **Service:** `apps/backend/src/lib/registry/registry.service.ts`
-   **Data Source:** `submodules/mcp-directories/registry.json`.
-   **Templates:** `apps/backend/src/lib/templates/server-templates.json` provides "One-Click" configs.
-   **UI**: `/registry` page allows searching and installing servers.

### 4. Observability & Security
-   **Analytics**: `apps/backend/src/lib/analytics/analytics.service.ts` aggregates usage stats.
-   **Audit Logging**: `apps/backend/src/lib/audit/audit.service.ts` tracks `CREATE_POLICY`, `INSTALL_SERVER`, `LOGIN` events.
-   **Traffic Inspection**: `apps/backend/mcp-shark` (Submodule) embedded in `/observability`.

---

## 🔑 Key Files & Configuration

| File | Purpose |
| :--- | :--- |
| `metamcp-proxy.ts` | **The Brain**. Handles tool listing, loading, and proxying. |
| `agent.service.ts` | LLM-based autonomous agent logic. |
| `code-executor.service.ts` | `isolated-vm` sandbox logic. |
| `audit.service.ts` | Security event logging. |
| `schema.ts` | Drizzle ORM definitions (23 tables). |
| `LLM_INSTRUCTIONS.md` | Universal guidelines for AI models. |

**Environment Variables**:
-   `DATABASE_URL`: Postgres (must support pgvector).
-   `OPENAI_API_KEY`: Required for Embeddings/Agent.
-   `CODE_EXECUTION_MEMORY_LIMIT`: Sandbox limit (default 128MB).

---

## 🧠 "Mental Model" for Developers

1.  **Recursive Routing**: The most critical pattern. Code executed inside the sandbox calls `mcp.call()`. This call is **routed back** through the middleware stack (`recursiveCallToolHandler`). This ensures that a script cannot bypass logging, auth, or policies.
2.  **Mutable Reference**: `metamcp-proxy.ts` uses `recursiveCallToolHandlerRef` to handle the circular dependency between the internal handler and the composed middleware stack.
3.  **Progressive Disclosure**: We lie to the client. We say "here are 10 tools" when there are 1000. We only reveal the rest when `load_tool` is called.
4.  **Submodules**: The project relies on `mcp-shark` and `mcp-directories`. Always check `git submodule status`.

---

## 🚀 Roadmap & Next Steps

**Immediate Priorities (Post-v3.6.0):**

1.  **Cost Tracking**: Estimate token usage and API costs for agent runs.
3.  **Tool Composition**: Allow agents to create "Macros" (sequences of tools) saved as new tools.

**Known Technical Debt:**
-   **OIDC/OAuth UI**: The backend tables exist (`oauth_clients`), but there is no admin UI to configure clients.
-   **Unit Tests**: Coverage is good for services, but integration tests for the full Proxy flow are limited due to mocking complexity.

---

## 📦 How to Build & Run

```bash
# 1. Install
pnpm install

# 2. Database
docker-compose up -d db
pnpm db:generate
pnpm db:migrate

# 3. Run
pnpm dev
```

**Verification**:
-   Run `pnpm build` to verify type safety.
-   Run `vitest` in `apps/backend` for logic checks.
