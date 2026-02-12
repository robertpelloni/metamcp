# Universal LLM Instructions for MetaMCP

This document is the **single source of truth** for all AI models (Claude, GPT, Gemini, Copilot, Codex, etc.) working on the MetaMCP repository. Model-specific appendices are in their respective files (CLAUDE.md, GEMINI.md, GPT.md, copilot-instructions.md, AGENTS.md).

---

## 🛡️ Primary Directives

1. **Security First**
   - Never modify `isolated-vm` configuration to weaken security without explicit user authorization.
   - All new tool execution paths **must** route through the **Policy Middleware**.
   - Never bypass the middleware stack for internal tool calls; always use `delegateHandler` or `recursiveCallToolHandler`.

2. **Versioning Mandatory**
   - Every PR that touches code **must** include:
     - A **version bump** in the root `VERSION` file (the single source of truth).
     - Matching bumps in root `package.json` and `apps/frontend/package.json`.
     - A **`CHANGELOG.md` entry** under `## [Version] - YYYY-MM-DD`.
   - Format: **Semantic Versioning** (Major.Minor.Patch).
   - Commit messages **must** reference the new version (e.g., `chore: bump version to 3.6.0`).

3. **Progressive Disclosure**
   - Never expose raw downstream tools in `tools/list` by default.
   - Maintain the **"Search → Load → Use"** pattern to conserve context.

4. **Type Safety**
   - Never use `as any`, `@ts-ignore`, or empty `catch` blocks.
   - All code must be strictly typed (TypeScript `strict: true`).

5. **Changelog & Documentation**
   - Every significant change must update `CHANGELOG.md` with categories: `Added`, `Changed`, `Fixed`, `Removed`.
   - Update `docs/ROADMAP.md` when completing planned features.
   - Update `DASHBOARD.md` when adding/changing submodules or services.

---

## 🏗️ System Architecture

MetaMCP is an **MCP Aggregator/Proxy/Gateway** that centralizes downstream MCP servers into a unified endpoint with progressive tool disclosure.

### Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Frontend  | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui |
| Backend   | Express 5, tRPC, Drizzle ORM                     |
| Database  | PostgreSQL 17 + pgvector, SQLite (dev option)    |
| Auth      | Better Auth + OIDC                                |
| Build     | Turborepo, pnpm workspaces, tsup                 |
| Container | Docker Compose                                    |

### Core Components

1. **The Hub (Proxy)**: `apps/backend/src/lib/metamcp/metamcp-proxy.ts`
   - Progressive Disclosure: hides downstream tools, exposes meta-tools (`search_tools`, `load_tool`, `run_code`, `run_agent`).
   - Session Management: per-session `loadedTools` set with FIFO eviction (max 200).
   - Recursive Routing: internal sandbox calls route back through middleware via `recursiveCallToolHandlerRef`.

2. **Code Mode (Sandbox)**: `apps/backend/src/lib/sandbox/code-executor.service.ts`
   - `isolated-vm` for secure, memory-limited JS execution (configurable via `CODE_EXECUTION_MEMORY_LIMIT`).
   - Tool chaining via injected `mcp.call()`.

3. **Semantic Search**: `apps/backend/src/lib/ai/tool-search.service.ts`
   - OpenAI Embeddings (`text-embedding-3-small`) + `pgvector`.
   - Auto-indexing on tool upsert; enhanced via `DescriptionEnhancerService`.

4. **Policy Engine**: `apps/backend/src/lib/access-control/policy.service.ts`
   - Allow/Deny patterns on tool access.
   - Middleware at `apps/backend/src/lib/metamcp/metamcp-middleware/policy.functional.ts`.

5. **Autonomous Agent**: `apps/backend/src/lib/ai/agent.service.ts`
   - NL → code generation → execution.
   - Scoped by `policyId`.

6. **Agent Memory**: `apps/backend/src/lib/memory/`
   - Long-term persistence with vector embeddings.
   - Semantic retrieval via `search_memory` tool.

7. **MCP Registry**: `apps/backend/src/lib/registry/`
   - Centralized discovery of 950+ community MCP servers.
   - One-click install from `server-templates.json`.

8. **Analytics**: `apps/backend/src/lib/analytics/`
   - Tool usage metrics, error rates, top tools dashboard.

---

## 🛠️ Development Workflow

### Build & Run
- **Install**: `pnpm install`
- **Database**: `docker compose up -d db` (ensure `DATABASE_URL` is set)
- **Dev Server**: `pnpm dev` (runs both backend on :12009 and frontend on :12008)
- **Build**: `pnpm build` (type checks + builds both apps)

### Testing
- **Backend Unit**: `cd apps/backend && npx vitest`
- **Frontend Visual**: Available via MCP Inspector integration

### Database Changes
- **Schema**: Edit `apps/backend/src/db/schema.ts`
- **Generate**: `cd apps/backend && pnpm db:generate:dev`
- **Migrate**: `cd apps/backend && pnpm db:migrate:dev`
- **Caution**: Use `IF NOT EXISTS` for indexes in migrations.

### Docker
- **Dev**: `pnpm dev:docker` (docker-compose.dev.yml)
- **Prod**: `docker compose up -d`
- **Clean**: `pnpm dev:docker:clean`

---

## 📦 Versioning Protocol

1. **Bump Version**: Update `VERSION` (root), root `package.json`, `apps/frontend/package.json`.
2. **Update Changelog**: Add entry to `CHANGELOG.md`.
3. **Commit**: Include version in commit message.
4. **The sidebar reads version dynamically** from `package.json` — do not hardcode.

---

## 📁 Project Structure

```
metamcp/
├── apps/
│   ├── backend/          # Express + tRPC API server
│   │   ├── src/
│   │   │   ├── db/       # Drizzle schema & migrations
│   │   │   ├── lib/      # Core services (metamcp, ai, sandbox, memory, registry, analytics)
│   │   │   ├── routers/  # tRPC routers
│   │   │   ├── middleware/
│   │   │   └── trpc/     # tRPC implementations
│   │   └── drizzle/      # Migration files
│   └── frontend/         # Next.js dashboard
│       ├── app/          # App router pages
│       ├── components/   # UI components (shadcn/ui)
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Client utilities
├── packages/
│   ├── trpc/             # Shared tRPC router definitions
│   ├── zod-types/        # Shared Zod schemas
│   ├── eslint-config/    # Shared ESLint config
│   └── typescript-config/# Shared tsconfig bases
├── submodules/           # Git submodules
│   ├── bobcoin/          # Bobcoin cryptocurrency
│   ├── cointrade/        # Cointrade trading platform
│   ├── mcp-directories/  # MCP server directories/registries
│   └── mcp-shark/        # MCP traffic inspector
├── docs/                 # Project documentation
├── VERSION               # Single source of truth for version
├── CHANGELOG.md          # Change history
├── LLM_INSTRUCTIONS.md   # THIS FILE — universal AI instructions
├── CLAUDE.md             # Claude-specific appendix
├── GEMINI.md             # Gemini-specific appendix
├── GPT.md                # GPT-specific appendix
├── AGENTS.md             # Agent operational directives
└── copilot-instructions.md # GitHub Copilot appendix
```

---

## 🚨 Coding Standards & Gotchas

- **Recursion in Proxy**: When modifying `metamcp-proxy.ts`, beware of circular dependencies in the middleware stack. Use the **Mutable Reference Pattern** (`recursiveCallToolHandlerRef`).
- **Tool Names**: Always namespaced as `serverName__toolName`.
- **Environment**: `OPENAI_API_KEY` validated at startup. `isolated-vm` requires native build tools in Docker.
- **Dark Mode**: Fully implemented via `next-themes`. `ThemeProvider` wraps the app; `ThemeToggle` is in the sidebar.
- **i18n**: Uses locale-based routing (`[locale]/`). Translation keys in `public/locales/`.

---

## 🤖 Tool Capabilities

### Code Mode (`run_code`)
- Restricted Node.js sandbox (no filesystem/network).
- Tool calling via `await mcp.call('tool_name', args)`.
- 30s timeout, 128MB memory (configurable).

### Autonomous Agent (`run_agent`)
- Full tool access via search (default) or restricted by `policyId`.
- Returns the final result of generated script execution.

### Search Tools (`search_tools`)
- Semantic + keyword search across all registered tools.
- Returns ranked results with descriptions.

### Load Tool (`load_tool`)
- Adds a tool to the current session's active set.
- Required before using any downstream tool.

---

## 🔧 Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `APP_URL` | Yes | — | Application base URL |
| `OPENAI_API_KEY` | No | — | Embeddings for semantic search + agent |
| `CODE_EXECUTION_MEMORY_LIMIT` | No | 128 | Sandbox memory (MB) |
| `MCP_TIMEOUT` | No | 60000 | MCP request timeout (ms) |
| `MCP_MAX_TOTAL_TIMEOUT` | No | 60000 | Max total timeout (ms) |
| `MCP_MAX_ATTEMPTS` | No | 1 | Retry attempts before ERROR |
| `MCP_RESET_TIMEOUT_ON_PROGRESS` | No | true | Reset timeout on progress |
| `SESSION_LIFETIME` | No | null | Session auto-cleanup time |
| `OIDC_CLIENT_ID` | No | — | OIDC provider client ID |
| `OIDC_CLIENT_SECRET` | No | — | OIDC provider secret |
| `OIDC_DISCOVERY_URL` | No | — | OIDC discovery endpoint |

---

## 📋 User Directives (Persistent)

The following directives are provided by the project owner and must always be followed:

1. **Always document** input information in detail; ask for clarification to develop a clearer description of the ultimate vision.
2. **Never compact** unique user instructions — preserve specific details when summarizing.
3. **All submodules** must be documented somewhere, added as submodules for reference, and their functionality documented in a universal reference.
4. **Changelog**: Every build must have a new version number. Update `CHANGELOG.md`.
5. **Version display**: Show version prominently in the UI. The sidebar footer displays `v{version}` from `package.json`.
6. **Git workflow**: Commit and push regularly between features. Include version in commit messages.
7. **Documentation**: Keep `VISION.md`, `ROADMAP.md`, `DASHBOARD.md`, `CHANGELOG.md` current at all times.
8. **Autonomy**: When tasked with feature implementation, proceed autonomously — commit, push, and continue to the next feature without pausing.
