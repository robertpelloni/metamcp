# MetaMCP Middleware Development Guide

This guide covers the functional middleware framework in MetaMCP, including the core architecture, built-in middleware, and how to create custom middleware.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Types](#core-types)
  - [Middleware Composition](#middleware-composition)
  - [Execution Flow](#execution-flow)
- [Built-in Middleware](#built-in-middleware)
  - [Logging Middleware](#logging-middleware)
  - [Policy Middleware](#policy-middleware)
  - [Filter Tools Middleware](#filter-tools-middleware)
  - [Tool Overrides Middleware](#tool-overrides-middleware)
- [Creating Custom Middleware](#creating-custom-middleware)
  - [Using createFunctionalMiddleware](#using-createfunctionalmiddleware)
  - [Manual Middleware Implementation](#manual-middleware-implementation)
- [Middleware Configuration](#middleware-configuration)
- [Caching Strategies](#caching-strategies)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

MetaMCP uses a **functional middleware pattern** to intercept and transform MCP operations. This pattern allows you to:

- **Filter** which tools are visible to clients
- **Transform** tool names, descriptions, and metadata
- **Enforce** access policies before tool execution
- **Log** all tool calls with timing and results
- **Inject** custom behavior at any point in the request/response cycle

The middleware system operates on two distinct pipelines:

| Pipeline      | Purpose                                        | Middleware Type       |
| ------------- | ---------------------------------------------- | --------------------- |
| **ListTools** | Controls which tools are advertised to clients | `ListToolsMiddleware` |
| **CallTool**  | Intercepts tool execution requests             | `CallToolMiddleware`  |

---

## Architecture

### Core Types

```typescript
// Handler context passed to all middleware
interface MetaMCPHandlerContext {
  namespaceUuid: string; // The namespace being accessed
  sessionId: string; // Current session identifier
  userId?: string; // Authenticated user (if any)
}

// Base handler signatures
type ListToolsHandler = (
  request: ListToolsRequest,
  context: MetaMCPHandlerContext,
) => Promise<ListToolsResult>;

type CallToolHandler = (
  request: CallToolRequest,
  context: MetaMCPHandlerContext,
) => Promise<CallToolResult>;

// Middleware signatures (same pattern for both pipelines)
type ListToolsMiddleware = (next: ListToolsHandler) => ListToolsHandler;

type CallToolMiddleware = (next: CallToolHandler) => CallToolHandler;
```

### Middleware Composition

Middleware is composed using the `compose` function, which chains multiple middleware into a single handler:

```typescript
import { compose } from "./functional-middleware";

// Compose multiple middleware (order matters!)
const composedHandler = compose(
  loggingMiddleware, // Outermost - runs first/last
  policyMiddleware, // Runs second
  filterMiddleware, // Runs third
  overridesMiddleware, // Innermost - runs closest to handler
)(baseHandler);
```

**Composition Order**: `compose` uses `reduceRight`, meaning the **last middleware in the array wraps closest to the base handler**. The first middleware is the outermost wrapper.

```
Request Flow:
  → loggingMiddleware.before
    → policyMiddleware.before
      → filterMiddleware.before
        → overridesMiddleware.before
          → baseHandler
        ← overridesMiddleware.after
      ← filterMiddleware.after
    ← policyMiddleware.after
  ← loggingMiddleware.after
```

### Execution Flow

#### ListTools Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    ListTools Request Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client Request                                                 │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                           │
│  │ Tool Overrides  │ ← Apply override names/descriptions       │
│  │   Middleware    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │  Filter Tools   │ ← Remove inactive/disabled tools          │
│  │   Middleware    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │  Base Handler   │ → Fetch tools from MCP server             │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  Filtered & Transformed Tool List                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### CallTool Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     CallTool Request Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client Request (tool_name, arguments)                         │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                           │
│  │    Logging      │ ← Start timer, capture request            │
│  │   Middleware    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │     Policy      │ ← Check access policy (allow/deny)        │
│  │   Middleware    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │  Filter Tools   │ ← Block inactive tools, check allowlist   │
│  │   Middleware    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Tool Overrides  │ ← Map override name → original name       │
│  │   Middleware    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │  Base Handler   │ → Execute tool on MCP server              │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │    Logging      │ ← Stop timer, log result/error            │
│  │   Middleware    │                                           │
│  └─────────────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  Response to Client                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Built-in Middleware

### Logging Middleware

**File**: `logging.functional.ts`

Logs all tool calls to the database with timing, arguments, and results.

```typescript
import { createLoggingMiddleware } from "./metamcp-middleware/logging.functional";

const loggingMiddleware = createLoggingMiddleware({
  enabled: true, // Can be toggled at runtime
});
```

#### Configuration

| Option    | Type    | Default | Description            |
| --------- | ------- | ------- | ---------------------- |
| `enabled` | boolean | `true`  | Enable/disable logging |

#### Database Schema

Logs are stored in `toolCallLogsTable`:

| Column             | Type    | Description                    |
| ------------------ | ------- | ------------------------------ |
| `session_id`       | string  | Session that made the call     |
| `tool_name`        | string  | Name of the tool called        |
| `arguments`        | JSON    | Tool arguments                 |
| `result`           | JSON    | Tool response (if successful)  |
| `error`            | string  | Error message (if failed)      |
| `duration_ms`      | number  | Execution time in milliseconds |
| `parent_call_uuid` | string? | For recursive/nested calls     |

#### Recursive Call Tracking

The logging middleware supports tracking nested tool calls via `_meta.parent_call_uuid`:

```typescript
// Parent call
await callTool({
  name: "orchestrator",
  arguments: { task: "complex" },
});

// Child call (from within orchestrator)
await callTool({
  name: "helper",
  arguments: { subtask: "simple" },
  _meta: { parent_call_uuid: parentCallId },
});
```

---

### Policy Middleware

**File**: `policy.functional.ts`

Enforces access control policies before tool execution.

```typescript
import { createPolicyMiddleware } from "./metamcp-middleware/policy.functional";

const policyMiddleware = createPolicyMiddleware({
  enabled: true,
});
```

#### Configuration

| Option    | Type    | Default | Description                  |
| --------- | ------- | ------- | ---------------------------- |
| `enabled` | boolean | `true`  | Enable/disable policy checks |

#### How Policies Work

1. Client includes `_meta.policyId` in the request
2. Middleware fetches policy from `policyService.getPolicy(policyId)`
3. Calls `policyService.evaluateAccess(policy, toolName)`
4. If denied: throws `"Access denied to tool {toolName} by policy {policyId}"`
5. If allowed: proceeds to next middleware

#### Policy Bypass

If no `policyId` is provided in `_meta`, the middleware passes through without checking.

```typescript
// No policy check (passes through)
await callTool({ name: "any_tool", arguments: {} });

// With policy check
await callTool({
  name: "sensitive_tool",
  arguments: {},
  _meta: { policyId: "restricted-policy-uuid" },
});
```

---

### Filter Tools Middleware

**File**: `filter-tools.functional.ts`

Controls tool visibility and blocks access to inactive tools.

```typescript
import {
  createFilterListToolsMiddleware,
  createFilterCallToolMiddleware,
  clearFilterCache,
} from "./metamcp-middleware/filter-tools.functional";

// For ListTools pipeline
const filterListTools = createFilterListToolsMiddleware({
  cacheEnabled: true,
  cacheTTL: 60000, // 1 minute
  customErrorMessage: "Tool not available",
});

// For CallTool pipeline
const filterCallTool = createFilterCallToolMiddleware();
```

#### Configuration

| Option               | Type    | Default | Description                    |
| -------------------- | ------- | ------- | ------------------------------ |
| `cacheEnabled`       | boolean | `true`  | Cache tool status lookups      |
| `cacheTTL`           | number  | `60000` | Cache TTL in milliseconds      |
| `customErrorMessage` | string  | -       | Custom error for blocked tools |

#### ListTools Behavior

- Fetches tool status from `namespaceToolMappingsTable`
- Removes tools with `status = 'inactive'` from response
- Caches results per namespace

#### CallTool Behavior

- Blocks calls to inactive tools with error response
- Supports `_meta.allowedTools` whitelist for subagent isolation:

```typescript
// Only allow specific tools (subagent sandbox)
await callTool({
  name: "file_read",
  arguments: { path: "/tmp/data.txt" },
  _meta: {
    allowedTools: ["file_read", "file_write"], // Whitelist
  },
});
```

#### Cache Management

```typescript
// Clear cache for specific namespace
clearFilterCache("namespace-uuid");

// Clear all caches
clearFilterCache();
```

---

### Tool Overrides Middleware

**File**: `tool-overrides.functional.ts`

Transforms tool names, titles, descriptions, and annotations.

```typescript
import {
  createToolOverridesListToolsMiddleware,
  createToolOverridesCallToolMiddleware,
  clearOverrideCache,
} from "./metamcp-middleware/tool-overrides.functional";

// For ListTools pipeline
const overridesListTools = createToolOverridesListToolsMiddleware({
  cacheEnabled: true,
  cacheTTL: 60000,
  persistentCacheOnListTools: true,
});

// For CallTool pipeline
const overridesCallTool = createToolOverridesCallToolMiddleware();
```

#### Configuration

| Option                       | Type    | Default | Description                          |
| ---------------------------- | ------- | ------- | ------------------------------------ |
| `cacheEnabled`               | boolean | `true`  | Cache override lookups               |
| `cacheTTL`                   | number  | `60000` | Cache TTL in milliseconds            |
| `persistentCacheOnListTools` | boolean | `false` | Persist cache across ListTools calls |

#### Override Fields

Stored in `namespaceToolMappingsTable`:

| Field                  | Description                      |
| ---------------------- | -------------------------------- |
| `override_name`        | Replace the tool's name          |
| `override_title`       | Replace the tool's display title |
| `override_description` | Replace the tool's description   |
| `override_annotations` | Merge/replace tool annotations   |

#### ListTools Behavior

Transforms the tool list response:

```typescript
// Original tool from MCP server
{ name: 'read_file', description: 'Reads a file from disk' }

// After override middleware (if override_name='safe_read', override_description='...')
{ name: 'safe_read', description: 'Safely reads allowed files only' }
```

#### CallTool Behavior

Maps override names back to original names:

```typescript
// Client calls with override name
await callTool({ name: "safe_read", arguments: { path: "/tmp/x" } });

// Middleware maps to original name before execution
// → Actually calls 'read_file' on the MCP server
```

#### Cache Management

```typescript
// Clear all override caches
clearOverrideCache();
```

---

## Creating Custom Middleware

### Using createFunctionalMiddleware

The easiest way to create middleware is using the `createFunctionalMiddleware` factory:

```typescript
import { createFunctionalMiddleware } from "./functional-middleware";

// Request/response transformation middleware
const myMiddleware = createFunctionalMiddleware({
  // Transform request before passing to next handler
  transformRequest: async (request, context) => {
    console.log(`Processing request for namespace: ${context.namespaceUuid}`);
    return {
      ...request,
      arguments: {
        ...request.arguments,
        injectedParam: "value",
      },
    };
  },

  // Transform response before returning to caller
  transformResponse: async (response, request, context) => {
    return {
      ...response,
      _meta: {
        ...response._meta,
        processedAt: new Date().toISOString(),
      },
    };
  },
});
```

#### Factory Options

| Option              | Type                                                | Description                     |
| ------------------- | --------------------------------------------------- | ------------------------------- |
| `transformRequest`  | `(request, context) => Promise<request>`            | Modify request before execution |
| `transformResponse` | `(response, request, context) => Promise<response>` | Modify response after execution |

Both transforms are optional. If omitted, the request/response passes through unchanged.

### Manual Middleware Implementation

For full control, implement the middleware signature directly:

```typescript
import type {
  CallToolMiddleware,
  CallToolHandler,
  MetaMCPHandlerContext,
} from "./functional-middleware";

const rateLimitMiddleware: CallToolMiddleware = (next: CallToolHandler) => {
  const requestCounts = new Map<string, number>();

  return async (request, context) => {
    const key = `${context.userId}:${context.namespaceUuid}`;
    const count = requestCounts.get(key) || 0;

    if (count >= 100) {
      return {
        content: [{ type: "text", text: "Rate limit exceeded" }],
        isError: true,
      };
    }

    requestCounts.set(key, count + 1);

    // Reset count after 1 minute
    setTimeout(() => requestCounts.delete(key), 60000);

    return next(request, context);
  };
};
```

---

## Middleware Configuration

### Enabling/Disabling at Runtime

Most built-in middleware accepts an `enabled` flag:

```typescript
const loggingMiddleware = createLoggingMiddleware({
  enabled: process.env.ENABLE_LOGGING === "true",
});
```

### Environment-Based Configuration

```typescript
const filterMiddleware = createFilterListToolsMiddleware({
  cacheEnabled: process.env.NODE_ENV === "production",
  cacheTTL: parseInt(process.env.FILTER_CACHE_TTL || "60000"),
});
```

### Per-Request Configuration

Use `_meta` to pass per-request configuration:

```typescript
await callTool({
  name: "tool",
  arguments: {},
  _meta: {
    policyId: "strict-policy", // For policy middleware
    allowedTools: ["tool1", "tool2"], // For filter middleware
    parent_call_uuid: "parent-id", // For logging middleware
  },
});
```

---

## Caching Strategies

### Built-in Cache Implementation

The middleware uses a `ToolStatusCache` / `ToolOverridesCache` pattern:

```typescript
class ToolStatusCache {
  private cache: Map<string, { data: ToolStatus[]; timestamp: number }>;
  private ttl: number;

  constructor(ttlMs: number = 60000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  get(namespaceUuid: string): ToolStatus[] | null {
    const entry = this.cache.get(namespaceUuid);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(namespaceUuid);
      return null;
    }
    return entry.data;
  }

  set(namespaceUuid: string, data: ToolStatus[]): void {
    this.cache.set(namespaceUuid, { data, timestamp: Date.now() });
  }

  clear(namespaceUuid?: string): void {
    if (namespaceUuid) {
      this.cache.delete(namespaceUuid);
    } else {
      this.cache.clear();
    }
  }
}
```

### Cache Invalidation

Clear caches when tool configurations change:

```typescript
// After updating tool status
await updateToolStatus(namespaceUuid, toolName, "inactive");
clearFilterCache(namespaceUuid);

// After updating tool overrides
await updateToolOverrides(namespaceUuid, toolName, {
  override_name: "new_name",
});
clearOverrideCache();
```

### Cache TTL Recommendations

| Environment | Filter Cache TTL | Override Cache TTL |
| ----------- | ---------------- | ------------------ |
| Development | 5000 (5s)        | 5000 (5s)          |
| Staging     | 30000 (30s)      | 30000 (30s)        |
| Production  | 60000 (1min)     | 60000 (1min)       |

---

## Best Practices

### 1. Order Middleware Correctly

```typescript
// Recommended order
const composedHandler = compose(
  loggingMiddleware, // 1. Log everything (outermost)
  policyMiddleware, // 2. Enforce access control early
  filterMiddleware, // 3. Filter before transformation
  overridesMiddleware, // 4. Transform names last (innermost)
)(baseHandler);
```

### 2. Handle Errors Gracefully

```typescript
const safeMiddleware: CallToolMiddleware =
  (next) => async (request, context) => {
    try {
      return await next(request, context);
    } catch (error) {
      // Log error but don't crash
      console.error("Middleware error:", error);

      // Return error response instead of throwing
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  };
```

### 3. Use Async/Await Consistently

```typescript
// Good - consistent async handling
const asyncMiddleware: CallToolMiddleware =
  (next) => async (request, context) => {
    await doSomethingAsync();
    const result = await next(request, context);
    await doSomethingElseAsync();
    return result;
  };

// Bad - mixing promises and callbacks
const badMiddleware: CallToolMiddleware = (next) => (request, context) => {
  doSomething().then(() => {
    // This won't work correctly
  });
  return next(request, context);
};
```

### 4. Minimize Database Calls

```typescript
// Good - batch database operations
const batchMiddleware = createFilterListToolsMiddleware({
  cacheEnabled: true,
  cacheTTL: 60000,
});

// Bad - query database on every request
const inefficientMiddleware: CallToolMiddleware =
  (next) => async (request, context) => {
    const status = await db.query("SELECT status FROM tools WHERE name = ?", [
      request.name,
    ]);
    // This runs on EVERY request
    return next(request, context);
  };
```

### 5. Keep Middleware Focused

Each middleware should do one thing well:

```typescript
// Good - single responsibility
const loggingMiddleware = createLoggingMiddleware({ enabled: true });
const policyMiddleware = createPolicyMiddleware({ enabled: true });

// Bad - middleware doing too much
const everythingMiddleware: CallToolMiddleware = (next) => async (req, ctx) => {
  // Logging + policy + filtering + overrides all in one
  // Hard to test, maintain, and configure
};
```

---

## Examples

### Example 1: Request Validation Middleware

```typescript
import { createFunctionalMiddleware } from "./functional-middleware";
import { z } from "zod";

const toolSchemas: Record<string, z.ZodSchema> = {
  file_read: z.object({
    path: z.string().regex(/^\/allowed\//),
  }),
  http_request: z.object({
    url: z.string().url(),
    method: z.enum(["GET", "POST"]),
  }),
};

const validationMiddleware = createFunctionalMiddleware({
  transformRequest: async (request, context) => {
    const schema = toolSchemas[request.name];
    if (schema) {
      const result = schema.safeParse(request.arguments);
      if (!result.success) {
        throw new Error(`Invalid arguments: ${result.error.message}`);
      }
    }
    return request;
  },
});
```

### Example 2: Audit Trail Middleware

```typescript
import type { CallToolMiddleware } from "./functional-middleware";

const auditMiddleware: CallToolMiddleware =
  (next) => async (request, context) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: context.userId,
      namespace: context.namespaceUuid,
      tool: request.name,
      arguments: request.arguments,
    };

    // Log to external audit system
    await fetch("https://audit.example.com/log", {
      method: "POST",
      body: JSON.stringify(auditEntry),
    });

    return next(request, context);
  };
```

### Example 3: Response Sanitization Middleware

```typescript
const sanitizeMiddleware = createFunctionalMiddleware({
  transformResponse: async (response, request, context) => {
    // Remove sensitive data from responses
    const sanitizedContent = response.content.map((item) => {
      if (item.type === "text") {
        return {
          ...item,
          text: item.text
            .replace(/api_key=\w+/gi, "api_key=***")
            .replace(/password=\w+/gi, "password=***"),
        };
      }
      return item;
    });

    return { ...response, content: sanitizedContent };
  },
});
```

### Example 4: Timeout Middleware

```typescript
const timeoutMiddleware =
  (timeoutMs: number): CallToolMiddleware =>
  (next) =>
  async (request, context) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await Promise.race([
        next(request, context),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
          });
        }),
      ]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  };

// Usage
const handler = compose(
  timeoutMiddleware(30000), // 30 second timeout
  loggingMiddleware,
)(baseHandler);
```

### Example 5: Feature Flag Middleware

```typescript
const featureFlagMiddleware =
  (disabledTools: Set<string>): CallToolMiddleware =>
  (next) =>
  async (request, context) => {
    if (disabledTools.has(request.name)) {
      return {
        content: [
          {
            type: "text",
            text: `Tool '${request.name}' is currently disabled for maintenance`,
          },
        ],
        isError: true,
      };
    }
    return next(request, context);
  };

// Usage
const disabledTools = new Set(["dangerous_tool", "deprecated_tool"]);
const handler = compose(
  featureFlagMiddleware(disabledTools),
  loggingMiddleware,
)(baseHandler);
```

---

## Related Documentation

- [Configuration Guide](./CONFIGURATION.md) - System configuration options
- [REST API Reference](./REST_API.md) - API endpoints
- [LLM Instructions](../LLM_INSTRUCTIONS.md) - Architecture overview
