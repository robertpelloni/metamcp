# Universal LLM Instructions for MetaMCP

This document serves as the central source of truth for all AI models (Claude, GPT, Gemini, Copilot, etc.) working on the MetaMCP repository.

**Version**: 3.5.0
**Last Updated**: 2026-01-26

---

## 🛡️ Primary Directives

### 1. Security First

- Do not modify `isolated-vm` configuration to weaken security (e.g., enabling network access directly) without explicit user authorization.
- Ensure all new tool execution paths route through the **Policy Middleware**.
- Never bypass the middleware stack for internal tool calls. Always use `delegateHandler` or `recursiveCallToolHandler`.

### 2. Versioning Mandatory (CRITICAL)

- **Rule**: Every PR that touches code MUST include a version bump in `VERSION` file, `package.json` (Apps), and a `CHANGELOG.md` entry.
- **Format**: Semantic Versioning (Major.Minor.Patch).
- **Source of Truth**: The `VERSION` file in the root directory is the single source of truth.
- **Commit Message**: Include the version number (e.g., "chore: bump version to 3.5.0").

### 3. Progressive Disclosure

- Do not expose raw downstream tools in `tools/list` by default.
- Maintain the "Search -> Load -> Use" pattern to conserve context.

---

## 🏗️ System Architecture

MetaMCP is an **Ultimate MCP Hub** that acts as a centralized gateway for downstream MCP servers.

### Core Components

| Component              | File                                                                    | Purpose                                                   |
| :--------------------- | :---------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Hub (Proxy)**        | `apps/backend/src/lib/metamcp/metamcp-proxy.ts`                         | Progressive disclosure, session management, tool proxying |
| **Code Mode**          | `apps/backend/src/lib/sandbox/code-executor.service.ts`                 | Secure sandbox via `isolated-vm`                          |
| **Semantic Search**    | `apps/backend/src/lib/ai/tool-search.service.ts`                        | Tool RAG using pgvector embeddings                        |
| **Policy Engine**      | `apps/backend/src/lib/access-control/policy.service.ts`                 | Allow/Deny patterns for tool access                       |
| **Autonomous Agent**   | `apps/backend/src/lib/ai/agent.service.ts`                              | NL task → code generation → execution                     |
| **Agent Memory**       | `apps/backend/src/lib/memory/memory.service.ts`                         | Long-term memory using pgvector                           |
| **MCP Registry**       | `apps/backend/src/lib/registry/registry.service.ts`                     | Centralized server discovery & templates                  |
| **Analytics**          | `apps/backend/src/lib/analytics/analytics.service.ts`                   | Usage tracking and dashboard metrics                      |
| **Traffic Inspection** | `apps/backend/src/lib/metamcp/metamcp-middleware/logging.functional.ts` | Mcpshark integration                                      |

### Architecture Details

1. **The Hub (Proxy)**
   - Hides downstream tools by default
   - Exposes meta-tools: `search_tools`, `load_tool`, `run_code`, `run_agent`, `save_memory`, `search_memory`
   - Session-specific `loadedTools` set with FIFO eviction (max 200)
   - Recursive routing back through middleware stack

2. **Code Mode (Sandbox)**
   - Memory limit: `CODE_EXECUTION_MEMORY_LIMIT` (default 128MB)
   - Tool chaining via `mcp.call()`
   - No network/FS access by default

3. **Semantic Search**
   - OpenAI `text-embedding-3-small`
   - pgvector for cosine similarity
   - Tools indexed on upsert with rich/concise descriptions

4. **Agent Memory**
   - Persistent storage of user/agent context
   - Semantic retrieval via `search_memory` tool
   - Automatic injection into Agent context

5. **Tool Override System**
   - Namespace-scoped tool customization via `namespace_tool_mappings` table
   - Override: name, title, description, annotations
   - Status: ACTIVE/INACTIVE per namespace

---

## 🔌 API Endpoints Reference

### Standard Endpoints

| Endpoint                 | Method | Purpose                       |
| :----------------------- | :----- | :---------------------------- |
| `/health`                | GET    | Health check                  |
| `/metamcp/:endpoint/sse` | GET    | SSE MCP transport             |
| `/metamcp/:endpoint/mcp` | POST   | Streamable HTTP MCP transport |

### REST API (Per-Endpoint)

For complete REST API documentation, see [docs/REST_API.md](docs/REST_API.md).

| Endpoint                              | Method   | Purpose                  |
| :------------------------------------ | :------- | :----------------------- |
| `/metamcp/:endpoint/api`              | GET      | Swagger UI documentation |
| `/metamcp/:endpoint/api/openapi.json` | GET      | OpenAPI 3.1.0 schema     |
| `/metamcp/:endpoint/api/:tool_name`   | GET/POST | Execute tool via REST    |

**Quick Start**:

```bash
# View Swagger UI
open http://localhost:12009/metamcp/default/api

# Execute a tool
curl -X POST http://localhost:12009/metamcp/default/api/read_file \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"path": "/tmp/example.txt"}'
```

### Authentication Options (per endpoint)

| Option                 | Default | Description            |
| :--------------------- | :------ | :--------------------- |
| `enable_api_key_auth`  | true    | API key in header      |
| `enable_oauth`         | false   | OAuth 2.0 bearer token |
| `use_query_param_auth` | false   | Allow `?api_key=xxx`   |

---

## ⚙️ Configuration Reference

> **Full Documentation**: See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for comprehensive configuration guide with examples.

### Database-Stored Settings (`config` table)

| Key                             | Default | Description                               |
| :------------------------------ | :------ | :---------------------------------------- |
| `DISABLE_SIGNUP`                | false   | Disable new user registration             |
| `DISABLE_SSO_SIGNUP`            | false   | Disable SSO/OAuth registration            |
| `DISABLE_BASIC_AUTH`            | false   | Disable email/password auth               |
| `MCP_TIMEOUT`                   | 60000   | Individual MCP request timeout (ms)       |
| `MCP_MAX_TOTAL_TIMEOUT`         | 60000   | Maximum total timeout (ms)                |
| `MCP_MAX_ATTEMPTS`              | 1       | Retry attempts before ERROR state         |
| `MCP_RESET_TIMEOUT_ON_PROGRESS` | true    | Reset timeout on progress events          |
| `SESSION_LIFETIME`              | null    | Session auto-cleanup time (null=infinite) |

### Environment Variables

| Variable                      | Default | Description                          |
| :---------------------------- | :------ | :----------------------------------- |
| `DATABASE_URL`                | -       | PostgreSQL connection string         |
| `OPENAI_API_KEY`              | -       | Required for semantic search & agent |
| `CODE_EXECUTION_MEMORY_LIMIT` | 128MB   | Sandbox memory limit                 |
| `OIDC_CLIENT_ID`              | -       | OIDC provider client ID              |
| `OIDC_CLIENT_SECRET`          | -       | OIDC provider client secret          |
| `OIDC_DISCOVERY_URL`          | -       | OIDC discovery endpoint              |

> **OIDC Provider Examples**: Okta, Auth0, Google Workspace, Azure AD, Keycloak. See [CONFIGURATION.md](docs/CONFIGURATION.md#oidcsso-configuration) for setup instructions.

---

## 🔧 Middleware Stack

> **Full Documentation**: See [docs/MIDDLEWARE.md](docs/MIDDLEWARE.md) for the complete middleware development guide.

### MCP Functional Middleware (`apps/backend/src/lib/metamcp/metamcp-middleware/`)

| Middleware                     | Purpose                                      |
| :----------------------------- | :------------------------------------------- |
| `filter-tools.functional.ts`   | Filter inactive tools from responses         |
| `logging.functional.ts`        | Log all tool calls to database               |
| `policy.functional.ts`         | Enforce allow/deny patterns                  |
| `tool-overrides.functional.ts` | Apply namespace-specific tool customizations |

### Authentication Middleware

| Middleware                   | Purpose                                         |
| :--------------------------- | :---------------------------------------------- |
| `api-key-oauth.middleware`   | Multi-method auth (API key, OAuth, query param) |
| `better-auth-mcp.middleware` | Session validation for MCP proxy                |
| `lookup-endpoint-middleware` | Endpoint resolution and namespace injection     |

---

## 🚨 Error Handling

> **Module**: `apps/backend/src/lib/errors.ts`

### Error Classes

| Error Class                | Use Case                                |
| :------------------------- | :-------------------------------------- |
| `NotFoundError`            | Entity not found (policy, tool, server) |
| `AlreadyExistsError`       | Duplicate entity creation attempt       |
| `ValidationError`          | Input validation failures               |
| `UnauthorizedError`        | Missing authentication                  |
| `ForbiddenError`           | Insufficient permissions                |
| `MCPConnectionError`       | MCP server connection failed            |
| `MCPTimeoutError`          | MCP operation timed out                 |
| `MCPServerCrashedError`    | MCP server process crashed              |
| `ToolExecutionError`       | Tool execution failed                   |
| `PolicyNotFoundError`      | Referenced policy doesn't exist         |
| `ToolBlockedByPolicyError` | Tool blocked by policy rules            |
| `DatabaseError`            | Database operation failed               |
| `ConfigError`              | Configuration validation failed         |

### Usage Pattern

```typescript
import {
  NotFoundError,
  ValidationError,
  DatabaseError,
  logError,
  wrapError,
} from "../lib/errors";

// In tRPC implementations:
try {
  const result = await db.query.policies.findFirst({
    where: eq(policies.id, id),
  });
  if (!result) throw new NotFoundError("Policy", id);
  return result;
} catch (error) {
  logError(error, "policies.get", { policyId: id });
  throw wrapError(error, "Failed to get policy");
}
```

### Utilities

| Function                              | Purpose                             |
| :------------------------------------ | :---------------------------------- |
| `wrapError(error, message)`           | Wrap unknown errors as MetaMCPError |
| `logError(error, operation, context)` | Structured error logging            |
| `isMetaMCPError(error)`               | Type guard for MetaMCPError         |
| `getErrorMessage(error)`              | Safe error message extraction       |
| `createErrorResponse(error)`          | Standard HTTP error response        |

---

## 🛠️ Development Workflow

### Build & Run

```bash
pnpm install                    # Install dependencies
docker-compose up -d db         # Start database (ensure DATABASE_URL is set)
pnpm dev                        # Start dev server (frontend:12008, backend:12009)
pnpm build                      # Production build
```

### Testing

```bash
cd apps/backend && pnpm test    # Backend unit tests (vitest)
python scripts/verify_frontend.py  # Frontend visual tests (Playwright)
```

### Database Changes

```bash
# 1. Edit schema
vim apps/backend/src/db/schema.ts

# 2. Generate migration
cd apps/backend && pnpm db:generate

# 3. Apply migration
cd apps/backend && pnpm db:migrate
```

**Caution**: Use `IF NOT EXISTS` for indexes in migrations to avoid transaction failures.

---

## 📦 Versioning & Changelog Protocol

**Every significant change MUST result in a version bump.**

### Version Bump Process

1. Update `VERSION` file in root
2. Update `version` in `apps/backend/package.json`
3. Update `version` in `apps/frontend/package.json`
4. Add entry to `CHANGELOG.md` under `## [Version] - YYYY-MM-DD`
5. Commit with message including version: `chore: bump version to X.Y.Z`

### Changelog Categories

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Fixed` - Bug fixes
- `Removed` - Removed features
- `Security` - Security fixes
- `Deprecated` - Soon-to-be removed features

---

## 📝 Documentation Requirements

### Files to Maintain

| File                  | Purpose           | Update When                  |
| :-------------------- | :---------------- | :--------------------------- |
| `VERSION`             | Version number    | Every code change            |
| `CHANGELOG.md`        | Version history   | Every version bump           |
| `docs/DASHBOARD.md`   | Project overview  | Structure/dependency changes |
| `docs/ROADMAP.md`     | Feature roadmap   | Feature additions            |
| `HANDOFF.md`          | Architecture docs | Architecture changes         |
| `LLM_INSTRUCTIONS.md` | This file         | Workflow/process changes     |
| `docs/VISION.md`      | Ultimate Goal     | Strategic direction changes  |

### Session Handoff

When ending a session or switching models, create/update a handoff document:

- Document all changes made
- List any incomplete tasks
- Note any issues discovered
- Include relevant context for continuity

---

## 🔄 Git Submodules & Dashboard

MetaMCP relies heavily on submodules. It is critical to keep them updated and documented.

### Maintenance Protocol

1. **Update**: Regularly run `git submodule update --remote --merge` to fetch latest changes.
2. **Commit**: If a submodule updates, commit the pointer change in the main repo.
3. **Dashboard**: Maintain `docs/DASHBOARD.md` with the current list of submodules, their paths, and descriptions.
4. **UI Dashboard**: Ensure the in-app "System Dashboard" (`/system`) accurately reflects the installed submodules and versions.

### Current Submodules

| Submodule       | Location                     | Purpose                                      |
| :-------------- | :--------------------------- | :------------------------------------------- |
| mcp-shark       | `apps/backend/mcp-shark`     | Traffic inspection                           |
| mcp-shark       | `submodules/mcp-shark`       | Reference copy                               |
| mcp-directories | `submodules/mcp-directories` | Aggregated MCP server registry (951 servers) |
| mcpdir          | `submodules/mcpdir`          | mcpdir.dev index (7,600+ servers)            |

---

## ⚠️ Prohibited Actions

1. **DO NOT** weaken `isolated-vm` security without explicit authorization
2. **DO NOT** bypass Policy Middleware for tool execution
3. **DO NOT** commit without version bump for code changes
4. **DO NOT** use `any` type or suppress TypeScript errors
5. **DO NOT** run `taskkill /F /IM node.exe /T` (kills all sessions)
6. **DO NOT** push directly to main without PR (if team workflow)

---

## 📚 Reference Documents

- [CLAUDE.md](CLAUDE.md) - Claude-specific instructions (references this file)
- [AGENTS.md](AGENTS.md) - Agent-specific directives (references this file)
- [GEMINI.md](GEMINI.md) - Gemini-specific instructions (references this file)
- [GPT.md](GPT.md) - GPT-specific instructions (references this file)
- [copilot-instructions.md](copilot-instructions.md) - Copilot-specific instructions (references this file)
- [HANDOFF.md](HANDOFF.md) - Architecture documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [docs/DASHBOARD.md](docs/DASHBOARD.md) - Project dashboard
- [docs/ROADMAP.md](docs/ROADMAP.md) - Feature roadmap
- [docs/DISCOVERED_FEATURES.md](docs/DISCOVERED_FEATURES.md) - Comprehensive feature audit
- [docs/REST_API.md](docs/REST_API.md) - REST API reference
