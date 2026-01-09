# MetaMCP Configuration Guide

This guide covers all configuration options available in MetaMCP, including database-stored settings, environment variables, and per-endpoint authentication options.

## Table of Contents

- [Overview](#overview)
- [Database-Stored Settings](#database-stored-settings)
  - [Authentication Settings](#authentication-settings)
  - [MCP Connection Settings](#mcp-connection-settings)
  - [Session Settings](#session-settings)
- [Environment Variables](#environment-variables)
  - [Required Variables](#required-variables)
  - [Optional Variables](#optional-variables)
  - [OIDC/SSO Configuration](#oidcsso-configuration)
- [Per-Endpoint Authentication Options](#per-endpoint-authentication-options)
- [Configuration Management](#configuration-management)
  - [Via Admin UI](#via-admin-ui)
  - [Via tRPC API](#via-trpc-api)
- [Configuration Precedence](#configuration-precedence)
- [Examples](#examples)

---

## Overview

MetaMCP uses a layered configuration system:

| Layer                     | Storage             | Scope        | Runtime Modifiable        |
| ------------------------- | ------------------- | ------------ | ------------------------- |
| **Database Settings**     | `config` table      | Global       | Yes (via Admin UI or API) |
| **Environment Variables** | Process environment | Global       | No (requires restart)     |
| **Endpoint Options**      | `endpoints` table   | Per-endpoint | Yes (via Admin UI or API) |

**Key Principle**: Database settings can be changed at runtime without restarting the server. Environment variables require a server restart to take effect.

---

## Database-Stored Settings

These settings are stored in the `config` table and can be modified at runtime via the Admin UI or tRPC API.

### Authentication Settings

| Setting              | Type    | Default | Description                                                                     |
| -------------------- | ------- | ------- | ------------------------------------------------------------------------------- |
| `DISABLE_SIGNUP`     | boolean | `false` | Disable new user registration entirely                                          |
| `DISABLE_SSO_SIGNUP` | boolean | `false` | Disable automatic account creation via SSO (existing users can still SSO login) |
| `DISABLE_BASIC_AUTH` | boolean | `false` | Disable username/password authentication (forces SSO-only)                      |

#### Use Cases

**Public Instance (open registration)**:

```
DISABLE_SIGNUP = false
DISABLE_SSO_SIGNUP = false
DISABLE_BASIC_AUTH = false
```

**Enterprise (SSO-only, no self-registration)**:

```
DISABLE_SIGNUP = true
DISABLE_SSO_SIGNUP = true  # Admins must pre-create accounts
DISABLE_BASIC_AUTH = true  # Force SSO authentication
```

**Controlled Growth (SSO auto-creates accounts, no manual signup)**:

```
DISABLE_SIGNUP = true
DISABLE_SSO_SIGNUP = false  # SSO users get accounts automatically
DISABLE_BASIC_AUTH = true
```

---

### MCP Connection Settings

These settings control how MetaMCP connects to and manages MCP servers.

| Setting                         | Type         | Default | Description                                               |
| ------------------------------- | ------------ | ------- | --------------------------------------------------------- |
| `MCP_TIMEOUT`                   | integer (ms) | `60000` | Timeout for individual MCP operations                     |
| `MCP_MAX_TOTAL_TIMEOUT`         | integer (ms) | `60000` | Maximum total time for an MCP request (including retries) |
| `MCP_MAX_ATTEMPTS`              | integer      | `1`     | Number of retry attempts for failed MCP operations        |
| `MCP_RESET_TIMEOUT_ON_PROGRESS` | boolean      | `true`  | Reset timeout counter when progress is received           |

#### Timeout Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Request Lifecycle                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Request Start                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────┐    MCP_TIMEOUT     ┌─────────┐                    │
│  │ Attempt │ ──────────────────▶│ Timeout │                    │
│  │    1    │                    │  Error  │                    │
│  └────┬────┘                    └────┬────┘                    │
│       │                              │                          │
│       │ Progress received?           │                          │
│       │ (if MCP_RESET_TIMEOUT_ON_PROGRESS=true)                │
│       │ → Reset timeout counter      │                          │
│       │                              │                          │
│       ▼                              ▼                          │
│  ┌─────────┐              MCP_MAX_ATTEMPTS > 1?                │
│  │ Success │                    │                               │
│  └─────────┘                    ▼                               │
│                           ┌─────────┐                           │
│                           │ Retry   │ (until MCP_MAX_ATTEMPTS)  │
│                           └─────────┘                           │
│                                                                 │
│  Total time capped by MCP_MAX_TOTAL_TIMEOUT                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Recommended Configurations

**Fast-fail (low latency, no retries)**:

```
MCP_TIMEOUT = 30000           # 30 seconds
MCP_MAX_TOTAL_TIMEOUT = 30000 # Same as timeout (no retry budget)
MCP_MAX_ATTEMPTS = 1          # No retries
MCP_RESET_TIMEOUT_ON_PROGRESS = false
```

**Resilient (handles slow/flaky servers)**:

```
MCP_TIMEOUT = 60000           # 60 seconds per attempt
MCP_MAX_TOTAL_TIMEOUT = 180000 # 3 minutes total
MCP_MAX_ATTEMPTS = 3          # Up to 3 attempts
MCP_RESET_TIMEOUT_ON_PROGRESS = true  # Long-running tools won't timeout
```

**Long-running tools (code execution, ML inference)**:

```
MCP_TIMEOUT = 300000          # 5 minutes per attempt
MCP_MAX_TOTAL_TIMEOUT = 600000 # 10 minutes total
MCP_MAX_ATTEMPTS = 1          # No retries (expensive operations)
MCP_RESET_TIMEOUT_ON_PROGRESS = true  # Keep alive on progress
```

---

### Session Settings

| Setting            | Type                   | Default | Description                                                                       |
| ------------------ | ---------------------- | ------- | --------------------------------------------------------------------------------- |
| `SESSION_LIFETIME` | integer (ms) or `null` | `null`  | Maximum session duration. `null` = infinite (sessions never expire automatically) |

#### Session Lifecycle

Sessions are created when a client connects and are used to maintain state across requests.

```
Session States:
  ACTIVE    → Session is in use, accepting requests
  IDLE      → Session has no active requests but is still valid
  EXPIRED   → Session exceeded SESSION_LIFETIME (if set)
  CLOSED    → Client explicitly closed the session
```

**When to set SESSION_LIFETIME**:

- Multi-tenant environments where you want to reclaim resources
- Security-sensitive deployments requiring session rotation
- Resource-constrained deployments

**When to leave as `null` (infinite)**:

- Single-tenant or trusted environments
- Long-running AI agent sessions
- Development environments

---

## Environment Variables

Environment variables are read at server startup and cannot be changed at runtime.

### Required Variables

| Variable       | Description                  | Example                                         |
| -------------- | ---------------------------- | ----------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/metamcp` |

**DATABASE_URL Format**:

```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]

Examples:
# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metamcp

# With SSL (production)
DATABASE_URL=postgresql://user:pass@db.example.com:5432/metamcp?sslmode=require

# Connection pooling (Supabase, Neon, etc.)
DATABASE_URL=postgresql://user:pass@pooler.example.com:6543/metamcp?pgbouncer=true
```

---

### Optional Variables

| Variable                      | Default | Description                                                           |
| ----------------------------- | ------- | --------------------------------------------------------------------- |
| `OPENAI_API_KEY`              | -       | Required only if using built-in AI features (policy evaluation, etc.) |
| `CODE_EXECUTION_MEMORY_LIMIT` | `128`   | Memory limit in MB for sandboxed code execution                       |
| `APP_URL`                     | -       | Base URL for OAuth callbacks and generated links                      |

#### CODE_EXECUTION_MEMORY_LIMIT

Controls the memory available to the built-in code execution sandbox:

```bash
# Conservative (small scripts)
CODE_EXECUTION_MEMORY_LIMIT=64

# Default (most use cases)
CODE_EXECUTION_MEMORY_LIMIT=128

# Data processing / ML inference
CODE_EXECUTION_MEMORY_LIMIT=512

# Heavy workloads (not recommended for shared instances)
CODE_EXECUTION_MEMORY_LIMIT=1024
```

**Note**: This limit applies per execution, not globally. Higher limits allow larger data structures but increase memory pressure on the host.

---

### OIDC/SSO Configuration

To enable Single Sign-On via OpenID Connect:

| Variable             | Required | Description                                                  |
| -------------------- | -------- | ------------------------------------------------------------ |
| `OIDC_CLIENT_ID`     | Yes      | OAuth client ID from your identity provider                  |
| `OIDC_CLIENT_SECRET` | Yes      | OAuth client secret                                          |
| `OIDC_DISCOVERY_URL` | Yes      | OIDC discovery endpoint (`.well-known/openid-configuration`) |

#### Provider Examples

**Okta**:

```bash
OIDC_CLIENT_ID=0oa1234567890abcdef
OIDC_CLIENT_SECRET=your-client-secret
OIDC_DISCOVERY_URL=https://your-org.okta.com/.well-known/openid-configuration
```

**Auth0**:

```bash
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_DISCOVERY_URL=https://your-tenant.auth0.com/.well-known/openid-configuration
```

**Google Workspace**:

```bash
OIDC_CLIENT_ID=your-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=your-client-secret
OIDC_DISCOVERY_URL=https://accounts.google.com/.well-known/openid-configuration
```

**Azure AD / Entra ID**:

```bash
OIDC_CLIENT_ID=your-application-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_DISCOVERY_URL=https://login.microsoftonline.com/your-tenant-id/v2.0/.well-known/openid-configuration
```

**Keycloak**:

```bash
OIDC_CLIENT_ID=metamcp
OIDC_CLIENT_SECRET=your-client-secret
OIDC_DISCOVERY_URL=https://keycloak.example.com/realms/your-realm/.well-known/openid-configuration
```

#### Required Scopes

MetaMCP requests the following OIDC scopes:

- `openid` - Required for OIDC
- `profile` - User's name
- `email` - User's email address

#### Callback URL

Configure your identity provider with this callback URL:

```
{APP_URL}/api/auth/callback/oidc

Example: https://metamcp.example.com/api/auth/callback/oidc
```

---

## Per-Endpoint Authentication Options

Each endpoint can have its own authentication settings, stored in the `endpoints` table.

| Option                 | Type    | Default | Description                                       |
| ---------------------- | ------- | ------- | ------------------------------------------------- |
| `enable_api_key_auth`  | boolean | `true`  | Allow API key authentication for this endpoint    |
| `enable_oauth`         | boolean | `false` | Allow OAuth bearer token authentication           |
| `use_query_param_auth` | boolean | `false` | Allow API key in query parameter (`?api_key=...`) |

### Security Considerations

| Option                                      | Security    | Use Case                                  |
| ------------------------------------------- | ----------- | ----------------------------------------- |
| Header API Key (`enable_api_key_auth=true`) | Recommended | Standard API access                       |
| OAuth Bearer (`enable_oauth=true`)          | Recommended | User-context requests, SSO integration    |
| Query Param (`use_query_param_auth=true`)   | **Caution** | Legacy systems, webhooks, SSE connections |

**Query Parameter Authentication Warning**: API keys in URLs can be logged by proxies, browsers, and monitoring tools. Only enable for endpoints that require it (e.g., SSE connections where headers aren't supported by the client).

### Configuration via Admin UI

1. Navigate to **Endpoints** in the sidebar
2. Click on an endpoint to edit
3. Scroll to **Authentication Settings**
4. Toggle the desired options
5. Save changes

### Configuration via tRPC API

```typescript
// Update endpoint authentication settings
await trpc.endpoints.update.mutate({
  uuid: "endpoint-uuid",
  enable_api_key_auth: true,
  enable_oauth: true,
  use_query_param_auth: false,
});
```

---

## Configuration Management

### Via Admin UI

The Admin UI provides a **Settings** page for managing global configuration:

1. Log in as an admin user
2. Navigate to **Settings** in the sidebar
3. Modify settings as needed
4. Changes take effect immediately (no restart required)

### Via tRPC API

All configuration settings are accessible via the tRPC API:

```typescript
// Get all configurations
const configs = await trpc.config.getAllConfigs.query();

// Get specific setting
const timeout = await trpc.config.getMcpTimeout.query();

// Update setting (admin only)
await trpc.config.setMcpTimeout.mutate({ value: 120000 });

// Check auth providers
const providers = await trpc.config.getAuthProviders.query();
// Returns: { hasOidc: boolean, hasBasicAuth: boolean }
```

#### Available tRPC Config Methods

| Method                         | Type     | Description                        |
| ------------------------------ | -------- | ---------------------------------- |
| `getAllConfigs`                | Query    | Get all database-stored settings   |
| `isSignupDisabled`             | Query    | Check if signup is disabled        |
| `setSignupDisabled`            | Mutation | Enable/disable signup              |
| `isSsoSignupDisabled`          | Query    | Check if SSO signup is disabled    |
| `setSsoSignupDisabled`         | Mutation | Enable/disable SSO signup          |
| `isBasicAuthDisabled`          | Query    | Check if basic auth is disabled    |
| `setBasicAuthDisabled`         | Mutation | Enable/disable basic auth          |
| `getMcpTimeout`                | Query    | Get MCP timeout value              |
| `setMcpTimeout`                | Mutation | Set MCP timeout value              |
| `getMcpMaxTotalTimeout`        | Query    | Get max total timeout              |
| `setMcpMaxTotalTimeout`        | Mutation | Set max total timeout              |
| `getMcpMaxAttempts`            | Query    | Get max retry attempts             |
| `setMcpMaxAttempts`            | Mutation | Set max retry attempts             |
| `getMcpResetTimeoutOnProgress` | Query    | Get progress timeout reset setting |
| `setMcpResetTimeoutOnProgress` | Mutation | Set progress timeout reset setting |
| `getSessionLifetime`           | Query    | Get session lifetime               |
| `setSessionLifetime`           | Mutation | Set session lifetime               |
| `getAuthProviders`             | Query    | Get available auth providers       |

---

## Configuration Precedence

When multiple configuration sources exist, they are applied in this order (later overrides earlier):

```
1. Code Defaults (lowest priority)
   ↓
2. Environment Variables
   ↓
3. Database Settings
   ↓
4. Per-Endpoint Settings (highest priority, endpoint-specific only)
```

**Example**: If `MCP_TIMEOUT` is set to 60000 in code defaults but 120000 in the database, the database value (120000) is used.

---

## Examples

### Minimal Development Setup

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metamcp
```

Database settings use defaults. No authentication providers configured (local username/password only).

### Production with SSO

```bash
# .env
DATABASE_URL=postgresql://user:pass@db.example.com:5432/metamcp?sslmode=require
APP_URL=https://metamcp.example.com
OPENAI_API_KEY=sk-...

# SSO via Okta
OIDC_CLIENT_ID=0oa1234567890abcdef
OIDC_CLIENT_SECRET=your-secret
OIDC_DISCOVERY_URL=https://your-org.okta.com/.well-known/openid-configuration
```

Database settings (set via Admin UI after deployment):

```
DISABLE_SIGNUP = true          # No manual registration
DISABLE_SSO_SIGNUP = false     # SSO users auto-provisioned
DISABLE_BASIC_AUTH = true      # SSO only
MCP_TIMEOUT = 120000           # 2 minutes
SESSION_LIFETIME = 86400000    # 24 hours
```

### High-Availability Setup

```bash
# .env
DATABASE_URL=postgresql://user:pass@pgbouncer:6543/metamcp?pgbouncer=true
CODE_EXECUTION_MEMORY_LIMIT=256
```

Database settings:

```
MCP_TIMEOUT = 60000
MCP_MAX_TOTAL_TIMEOUT = 180000  # 3 minutes total
MCP_MAX_ATTEMPTS = 3            # Retry twice
MCP_RESET_TIMEOUT_ON_PROGRESS = true
SESSION_LIFETIME = 3600000      # 1 hour (aggressive cleanup)
```

### Air-Gapped / Offline Deployment

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metamcp
# No OPENAI_API_KEY (AI features disabled)
# No OIDC_* (no external auth)
```

Database settings:

```
DISABLE_SIGNUP = false         # Allow local registration
DISABLE_SSO_SIGNUP = true      # N/A but set defensively
DISABLE_BASIC_AUTH = false     # Username/password only option
```

---

## Related Documentation

- [REST API Reference](./REST_API.md) - API endpoints and authentication
- [LLM Instructions](../LLM_INSTRUCTIONS.md) - Architecture overview
- [Roadmap](./ROADMAP.md) - Feature status and plans
