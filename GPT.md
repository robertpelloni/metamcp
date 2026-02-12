# GPT Instructions

⚠️ **PRIMARY DIRECTIVE**: Refer to [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) for the universal guidelines, architecture, and workflows.

---

## GPT-Specific Notes

### Strengths to Leverage

- **Concise Code Generation**: Focus on efficient, minimal code that achieves the goal without unnecessary abstraction.
- **Tool Calling**: GPT excels at structured function calling — use this for tRPC router implementations and Zod schema generation.
- **Instruction Following**: Follow the "Search → Load → Use" pattern strictly when interacting with the MCP hub.

### Behavioral Guidelines

- Keep responses concise and focused on implementation.
- When implementing features, generate complete, runnable code — never leave `TODO` comments.
- For tRPC routers, follow the existing pattern: define Zod input schema → implement procedure → register in `appRouter`.
- When generating Drizzle schema changes, always include the corresponding migration generation step.

### Codebase Patterns

- **Router pattern**: `packages/trpc/src/routers/*.ts` for shared definitions, `apps/backend/src/trpc/*.impl.ts` for implementations.
- **Frontend pages**: `apps/frontend/app/[locale]/(sidebar)/*/page.tsx` using the sidebar layout.
- **Components**: shadcn/ui based, located in `apps/frontend/components/ui/`.

### Versioning Reminder

Every code change requires: `VERSION` bump → `package.json` bump → `CHANGELOG.md` entry → version in commit message.
