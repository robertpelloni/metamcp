# 📊 MetaMCP Dashboard

**Version:** 3.6.0  
**Last Updated:** 2026-02-12

## 🏗️ Project Structure

MetaMCP is organized as a monorepo using **Turborepo** and **pnpm workspaces**.

### Apps
| Directory | Name | Type | Description |
|-----------|------|------|-------------|
| `apps/backend` | `backend` | Node.js (Express 5) | The core MCP Proxy, Sandbox, and tRPC server. Contains Tool RAG, Code Mode, Agent, Memory, Registry, and Analytics. |
| `apps/frontend` | `frontend` | Next.js 15 (React 19) | The dashboard UI with dark mode. Provides interfaces for MCP management, Inspector, Live Logs, Policies, Agent Chat, Registry, and Analytics. |

### Packages (Shared Libraries)
| Directory | Name | Description |
|-----------|------|-------------|
| `packages/trpc` | `@repo/trpc` | Shared tRPC router definitions. Defines the API contract between Backend and Frontend. |
| `packages/zod-types` | `@repo/zod-types` | Shared Zod schemas for database models and API validation. |
| `packages/eslint-config` | `@repo/eslint-config` | Shared ESLint configuration for code consistency. |
| `packages/typescript-config` | `@repo/typescript-config` | Shared `tsconfig.json` bases. |

## 🛠️ Module & Dependency Status

| Module | Location | Status | Version | Last Updated |
|--------|----------|--------|---------|--------------|
| **Core Proxy** | `apps/backend` | 🟢 Active | v3.6.0 | 2026-02-12 |
| **Web Dashboard** | `apps/frontend` | 🟢 Active | v3.6.0 | 2026-02-12 |
| **tRPC Contract** | `packages/trpc` | 🟢 Active | v1.0.0 | 2025-12-25 |
| **Zod Types** | `packages/zod-types` | 🟢 Active | v1.0.0 | 2025-12-25 |

## ⚠️ Implementation Gap Snapshot (2026-02-16)

The codebase contains several capabilities that are present in source but not consistently mounted, surfaced, or productionized end-to-end.

- **Mounted in active frontend tRPC router**: `mcpServers`, `namespaces`, `endpoints`, `oauth`, `tools`, `apiKeys`, `config`, `logs`, `savedScripts`, `toolSets`, `policies`, `agent`, `serverHealth`
- **Implementation modules currently not mounted in active frontend tRPC router**: `analytics`, `audit`, `auto-discovery`, `auto-reconnect`, `catalog`, `memories`, `registry`, `system`
- **Known placeholder/simulated UX paths**:
	- Settings Docker image update control is frontend-stubbed
	- Scripts page includes simulated “run_agent” guidance flow
	- Inspector Roots and Sampling include placeholder/simulated behavior

See `docs/ROADMAP.md` and `TODO.md` for prioritized resolution plan and acceptance criteria.

## 📦 Submodules

| Submodule | Location | URL | Purpose |
|-----------|----------|-----|---------|
| **mcp-shark** | `apps/backend/mcp-shark` | [mcp-shark/mcp-shark](https://github.com/mcp-shark/mcp-shark) | Advanced MCP traffic inspection sidecar |
| **mcp-shark** (ref) | `submodules/mcp-shark` | [mcp-shark/mcp-shark](https://github.com/mcp-shark/mcp-shark) | Reference copy for development |
| **bobcoin** | `submodules/bobcoin` | [robertpelloni/bobcoin](https://github.com/robertpelloni/bobcoin) | Decentralized economy layer (Proof of Useful Stake) |
| **cointrade** | `submodules/cointrade` | [robertpelloni/cointrade](https://github.com/robertpelloni/cointrade) | Autonomous multi-agent crypto trading platform |
| **mcp-directories** | `submodules/mcp-directories` | [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | MCP server discovery catalogs (950+ servers) |

## 🐳 Infrastructure

| Service | Image | Version | Description |
|---------|-------|---------|-------------|
| `app` | `ghcr.io/metatool-ai/metamcp` | latest | Main application container (Backend + Frontend). |
| `postgres` | `pgvector/pgvector` | **pg17** | PostgreSQL with Vector Search (pgvector). |
| `mcpshark` | `node:20-slim` | n/a | Sidecar service for MCP traffic inspection. |

## 🗺️ Key Locations

*   **Proxy Entry Point:** `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
*   **Semantic Search:** `apps/backend/src/lib/ai/tool-search.service.ts`
*   **Agent Service:** `apps/backend/src/lib/ai/agent.service.ts`
*   **Memory Service:** `apps/backend/src/lib/memory/`
*   **Registry Service:** `apps/backend/src/lib/registry/`
*   **Analytics Service:** `apps/backend/src/lib/analytics/`
*   **Code Sandbox:** `apps/backend/src/lib/sandbox/code-executor.service.ts`
*   **Python Sandbox:** `apps/backend/src/lib/sandbox/python-executor.service.ts`
*   **Meta Tools Handler:** `apps/backend/src/lib/metamcp/handlers/meta-tools.handler.ts`
*   **Frontend Sidebar:** `apps/frontend/app/[locale]/(sidebar)/layout.tsx`
*   **Theme Toggle:** `apps/frontend/components/ui/theme-toggle.tsx`
*   **Theme Provider:** `apps/frontend/components/providers/theme-provider.tsx`
