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

### Code Mode (`run_code` & `run_python`)
*   **JS**: Restricted Node.js (`isolated-vm`). Use `await mcp.call()`.
*   **Python**: Restricted Python (`execa`). Use `mcp.call()`. The environment is transient.
*   **Persistence**: Use `save_script` for reusable logic.

### Autonomous Agent (`run_agent`)
*   **Scope**: By default, has access to all tools via Search.
*   **Restriction**: Can be restricted by passing `policyId`.
*   **Output**: Returns the final result of the generated script.
*   **Context**: Will automatically receive relevant memories.

### Operational
*   **Notifications**: Use `notify_user` to alert humans.
*   **Inspection**: Logs are streamed to `tool_call_logs` and visible in "Live Logs".

## 📝 Documentation Maintenance

*   If you change the architecture, update `HANDOFF.md` and `CLAUDE.md`.
*   If you add a new "Meta Tool", document it in `README.md` and `docs/guides/`.

## 🧪 Verification Protocol

1.  **Backend Logic**: Write/Run Vitest tests (`apps/backend/src/**/*.test.ts`).
2.  **Frontend UI**: Use Playwright to verify visual changes (`frontend_verification_instructions`).
3.  **Integration**: Verify the full loop (Agent -> Proxy -> Sandbox -> Tool -> DB Log).
