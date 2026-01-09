# MetaMCP REST API Reference

> **Version**: 3.2.5  
> **Last Updated**: 2026-01-09

MetaMCP provides a comprehensive REST API for tool execution, alongside the standard MCP protocol transports. This enables integration with any HTTP client, not just MCP-compatible clients.

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [OpenAPI / Swagger UI](#openapi--swagger-ui)
5. [Tool Execution Endpoints](#tool-execution-endpoints)
6. [MCP Transport Endpoints](#mcp-transport-endpoints)
7. [Health & Monitoring](#health--monitoring)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

---

## Overview

MetaMCP exposes three transport mechanisms:

| Transport           | Path Pattern               | Use Case                              |
| ------------------- | -------------------------- | ------------------------------------- |
| **OpenAPI/REST**    | `/metamcp/:endpoint/api/*` | Direct HTTP tool execution            |
| **SSE**             | `/metamcp/:endpoint/sse`   | Server-Sent Events for streaming      |
| **Streamable HTTP** | `/metamcp/:endpoint/mcp`   | MCP over HTTP with session management |

All endpoints are namespace-scoped via the `:endpoint` parameter (namespace name or UUID).

---

## Base URL

```
http://localhost:12009/metamcp
```

Production deployments should use HTTPS and the configured domain.

---

## Authentication

MetaMCP supports multiple authentication methods, configured via environment variables.

### API Key Authentication

When `API_KEY_AUTH_ENABLED=true`:

```bash
# Via header (recommended)
curl -H "X-API-Key: your-api-key" http://localhost:12009/metamcp/...

# Via query parameter
curl "http://localhost:12009/metamcp/...?apiKey=your-api-key"
```

API keys are managed in the MetaMCP dashboard under **Settings > API Keys**.

### OAuth 2.0 / Bearer Token

When `OIDC_ISSUER` is configured:

```bash
curl -H "Authorization: Bearer your-oauth-token" http://localhost:12009/metamcp/...
```

### Authentication Modes

| `API_KEY_AUTH_ENABLED` | `OIDC_ISSUER` | Behavior                              |
| ---------------------- | ------------- | ------------------------------------- |
| `false`                | Not set       | No authentication required            |
| `true`                 | Not set       | API key required                      |
| `true`                 | Set           | Try OAuth first, fall back to API key |
| `false`                | Set           | OAuth required                        |

### Rate Limiting

Failed authentication attempts are rate-limited. After multiple failures, requests are temporarily blocked with HTTP 429.

---

## OpenAPI / Swagger UI

Each namespace exposes an auto-generated OpenAPI 3.1.0 schema and interactive Swagger UI.

### Swagger UI

```
GET /metamcp/:endpoint/api
```

Opens an interactive Swagger UI for exploring and testing tools in the namespace.

**Example**: `http://localhost:12009/metamcp/default/api`

### OpenAPI Schema

```
GET /metamcp/:endpoint/api/openapi.json
```

Returns the OpenAPI 3.1.0 specification for all active tools in the namespace.

**Response Structure**:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "MetaMCP Tools API - {namespace_name}",
    "version": "1.0.0",
    "description": "Auto-generated API for MCP tools"
  },
  "servers": [{ "url": "/metamcp/{endpoint}/api" }],
  "paths": {
    "/{tool_name}": {
      "post": {
        "summary": "Tool description",
        "operationId": "tool_name",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                /* JSON Schema from MCP tool */
              }
            }
          }
        },
        "responses": {
          /* ... */
        }
      }
    }
  }
}
```

**Notes**:

- Tools with required parameters use `POST`
- Tools without required parameters also expose `GET`
- Schema is generated from MCP tool definitions

---

## Tool Execution Endpoints

### Execute Tool (POST)

```
POST /metamcp/:endpoint/api/:tool_name
Content-Type: application/json

{
  "param1": "value1",
  "param2": "value2"
}
```

**Parameters**:

- `:endpoint` - Namespace name or UUID
- `:tool_name` - Tool name (without namespace prefix)

**Response** (Success):

```json
{
  "content": [
    {
      "type": "text",
      "text": "Tool output here"
    }
  ],
  "isError": false
}
```

**Response** (Error):

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message"
    }
  ],
  "isError": true
}
```

### Execute Tool (GET)

```
GET /metamcp/:endpoint/api/:tool_name
```

For tools without required parameters. Query parameters are passed as tool arguments.

**Example**:

```bash
curl "http://localhost:12009/metamcp/default/api/list_files?path=/tmp"
```

### Tool Resolution

Tools are resolved in this order:

1. Check if tool is active in namespace (`namespace_tool_mappings.status = 'ACTIVE'`)
2. Look up tool by name (supports `serverName__toolName` format)
3. Apply any tool overrides (custom name, description, annotations)

---

## MCP Transport Endpoints

### Server-Sent Events (SSE)

Establish a persistent SSE connection for streaming responses.

#### Connect

```
GET /metamcp/:endpoint/sse
Accept: text/event-stream
```

Returns a session ID in the `endpoint` event.

#### Send Message

```
POST /metamcp/:endpoint/message
Content-Type: application/json
X-Session-Id: {session_id}

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {}
  }
}
```

### Streamable HTTP

Modern MCP transport with full session management.

#### Initialize/Send Message

```
POST /metamcp/:endpoint/mcp
Content-Type: application/json
mcp-session-id: {optional_session_id}

{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": { /* ... */ }
}
```

#### Get Session State

```
GET /metamcp/:endpoint/mcp
mcp-session-id: {session_id}
```

#### Close Session

```
DELETE /metamcp/:endpoint/mcp
mcp-session-id: {session_id}
```

---

## Health & Monitoring

### Server Health

```
GET /health
```

Returns server status. Used for load balancer health checks.

### Session Health

```
GET /health/sessions
```

Returns active session counts and health metrics.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning                                           |
| ---- | ------------------------------------------------- |
| 200  | Success                                           |
| 400  | Bad Request - Invalid parameters                  |
| 401  | Unauthorized - Missing/invalid authentication     |
| 403  | Forbidden - Tool inactive or policy denied        |
| 404  | Not Found - Unknown endpoint or tool              |
| 422  | Validation Error - Request body validation failed |
| 429  | Too Many Requests - Rate limited                  |
| 500  | Internal Server Error                             |

### Validation Error Response

```json
{
  "detail": [
    {
      "loc": ["body", "param_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Tool Not Found

```json
{
  "error": "Unknown tool: tool_name"
}
```

### Tool Inactive

```json
{
  "error": "Tool 'tool_name' is not active in this namespace"
}
```

---

## Examples

### cURL

```bash
# List tools via OpenAPI schema
curl http://localhost:12009/metamcp/default/api/openapi.json

# Execute a tool
curl -X POST http://localhost:12009/metamcp/default/api/read_file \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"path": "/tmp/example.txt"}'
```

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:12009/metamcp/default/api"
HEADERS = {"X-API-Key": "your-api-key"}

# Execute tool
response = requests.post(
    f"{BASE_URL}/read_file",
    headers=HEADERS,
    json={"path": "/tmp/example.txt"}
)
result = response.json()
print(result["content"][0]["text"])
```

### JavaScript (fetch)

```javascript
const BASE_URL = "http://localhost:12009/metamcp/default/api";
const API_KEY = "your-api-key";

async function executeTool(toolName, params) {
  const response = await fetch(`${BASE_URL}/${toolName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

// Usage
const result = await executeTool("read_file", { path: "/tmp/example.txt" });
console.log(result.content[0].text);
```

### HTTPie

```bash
# Execute tool
http POST localhost:12009/metamcp/default/api/read_file \
  X-API-Key:your-api-key \
  path=/tmp/example.txt
```

---

## Session Management

### Session Lifecycle

1. **Creation**: Sessions are created on first request (SSE connect or HTTP POST)
2. **Session ID**: Returned in headers or SSE events
3. **Persistence**: Sessions persist for the configured timeout (default: 30 minutes)
4. **Cleanup**: Automatic cleanup on timeout or explicit DELETE

### Session ID Format

- OpenAPI: `openapi_{namespace_uuid}`
- SSE: `sse_{random_id}`
- Streamable HTTP: `mcp-session-id` header value

---

## Policy Integration

All tool executions pass through the policy engine. Policies can:

- Allow/deny specific tools
- Apply per-request restrictions via `policyId` header
- Log all tool calls for audit

See [LLM_INSTRUCTIONS.md](../LLM_INSTRUCTIONS.md#policy-engine) for policy configuration.

---

## See Also

- [LLM_INSTRUCTIONS.md](../LLM_INSTRUCTIONS.md) - Universal configuration reference
- [DISCOVERED_FEATURES.md](DISCOVERED_FEATURES.md) - Undocumented features audit
- [ROADMAP.md](ROADMAP.md) - Feature roadmap
