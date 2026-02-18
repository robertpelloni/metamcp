# GitHub Copilot Instructions

⚠️ **PRIMARY DIRECTIVE**: Refer to [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) for the universal guidelines, architecture, and workflows.

---

## Copilot-Specific Notes

### Behavioral Guidelines

- You are an expert AI programming assistant working on the MetaMCP MCP proxy/gateway.
- Follow the user's requirements carefully and to the letter.
- Keep suggestions short, focused, and impersonal.
- Always suggest strictly typed TypeScript — never use `any`.

### Code Completion Priorities

1. **Type Safety**: Always suggest explicit return types for functions and complete generic parameters.
2. **Existing Patterns**: Follow the established service/router/middleware patterns in the codebase.
3. **Imports**: Use path aliases (`@/components/`, `@/lib/`, `@/hooks/`) for frontend imports.
4. **Error Handling**: Always suggest try/catch blocks with typed error handling.

### Component Library

- **UI Components**: Import from `@/components/ui/` (shadcn/ui).
- **Icons**: Import from `lucide-react`.
- **Forms**: Use `react-hook-form` with `@hookform/resolvers/zod`.
- **Data Fetching**: Use tRPC hooks from `@/utils/trpc`.
- **Themes**: Use CSS variables (`text-foreground`, `bg-background`, etc.) — never hardcode colors.

### Versioning Reminder

Every code change requires: `VERSION` bump → `package.json` bump → `CHANGELOG.md` entry → version in commit message.
