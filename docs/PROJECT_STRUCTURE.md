# Project Structure & Dashboard

This document provides an overview of the MetaMCP project structure and its submodules/packages.

## 📂 Directory Layout

```
metamcp/
├── apps/                   # Application workspaces
│   ├── backend/            # Express/TRPC backend (Node.js)
│   └── frontend/           # Next.js frontend (React)
├── packages/               # Shared packages
│   ├── eslint-config/      # Shared ESLint configurations
│   ├── trpc/               # Shared TRPC router definitions
│   ├── typescript-config/  # Shared TypeScript configurations
│   └── zod-types/          # Shared Zod schemas
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── docker-compose.yml      # Production Docker composition
├── docker-compose.dev.yml  # Development Docker composition
├── LLM_INSTRUCTIONS.md     # Universal instructions for AI models
├── VERSION                 # Current project version (Source of Truth)
└── CHANGELOG.md            # Version history
```

## 📦 Submodules & Packages

| Package | Path | Version | Description |
| :--- | :--- | :--- | :--- |
| **Backend** | `apps/backend` | 3.0.1 | Core logic, MCP Proxy, Sandbox, Database |
| **Frontend** | `apps/frontend` | 3.0.1 | User Interface, Dashboard, Settings |
| **TRPC** | `packages/trpc` | *workspace* | Shared API definitions |
| **Zod Types** | `packages/zod-types` | *workspace* | Shared data validation schemas |
| **ESLint Config** | `packages/eslint-config` | *workspace* | Linting rules |
| **TS Config** | `packages/typescript-config` | *workspace* | TypeScript compiler options |

## 🔄 Versioning

The project uses a centralized versioning system.
*   **Current Version**: `3.0.1`
*   **Source of Truth**: `VERSION` file in the root directory.
*   **Sync**: `apps/backend/package.json` and `apps/frontend/package.json` are synchronized with this version.

## 🛠️ Infrastructure

*   **Database**: Postgres with `pgvector` (for semantic search).
*   **Runtime**: Node.js (v22+).
*   **Package Manager**: pnpm (via Turborepo).
*   **Containerization**: Docker & Docker Compose.
