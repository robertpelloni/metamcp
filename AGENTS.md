# Agent Operational Directives

This file contains high-level directives for Autonomous Agents operating within or on this repository.

## 🛡️ Primary Directives

1.  **Security First**:
    *   Do not modify `isolated-vm` configuration to weaken security (e.g., enabling network access directly) without explicit user authorization.
    *   Ensure all new tool execution paths route through the **Policy Middleware**.

2.  **Versioning Mandatory**:
    *   **Rule**: Every PR that touches code MUST include a version bump in `package.json` (Root + Apps) and a `CHANGELOG.md` entry.
    *   **Format**: Semantic Versioning (Major.Minor.Patch).

3.  **Progressive Disclosure**:
    *   Do not expose raw downstream tools in `tools/list` by default.
    *   Maintain the "Search -> Load -> Use" pattern to conserve context.

## 🤖 capabilities & Constraints

### Code Mode (`run_code`)
*   **Environment**: Restricted Node.js environment.
*   **Access**: No direct filesystem/network access.
*   **Tool Calling**: Must use `await mcp.call('tool_name', args)`.
*   **Limit**: Execution time defaults to 30s. Memory defaults to 128MB (configurable).

### Autonomous Agent (`run_agent`)
*   **Scope**: By default, has access to all tools via Search.
*   **Restriction**: Can be restricted by passing `policyId`.
*   **Output**: Returns the final result of the generated script.

## 📝 Documentation Maintenance

*   If you change the architecture, update `HANDOFF.md` and `CLAUDE.md`.
*   If you add a new "Meta Tool", document it in `README.md` and `docs/guides/`.

## 🧪 Verification Protocol

1.  **Backend Logic**: Write/Run Vitest tests (`apps/backend/src/**/*.test.ts`).
2.  **Frontend UI**: Use Playwright to verify visual changes (`frontend_verification_instructions`).
3.  **Integration**: Verify the full loop (Agent -> Proxy -> Sandbox -> Tool -> DB Log).
