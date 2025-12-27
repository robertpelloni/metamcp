# 🏁 MetaMCP Hub: Handoff & Architecture Documentation

**Date:** December 2025
**Author:** Jules
**Status:** Core Features Implemented (Hub, Progressive Disclosure, Semantic Search, Code Mode, Agent)

## 🎯 Project Overview

This repository has been transformed into an **Ultimate MCP Hub**. It acts as a centralized Gateway/Proxy for multiple downstream MCP servers. Instead of loading thousands of tools into an LLM's context, it uses **Progressive Disclosure**:

1.  The LLM sees only "Meta Tools" (`search_tools`, `load_tool`, `run_code`, `run_agent`).
2.  The LLM searches for tools semantically (using `pgvector` embeddings).
3.  The LLM loads only the specific tools it needs for the task.
4.  The LLM can execute complex workflows via `run_code` (Sandboxed JS) or `run_agent` (Autonomous Task).

## 🏗️ Architecture

### 1. The Hub (Proxy)
-   **File:** `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
-   **Logic:**
    -   Intercepts `tools/list` to hide downstream tools.
    -   Exposes Meta Tools.
    -   Maintains a session-based `loadedTools` set (FIFO eviction, max 200).
    -   Proxies `tools/call` to the appropriate downstream MCP server *only if loaded*.

### 2. Semantic Search (Tool RAG)
-   **Service:** `apps/backend/src/lib/ai/tool-search.service.ts`
-   **Embedding:** `apps/backend/src/lib/ai/embedding.service.ts`
-   **DB:** Postgres with `pgvector` extension. Table `tools` has an `embedding` column (vector(1536)).
-   **Flow:**
    -   Tools are upserted into DB.
    -   Embeddings are generated via OpenAI `text-embedding-3-small`.
    -   `search_tools` performs cosine similarity search.

### 3. Code Mode (Sandbox)
-   **Service:** `apps/backend/src/lib/sandbox/code-executor.service.ts`
-   **Tech:** `isolated-vm` (Secure Node.js Isolate).
-   **Security:**
    -   Memory Limit: Configurable via `CODE_EXECUTION_MEMORY_LIMIT` (default 128MB).
    -   No network/FS access by default (unless via MCP tools).
-   **Recursion:** Code inside the sandbox calls `mcp.call()`. This is routed *back* through the MetaMCP Middleware stack (`recursiveCallToolHandler`) to ensure logging, auth, and policy enforcement apply to sub-calls.

### 4. Autonomous Agent
-   **Service:** `apps/backend/src/lib/ai/agent.service.ts`
-   **Tool:** `run_agent`
-   **Logic:**
    -   Takes a natural language task.
    -   Searches the Vector DB for relevant tools.
    -   Prompts OpenAI (`gpt-4o` or similar) to write a script.
    -   Executes the script in the Sandbox.

### 5. Inspection (Mcpshark)
-   **Middleware:** `apps/backend/src/lib/metamcp/metamcp-middleware/logging.functional.ts`
-   **UI:** `apps/frontend/app/[locale]/(sidebar)/live-logs/page.tsx`
-   **Data:** Persists all tool calls to `tool_call_logs` table.

## 🔑 Key Files & Configuration

| File | Purpose |
| :--- | :--- |
| `metamcp-proxy.ts` | The core "Brain". Handles tool listing, loading, and proxying. |
| `code-executor.service.ts` | Handles `isolated-vm` execution. |
| `tool-search.service.ts` | Semantic search logic. |
| `agent.service.ts` | LLM-based autonomous agent logic. |
| `setup-local.sh` | Script for local (non-Docker) setup. |
| `docker-compose.yml` | Uses `pgvector/pgvector:pg16` and includes `mcp-shark`. |

**Environment Variables:**
-   `DATABASE_URL`: Postgres connection (must support pgvector).
-   `OPENAI_API_KEY`: Required for Semantic Search and Agent.
-   `CODE_EXECUTION_MEMORY_LIMIT`: Sandbox memory (MB).

## 🧠 Memories & Learnings

-   **Recursive Routing:** The most critical architectural decision was routing sandbox calls back through the middleware. This ensures that "Code Mode" isn't a backdoor; it's just a high-speed client living inside the server.
-   **Circular Dependencies:** The proxy has complex recursion. We used a "Mutable Reference" pattern (`recursiveCallToolHandlerRef`) to allow the internal handler to call the fully composed middleware stack without hoisting issues.
-   **Migration Safety:** Use `IF NOT EXISTS` for indexes in migrations to prevent failures in transaction blocks.
-   **Frontend Verification:** Local dev requires a running DB. Without it, frontend verification scripts needing data will fail (though the build succeeds).

## 🚀 Recommended Next Steps

1.  **Enhanced Indexing (Index-Time RAG)**
    *   Currently, we embed the raw tool description.
    *   **Improvement:** When a tool is registered, use an LLM to generate a "Synthetic User Query" or "Rich Description" (e.g., "Use this tool when the user wants to X, Y, or Z") and embed *that*. This improves retrieval accuracy.

2.  **Frontend Agent UI**
    *   Create a dedicated Chat UI for the Agent (currently it's just a test dialog).
    *   Allow streaming progress updates from the agent script.

3.  **mcp.json Auto-Discovery**
    *   Implement a file watcher to automatically load/unload MCP servers from a configured directory.

## 📦 Handoff Instructions

To continue work:
1.  Ensure `pnpm install` and `pnpm db:migrate` are run.
2.  Set `OPENAI_API_KEY` in `.env`.
3.  Start with `pnpm dev`.
4.  **Policy Engine** is now implemented. You can create policies in the UI and pass `policyId` to `run_agent`.
5.  Next focus: **Enhanced Indexing** or **Frontend Agent UI**.
