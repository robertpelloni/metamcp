# Gemini Instructions

⚠️ **PRIMARY DIRECTIVE**: Refer to [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) for the universal guidelines, architecture, and workflows.

---

## Gemini-Specific Notes

### Strengths to Leverage

- **Large Context Window**: Leverage your extended context to analyze entire files when debugging. Load full service files (e.g., `metamcp-proxy.ts`, `tool-search.service.ts`) rather than snippets.
- **Multimodal Capability**: When reviewing UI changes, capture and analyze screenshots to verify dark mode theming, layout alignment, and component rendering.
- **Parallel Processing**: Use parallel tool calls aggressively for independent operations (e.g., reading multiple files, running multiple searches simultaneously).

### Behavioral Guidelines

- Ensure all code changes are **strictly typed** — never rely on type inference for public APIs.
- When performing project analysis, use `grep_search` and `find_by_name` to build a complete picture before proposing changes.
- For documentation updates, cross-reference `ROADMAP.md`, `CHANGELOG.md`, `DASHBOARD.md`, and `VISION.md` to ensure consistency.
- Always check for upstream changes (`git fetch upstream`) before starting feature work.

### Codebase Conventions

- **Services**: Follow the `*.service.ts` pattern with class-based architecture.
- **Middleware**: Follow the functional middleware pattern in `metamcp-middleware/*.functional.ts`.
- **Frontend**: Use shadcn/ui components, Radix primitives, and Tailwind CSS 4.
- **State**: Frontend uses `@tanstack/react-query` via tRPC hooks, plus `zustand` for client state.

### Versioning Reminder

Every code change requires: `VERSION` bump → `package.json` bump → `CHANGELOG.md` entry → version in commit message.
