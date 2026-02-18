# Claude Instructions

⚠️ **PRIMARY DIRECTIVE**: Refer to [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) for the universal guidelines, architecture, and workflows.

---

## Claude-Specific Notes

### Strengths to Leverage

- **Deep Reasoning**: Use your extended thinking for complex architectural decisions, especially when modifying the proxy middleware stack or policy engine.
- **Code Safety**: Prioritize readability and type safety in all generated code. Claude excels at catching subtle type errors — lean into this.
- **Long-form Analysis**: When auditing features (like the `DISCOVERED_FEATURES.md` audit), leverage your ability to hold and cross-reference large codebases in context.

### Behavioral Guidelines

- Use `run_agent` for complex multi-step tasks that require autonomous tool usage.
- When generating database migrations, always verify column types match the Drizzle schema exactly.
- For proxy modifications, trace the full middleware chain before making changes: `api-key-oauth.middleware` → `lookup-endpoint-middleware` → `policy.functional` → `logging.functional` → `filter-tools.functional`.
- When working with `isolated-vm`, remember that the sandbox has no `require()`, no `fs`, no `net` — only `mcp.call()` is available.

### Anti-Patterns to Avoid

- Do not use `\` escape characters in markdown (noticed in previous sessions).
- Do not propose changes to security boundaries without explicit user confirmation.
- Do not generate placeholder implementations — all code must be functional.

### Versioning Reminder

Every code change requires: `VERSION` bump → `package.json` bump → `CHANGELOG.md` entry → version in commit message.
