# 📊 MetaMCP Dashboard

## 🏗️ Project Structure

MetaMCP is organized as a monorepo using **Turborepo** and **pnpm workspaces**.

### Apps
| Directory | Name | Type | Description |
|-----------|------|------|-------------|
| `apps/backend` | `backend` | Node.js (Express) | The core MCP Proxy, Sandbox, and TRPC server. Contains the logic for Tool RAG, Code Mode, and Agent Orchestration. |
| `apps/frontend` | `frontend` | Next.js (React) | The dashboard UI. Provides interfaces for Live Logs, Policies, Scripts, and Agent Chat. |

### Packages (Shared Libraries)
| Directory | Name | Description |
|-----------|------|-------------|
| `packages/trpc` | `@repo/trpc` | Shared TRPC router definitions. Defines the API contract between Backend and Frontend. |
| `packages/zod-types` | `@repo/zod-types` | Shared Zod schemas for database models and API validation (e.g., Logs, Config, Tools). |
| `packages/eslint-config` | `@repo/eslint-config` | Shared ESLint configuration for code consistency. |
| `packages/typescript-config` | `@repo/typescript-config` | Shared `tsconfig.json` bases. |

## 🛠️ Submodule & Dependency Status

*Note: This project uses pnpm workspaces, not git submodules.*

| Module | Location | Status | Build | Last Updated |
|--------|----------|--------|-------|--------------|
| **Core Proxy** | `apps/backend` | 🟢 Active | v3.4.0 | 2025-12-25 |
| **Web Dashboard** | `apps/frontend` | 🟢 Active | v3.4.0 | 2025-12-25 |
| **TRPC Contract** | `packages/trpc` | 🟢 Active | v1.0.0 | 2025-12-25 |
| **DB Schema** | `apps/backend/drizzle` | 🟢 Active | v17 | 2025-12-25 |

## 🐳 Infrastructure

| Service | Image | Version | Description |
|---------|-------|---------|-------------|
| `app` | `ghcr.io/metatool-ai/metamcp` | latest | Main application container (Backend + Frontend). |
| `postgres` | `pgvector/pgvector` | **pg17** | Database with Vector Search capabilities. |
| `mcpshark` | `node:20-slim` | n/a | Sidecar service for advanced MCP traffic inspection. |

## 🗺️ Key Locations

*   **Proxy Entry Point:** `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
*   **Python Sandbox:** `apps/backend/src/lib/sandbox/python-executor.service.ts`
*   **Meta Tools Handler:** `apps/backend/src/lib/metamcp/handlers/meta-tools.handler.ts`
*   **Frontend Logs Page:** `apps/frontend/app/[locale]/(sidebar)/live-logs/page.tsx`
