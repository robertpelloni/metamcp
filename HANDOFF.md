# 🏁 MetaMCP Hub: Handoff & Architecture Documentation (v3.10.0)

**Date:** January 26, 2026
**Author:** Jules
**Status:** Feature Complete (Hub, Agent, Memory, Registry, Analytics, Audit, Cost Tracking, OAuth, Scheduler, Notifications, Tool Personas)

## 🎯 Project Overview

MetaMCP is the **Ultimate MCP Hub** and **Meta-Orchestrator** within the Borg ecosystem. It acts as a centralized gateway for downstream MCP servers, solving the "tool overload" problem via **Progressive Disclosure** and providing advanced orchestration capabilities.

### Core Value Proposition
1.  **99% Token Reduction**: Hides downstream tools by default, exposing only meta-tools.
2.  **Semantic Search**: Finds tools by intent using `pgvector` and OpenAI embeddings.
3.  **Code Mode**: Allows agents to chain tools in a secure `isolated-vm` sandbox.
4.  **Autonomous Agents**: Self-directing agents with long-term memory and policy enforcement.
5.  **Tool Personas**: Save and load specific tool sets for focused tasks.

---

## 🏗️ System Architecture

### 1. The Hub (Proxy)
-   **File:** `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
-   **Function**: Intercepts `tools/list` to hide tools. Exposes "Meta Tools" (`search_tools`, `load_tool`, `run_agent`, `save_tool_set`, `load_tool_set`, etc.).
-   **Session Management**: Maintains a `loadedTools` set per session (FIFO eviction, max 200).
-   **Middleware Stack**: `Logging` -> `RateLimit` -> `Policy` -> `Filter` -> `ToolOverrides` -> `Impl`.

### 2. Autonomous Agent & Memory
-   **Service:** `apps/backend/src/lib/ai/agent.service.ts`
-   **Memory:** `apps/backend/src/lib/memory/memory.service.ts`
-   **Flow**:
    1.  User calls `run_agent(task)`.
    2.  Agent searches `tools` (Vector DB) and `memories` (Vector DB).
    3.  Agent prompts OpenAI to generate TypeScript.
    4.  Code executes in `isolated-vm` sandbox.
    5.  Sandbox calls route back through `recursiveCallToolHandler` for security/middleware application.

### 3. Registry & Templates
-   **Service:** `apps/backend/src/lib/registry/registry.service.ts`
-   **Data Source:** `submodules/mcp-directories/registry.json`.
-   **Templates:** `apps/backend/src/lib/templates/server-templates.json`.
-   **UI**: `/registry` page allows searching and installing servers.

### 4. Observability, Security & Analytics
-   **Analytics**: `apps/backend/src/lib/analytics/analytics.service.ts` aggregates usage stats.
-   **Cost Tracking**: `apps/backend/src/lib/analytics/cost-tracking.service.ts` tracks token usage and USD costs.
-   **Audit Logging**: `apps/backend/src/lib/audit/audit.service.ts` tracks security events.
-   **Rate Limiting**: `apps/backend/src/lib/metamcp/metamcp-middleware/rate-limit.functional.ts` enforces limits.
-   **Traffic Inspection**: `apps/backend/mcp-shark` (Submodule) embedded in `/observability`.

### 5. Scheduling & Notifications
-   **Scheduler**: `apps/backend/src/lib/scheduler/scheduler.service.ts` uses `node-cron` to execute saved scripts or agents.
-   **Notifications**: `apps/backend/src/lib/notifications/notification.service.ts` manages alerts displayed in the UI bell.

### 6. Tool Personas (v3.10.0)
-   **Service**: `apps/backend/src/lib/metamcp/tool-set.service.ts`
-   **Concept**: Users can save a set of loaded tools as a "Persona" (with icon, color, description) to quickly restore context.
-   **UI**: `/tool-sets` page for management.

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
| `AGENTS.md` | Operational directives for AI agents. |

**Environment Variables**:
-   `DATABASE_URL`: Postgres (must support pgvector).
-   `OPENAI_API_KEY`: Required for Embeddings/Agent.
-   `CODE_EXECUTION_MEMORY_LIMIT`: Sandbox limit (default 128MB).
-   `MCP_TIMEOUT`: Default timeout (60000ms).

---

## 🧠 "Mental Model" for Developers

1.  **Recursive Routing**: The most critical pattern. Code executed inside the sandbox calls `mcp.call()`. This call is **routed back** through the middleware stack (`recursiveCallToolHandler`). This ensures that a script cannot bypass logging, auth, or policies.
2.  **Mutable Reference**: `metamcp-proxy.ts` uses `recursiveCallToolHandlerRef` to handle the circular dependency between the internal handler and the composed middleware stack.
3.  **Progressive Disclosure**: We lie to the client. We say "here are 10 tools" when there are 1000. We only reveal the rest when `load_tool` is called.
4.  **Submodules**: The project relies on `mcp-shark` and `mcp-directories`. Always check `git submodule status`.

---

## 🚀 Roadmap & Next Steps

**Immediate Priorities:**
1.  **Rate Limiting UI**: Add a frontend interface to configure and view rate limits.
2.  **Workflow Builder**: A visual tool to chain tools together without writing code manually.
3.  **Marketplace**: Expand the Registry into a community marketplace.

**Completed Features (v3.10.0):**
-   Tool Personas (Profiles) with enhanced UI.
-   Scheduled Tasks & Notifications.
-   OAuth Client Management UI.
-   Cost Tracking & Usage Analytics.

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
