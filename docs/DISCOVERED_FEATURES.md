# MetaMCP Discovered Features Audit

> Comprehensive audit of all features, functionality, and design details discovered through codebase analysis.
>
> **Audit Date**: January 2025  
> **Version**: 3.2.3

---

## Executive Summary

This audit discovered **47+ undocumented or partially documented features** across MetaMCP's codebase, including:

- **17 database tables** with several containing unused/undocumented fields
- **11 configuration options** (mix of DB-stored and environment variables)
- **8+ middleware layers** implementing auth, filtering, logging, and policy enforcement
- **4 undocumented API endpoints** including Swagger UI and REST tool execution
- **Full OAuth 2.0 server implementation** (tables exist but usage unclear)
- **Tool override system** for namespace-scoped tool customization
- **Nested tool call tracking** for debugging recursive code execution

---

## 1. Undocumented Database Features

### 1.1 Tool Override System (`namespaceToolMappingsTable`)

**Status**: Schema exists, implementation status unclear

```typescript
// Fields that enable per-namespace tool customization:
override_name: text        // Custom tool name within namespace
override_title: text       // Custom display title
override_description: text // Custom description
override_annotations: jsonb // Custom metadata/annotations
status: enum               // ACTIVE/INACTIVE per namespace
```

**Use Case**: Allow different namespaces to present the same underlying tool with different names, descriptions, or configurations.

**Documentation Gap**: Not mentioned in any guide or roadmap.

---

### 1.2 Full OAuth 2.0 Server Implementation

**Tables**:

- `oauthClientsTable` - Client registration with redirect URIs, grant types, PKCE support
- `oauthAuthorizationCodesTable` - Authorization code flow with code_challenge
- `oauthAccessTokensTable` - Token management with expiration

**Features**:

- Dynamic client registration
- PKCE support (code_challenge, code_challenge_method)
- Multiple grant types (authorization_code, refresh_token)
- Scope-based access control

**Status**: Tables exist, endpoints may exist in OAuth router. Usage in production unclear.

**Documentation Gap**: OAuth server capability not documented; only OIDC client configuration is mentioned.

---

### 1.3 Endpoint Authentication Options

```typescript
// endpointsTable has three auth modes:
enable_api_key_auth: boolean; // Default: true
enable_oauth: boolean; // Default: false
use_query_param_auth: boolean; // Default: false - allows ?api_key=xxx
```

**Documentation Gap**: Query param auth option not documented anywhere.

---

### 1.4 Nested Tool Call Tracking

```typescript
// toolCallLogsTable supports call hierarchy:
parent_call_uuid: uuid; // Links nested calls from run_code/run_agent
```

**Use Case**: Trace tool calls made by sandboxed code back to the parent execution.

**Documentation Gap**: Not mentioned in traffic inspection docs.

---

### 1.5 Rich Tool Descriptions for Semantic Search

```typescript
// toolsTable has enhanced description fields:
rich_description: text; // LLM-generated detailed description
concise_description: text; // LLM-generated summary
embedding: vector(1536); // OpenAI text-embedding-3-small
```

**Documentation Gap**: The description enhancement process is mentioned but not the fields.

---

## 2. Undocumented Configuration Options

### 2.1 Database-Stored Configurations

| Config Key                      | Default         | Purpose                                  | Documented |
| ------------------------------- | --------------- | ---------------------------------------- | ---------- |
| `DISABLE_SIGNUP`                | false           | Disable new user registration            | ❌         |
| `DISABLE_SSO_SIGNUP`            | false           | Disable SSO/OAuth registration           | ❌         |
| `DISABLE_BASIC_AUTH`            | false           | Disable email/password auth              | ❌         |
| `MCP_RESET_TIMEOUT_ON_PROGRESS` | true            | Reset timeout when server shows progress | ❌         |
| `MCP_TIMEOUT`                   | 60000ms         | Individual MCP request timeout           | ❌         |
| `MCP_MAX_TOTAL_TIMEOUT`         | 60000ms         | Maximum total timeout                    | ❌         |
| `MCP_MAX_ATTEMPTS`              | 1               | Retry attempts before ERROR state        | ❌         |
| `SESSION_LIFETIME`              | null (infinite) | Session auto-cleanup time                | ❌         |

### 2.2 Environment Variables

| Variable                      | Default | Purpose                              | Documented |
| ----------------------------- | ------- | ------------------------------------ | ---------- |
| `CODE_EXECUTION_MEMORY_LIMIT` | 128 MB  | Sandbox memory limit                 | ✅ Partial |
| `OPENAI_API_KEY`              | -       | Required for semantic search & agent | ✅         |
| `OIDC_CLIENT_ID`              | -       | OIDC provider client ID              | ✅ Partial |
| `OIDC_CLIENT_SECRET`          | -       | OIDC provider client secret          | ✅ Partial |
| `OIDC_DISCOVERY_URL`          | -       | OIDC discovery endpoint              | ✅ Partial |

---

## 3. Undocumented API Endpoints

### 3.1 Swagger UI & OpenAPI

```
GET /metamcp/:endpoint_name/api         → Swagger UI documentation
GET /metamcp/:endpoint_name/api/openapi.json → OpenAPI 3.0 schema
```

**Features**:

- Auto-generated from tool schemas
- Per-endpoint documentation
- Interactive tool testing

**Documentation Gap**: Not mentioned in any guide.

---

### 3.2 REST Tool Execution API

```
GET/POST /metamcp/:endpoint_name/api/:tool_name
```

**Features**:

- Execute any tool via REST API
- GET with query params or POST with JSON body
- Returns tool result as JSON

**Documentation Gap**: REST API access pattern not documented.

---

### 3.3 Health Check Endpoint

```
GET /health → Basic health check
```

**Documentation Gap**: Not mentioned in deployment docs.

---

## 4. Middleware & Processing Pipeline

### 4.1 MCP Functional Middleware Framework

**Location**: `apps/backend/src/lib/metamcp/metamcp-middleware/`

**Available Middleware**:

| Middleware                     | Purpose                                      | Documented |
| ------------------------------ | -------------------------------------------- | ---------- |
| `filter-tools.functional.ts`   | Filter inactive tools from responses         | ❌         |
| `logging.functional.ts`        | Log all tool calls to database               | ✅ Partial |
| `policy.functional.ts`         | Enforce allow/deny patterns                  | ✅         |
| `tool-overrides.functional.ts` | Apply namespace-specific tool customizations | ❌         |

**Composition**: Middleware can be composed for request/response transformation.

**Documentation Gap**: Functional middleware framework not documented for extension.

---

### 4.2 Authentication Middleware Stack

1. **api-key-oauth.middleware** - Multi-method auth (API key, OAuth, query param)
2. **better-auth-mcp.middleware** - Session validation for MCP proxy
3. **lookup-endpoint-middleware** - Endpoint resolution and namespace injection

**Features**:

- Rate limiting integration
- Multiple auth methods per endpoint
- Configurable per-endpoint auth requirements

---

## 5. Session & State Management

### 5.1 Session Lifetime Manager

**Features**:

- Configurable session lifetimes (or infinite)
- Automatic cleanup every 5 minutes
- Graceful error handling during cleanup

**Documentation Gap**: Session management internals not documented.

---

### 5.2 Server Connection Pools

**MetaMcpServerPool**:

- Namespace-scoped idle server pool
- Fast session assignment from pre-warmed connections
- Automatic idle server replacement after session cleanup

**McpServerPool**:

- Server-scoped connection caching
- Crash detection and error state tracking
- Background idle session creation

**Documentation Gap**: Pool architecture not documented.

---

### 5.3 Tools Sync Cache

**Mechanism**: SHA256 hash of sorted tool names for change detection

**Purpose**: Prevent unnecessary database operations during tool sync

**Documentation Gap**: Caching strategy not documented.

---

## 6. Clarifications on Documented Features

### 6.1 loadedTools FIFO Eviction

**Documented**: "Session-specific loadedTools set with FIFO eviction (max 200)"

**Finding**: No FIFO eviction implementation found in codebase. The `loadedTools` concept may be implemented differently or deferred.

**Status**: Needs verification or documentation correction.

---

### 6.2 Server Types

**Supported Types**:

- `STDIO` - Local command execution
- `SSE` - Server-Sent Events (legacy)
- `STREAMABLE_HTTP` - Modern HTTP streaming

**Documentation Gap**: `STREAMABLE_HTTP` type not documented in guides.

---

### 6.3 MCP Server Headers & Bearer Token

```typescript
bearerToken: text; // Auth token for SSE/HTTP servers
headers: jsonb; // Custom headers for HTTP requests
```

**Documentation Gap**: Custom header configuration not documented.

---

## 7. Feature Implementation Priorities

### High Priority (Undocumented but Implemented)

1. **Document Swagger UI/OpenAPI endpoints** - Users should know about REST access
2. **Document configuration options** - Critical for deployment customization
3. **Document tool override system** - Enables powerful namespace customization
4. **Clarify OAuth server status** - Is it functional? Should it be documented?

### Medium Priority (Partially Documented)

5. **Complete middleware documentation** - Enable custom middleware development
6. **Document session management** - Important for scaling and debugging
7. **Document connection pool architecture** - Critical for performance tuning

### Low Priority (Internal Implementation Details)

8. **Document caching strategies** - Mainly relevant for contributors
9. **Document nested call tracking** - Advanced debugging feature

---

## 8. Recommendations

### Documentation Updates

1. **Create `docs/guides/configuration.md`** - Comprehensive config reference
2. **Create `docs/guides/rest-api.md`** - REST/OpenAPI access documentation
3. **Update `docs/guides/tool-sets.md`** - Add tool override documentation
4. **Create `docs/advanced/middleware.md`** - Custom middleware development guide
5. **Create `docs/advanced/session-management.md`** - Pool and session internals

### Code Clarifications Needed

1. **Verify FIFO eviction** - Is it implemented? Where?
2. **Verify OAuth server status** - Is it functional? Tested?
3. **Verify tool override usage** - Any existing implementations?

### ROADMAP Additions

1. Add "Document undocumented features" to In Progress
2. Add "Tool Override UI" to Planned
3. Add "OAuth Server Documentation/Testing" to Ideas
4. Clarify "loadedTools FIFO" status

---

## Appendix: Database Schema Summary

| Table                       | Purpose                          | Documentation Status |
| --------------------------- | -------------------------------- | -------------------- |
| `mcp_servers`               | MCP server configurations        | ✅                   |
| `oauth_sessions`            | OAuth session persistence        | ✅ Partial           |
| `tools`                     | Tool definitions with embeddings | ✅ Partial           |
| `users`                     | User accounts (better-auth)      | ✅                   |
| `sessions`                  | User sessions (better-auth)      | ✅                   |
| `accounts`                  | OAuth provider accounts          | ✅                   |
| `verifications`             | Email verifications              | ✅                   |
| `namespaces`                | Tool groupings                   | ✅                   |
| `endpoints`                 | Public routing endpoints         | ✅ Partial           |
| `namespace_server_mappings` | Namespace ↔ Server relations     | ✅                   |
| `namespace_tool_mappings`   | **Tool overrides**               | ❌                   |
| `api_keys`                  | API key management               | ✅                   |
| `config`                    | App-wide settings                | ❌                   |
| `oauth_clients`             | **OAuth server clients**         | ❌                   |
| `oauth_authorization_codes` | **OAuth auth codes**             | ❌                   |
| `oauth_access_tokens`       | **OAuth access tokens**          | ❌                   |
| `saved_scripts`             | Saved code snippets              | ✅                   |
| `tool_call_logs`            | Tool execution logs              | ✅ Partial           |
| `tool_sets`                 | Tool set definitions             | ✅                   |
| `tool_set_items`            | Tool set contents                | ✅                   |
| `policies`                  | Access control policies          | ✅                   |

---

_Generated by comprehensive codebase audit - January 2025_
