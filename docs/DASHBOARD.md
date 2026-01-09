# Project Dashboard

## Overview
This dashboard provides a comprehensive view of the MetaMCP project structure, including all applications, packages, submodules, and dependencies.

**Current Version:** 3.2.0  
**Last Updated:** 2026-01-09  
**Build System:** Turborepo + pnpm  

## Quick Links
- [Project Structure](#project-structure)
- [Submodules & Packages](#submodules--packages)
- [Git Submodules](#git-submodules)
- [Key Dependencies](#key-dependencies)
- [Build Information](#build-information)
- [Version History](#version-history)

---

## Project Structure

The project is a **monorepo** managed with **Turborepo** and **pnpm workspaces**.

```
metamcp/
├── apps/                           # Application workspaces
│   ├── backend/                    # Express/TRPC backend (Node.js v22+)
│   │   ├── src/
│   │   │   ├── db/                 # Drizzle ORM schemas & repositories
│   │   │   ├── lib/
│   │   │   │   ├── access-control/ # Policy Engine
│   │   │   │   ├── ai/             # Agent, Embedding, Tool Search services
│   │   │   │   ├── metamcp/        # Core Hub/Proxy logic
│   │   │   │   └── sandbox/        # isolated-vm Code Executor
│   │   │   └── auth.ts             # better-auth configuration
│   │   └── mcp-shark/              # (Git Submodule) Traffic inspection
│   └── frontend/                   # Next.js 15 frontend (React 19)
│       ├── app/                    # App Router pages
│       └── components/             # Shadcn UI components
├── packages/                       # Shared packages
│   ├── eslint-config/              # Shared ESLint configurations
│   ├── trpc/                       # Shared TRPC router definitions
│   ├── typescript-config/          # Shared TypeScript configurations
│   └── zod-types/                  # Shared Zod schemas
├── submodules/                     # External Git submodules
│   └── mcp-shark/                  # Traffic inspection tool
├── docs/                           # Documentation (Mintlify)
│   ├── en/                         # English docs
│   └── cn/                         # Chinese docs
├── scripts/                        # Utility scripts
├── VERSION                         # Single source of truth for version
├── CHANGELOG.md                    # Version history
├── LLM_INSTRUCTIONS.md             # Universal AI model instructions
├── CLAUDE.md                       # Claude-specific instructions
├── AGENTS.md                       # Agent-specific instructions
├── GEMINI.md                       # Gemini-specific instructions
├── GPT.md                          # GPT-specific instructions
├── copilot-instructions.md         # GitHub Copilot instructions
├── HANDOFF.md                      # Architecture handoff documentation
└── ROADMAP.md                      # Feature roadmap
```

---

## Submodules & Packages

### Applications

| Name | Version | Location | Description | Tech Stack |
|:-----|:--------|:---------|:------------|:-----------|
| **backend** | 3.2.0 | `apps/backend` | MCP Hub/Proxy, API, Sandbox | Express 5.1, TRPC, Drizzle, isolated-vm |
| **frontend** | 3.2.0 | `apps/frontend` | Web UI Dashboard | Next.js 15, React 19, Tailwind 4, Shadcn |

### Shared Packages

| Name | Version | Location | Description |
|:-----|:--------|:---------|:------------|
| **@repo/eslint-config** | workspace | `packages/eslint-config` | Shared ESLint configurations (base, express, next) |
| **@repo/trpc** | workspace | `packages/trpc` | Shared tRPC router definitions |
| **@repo/typescript-config** | workspace | `packages/typescript-config` | Shared TypeScript configurations |
| **@repo/zod-types** | workspace | `packages/zod-types` | Shared Zod schemas and types |

---

## Git Submodules

External repositories included as Git submodules:

| Name | Location | Source | Purpose |
|:-----|:---------|:-------|:--------|
| **mcp-shark** | `apps/backend/mcp-shark` | [github.com/mcp-shark/mcp-shark](https://github.com/mcp-shark/mcp-shark) | MCP traffic inspection and logging |
| **mcp-shark** | `submodules/mcp-shark` | [github.com/mcp-shark/mcp-shark](https://github.com/mcp-shark/mcp-shark) | Reference copy for development |

### Submodule Commands
```bash
# Initialize submodules after clone
git submodule update --init --recursive

# Update submodules to latest
git submodule update --remote --merge

# Check submodule status
git submodule status
```

---

## Key Dependencies

### Backend Dependencies (with Ratings)

| Package | Version | Purpose | Relevance |
|:--------|:--------|:--------|:----------|
| **@modelcontextprotocol/sdk** | 1.16.0 | MCP Protocol implementation | ⭐⭐⭐⭐⭐ Core |
| **express** | 5.1.0 | HTTP server framework | ⭐⭐⭐⭐⭐ Core |
| **@trpc/server** | 11.4.1 | Type-safe API layer | ⭐⭐⭐⭐⭐ Core |
| **drizzle-orm** | 0.44.2 | Type-safe ORM for Postgres | ⭐⭐⭐⭐⭐ Core |
| **isolated-vm** | 6.0.2 | Secure sandbox for code execution | ⭐⭐⭐⭐⭐ Core |
| **openai** | 6.10.0 | LLM API for agent & embeddings | ⭐⭐⭐⭐⭐ Core |
| **pgvector** | 0.2.1 | Vector similarity search | ⭐⭐⭐⭐⭐ Core |
| **better-auth** | 1.4.2 | Authentication system | ⭐⭐⭐⭐ High |
| **pg** | 8.16.0 | PostgreSQL client | ⭐⭐⭐⭐ High |
| **helmet** | 8.1.0 | Security headers | ⭐⭐⭐ Medium |
| **cors** | 2.8.5 | Cross-origin requests | ⭐⭐⭐ Medium |
| **zod** | 3.25.64 | Schema validation | ⭐⭐⭐⭐ High |

### Frontend Dependencies

| Package | Version | Purpose | Relevance |
|:--------|:--------|:--------|:----------|
| **next** | 15.4.8 | React framework with App Router | ⭐⭐⭐⭐⭐ Core |
| **react** | 19.1.2 | UI library | ⭐⭐⭐⭐⭐ Core |
| **tailwindcss** | 4.1.10 | Utility CSS framework | ⭐⭐⭐⭐⭐ Core |
| **@radix-ui/*** | various | Accessible UI primitives (Shadcn) | ⭐⭐⭐⭐ High |
| **@tanstack/react-query** | 5.80.7 | Server state management | ⭐⭐⭐⭐ High |
| **@trpc/client** | 11.4.1 | Type-safe API client | ⭐⭐⭐⭐⭐ Core |
| **zustand** | 5.0.6 | Client state management | ⭐⭐⭐⭐ High |
| **lucide-react** | 0.515.0 | Icon library | ⭐⭐⭐ Medium |

---

## Build Information

| Property | Value |
|:---------|:------|
| **Build System** | Turborepo |
| **Package Manager** | pnpm@9.0.0 |
| **Node Version** | >=18 (recommended: 22+) |
| **TypeScript** | 5.8.2 |
| **Database** | PostgreSQL with pgvector extension |
| **Container** | Docker & Docker Compose |

### Build Commands

```bash
# Install dependencies
pnpm install

# Development (starts both frontend & backend)
pnpm dev

# Production build
pnpm build

# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm check-types

# Format code
pnpm format

# Docker development with hot reload
pnpm dev:docker
```

---

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for complete history.

| Version | Date | Highlights |
|:--------|:-----|:-----------|
| **3.2.0** | 2026-01-09 | Documentation overhaul, enhanced LLM instructions, session handoff system |
| **3.1.0** | 2025-12-27 | Agent implementation, Dashboard documentation |
| **3.0.3** | 2025-12-27 | Enhanced semantic indexing |
| **3.0.2** | 2025-12-27 | Policy Engine implementation |
| **3.0.1** | 2025-12-27 | Centralized versioning, LLM_INSTRUCTIONS.md |
| **3.0.0** | 2025-12-15 | Major: Autonomous Agent, Code Mode, Semantic Search, Progressive Disclosure |

---

## Recent Updates

- **Documentation System**: Enhanced LLM instructions with comprehensive workflow guidelines
- **Session Handoff**: Implemented session documentation for AI continuity
- **Submodule Documentation**: Added mcp-shark as tracked submodule
- **Dependency Documentation**: Rated and documented key dependencies

---

## Environment Variables

See `example.env` for full list. Key variables:

| Variable | Required | Description |
|:---------|:---------|:------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (must support pgvector) |
| `OPENAI_API_KEY` | Yes | For semantic search and agent features |
| `APP_URL` | Yes | Application URL for auth callbacks |
| `BETTER_AUTH_SECRET` | Yes | Secret for authentication |
| `CODE_EXECUTION_MEMORY_LIMIT` | No | Sandbox memory limit in MB (default: 128) |
