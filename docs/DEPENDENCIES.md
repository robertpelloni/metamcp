# MetaMCP Dependency Library Index

**Version**: 3.2.1  
**Last Updated**: 2026-01-09

This document provides a comprehensive index of all dependencies used in MetaMCP, with quality ratings, documentation links, and usage notes.

---

## Rating System

| Rating | Meaning |
|:------:|:--------|
| ⭐⭐⭐⭐⭐ | Excellent - Industry standard, exceptional docs, highly stable |
| ⭐⭐⭐⭐ | Very Good - Well-maintained, good docs, reliable |
| ⭐⭐⭐ | Good - Functional, adequate docs, some quirks |
| ⭐⭐ | Fair - Works but has limitations or sparse docs |
| ⭐ | Limited - Use with caution, consider alternatives |

---

## Backend Dependencies

### Core Framework

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **express** | ^5.1.0 | ⭐⭐⭐⭐⭐ | Web framework for Node.js (v5 async/await native) | [expressjs.com](https://expressjs.com/) |
| **@trpc/server** | ^11.4.1 | ⭐⭐⭐⭐⭐ | End-to-end typesafe APIs | [trpc.io](https://trpc.io/) |
| **zod** | ^3.25.64 | ⭐⭐⭐⭐⭐ | TypeScript-first schema validation | [zod.dev](https://zod.dev/) |

### Database & ORM

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **drizzle-orm** | ^0.44.2 | ⭐⭐⭐⭐⭐ | TypeScript ORM with SQL-like syntax | [orm.drizzle.team](https://orm.drizzle.team/) |
| **pg** | ^8.16.0 | ⭐⭐⭐⭐⭐ | PostgreSQL client for Node.js | [node-postgres.com](https://node-postgres.com/) |
| **pgvector** | ^0.2.1 | ⭐⭐⭐⭐ | pgvector support for Node.js | [github.com/pgvector/pgvector-node](https://github.com/pgvector/pgvector-node) |

**Notes**:
- `drizzle-orm`: Preferred over Prisma for its SQL-like API and better performance
- `pgvector`: Used for semantic tool search (Tool RAG). Requires PostgreSQL with pgvector extension installed

### MCP & AI

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **@modelcontextprotocol/sdk** | 1.16.0 | ⭐⭐⭐⭐ | Official MCP SDK | [modelcontextprotocol.io](https://modelcontextprotocol.io/) |
| **openai** | ^6.10.0 | ⭐⭐⭐⭐⭐ | OpenAI API client | [platform.openai.com](https://platform.openai.com/docs) |
| **isolated-vm** | ^6.0.2 | ⭐⭐⭐⭐ | Secure V8 isolate sandbox | [github.com/laverdet/isolated-vm](https://github.com/laverdet/isolated-vm) |

**Notes**:
- `@modelcontextprotocol/sdk`: Pin exact version - breaking changes between minors
- `isolated-vm`: Native module, may require rebuild on Node version changes. Used for Code Mode sandbox execution

### Authentication

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **better-auth** | ^1.4.2 | ⭐⭐⭐⭐ | Modern auth library with OIDC support | [better-auth.com](https://www.better-auth.com/) |
| **basic-auth** | ^2.0.1 | ⭐⭐⭐⭐ | Basic HTTP authentication parser | [npmjs.com/package/basic-auth](https://www.npmjs.com/package/basic-auth) |

### Security & Middleware

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **helmet** | ^8.1.0 | ⭐⭐⭐⭐⭐ | Security headers middleware | [helmetjs.github.io](https://helmetjs.github.io/) |
| **cors** | ^2.8.5 | ⭐⭐⭐⭐⭐ | CORS middleware | [npmjs.com/package/cors](https://www.npmjs.com/package/cors) |

### Process Management

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **execa** | ^9.6.0 | ⭐⭐⭐⭐⭐ | Better child_process | [github.com/sindresorhus/execa](https://github.com/sindresorhus/execa) |
| **cross-spawn** | ^7.0.6 | ⭐⭐⭐⭐⭐ | Cross-platform spawn | [npmjs.com/package/cross-spawn](https://www.npmjs.com/package/cross-spawn) |
| **spawn-rx** | ^5.1.2 | ⭐⭐⭐ | RxJS-based spawn | [github.com/electron/spawn-rx](https://github.com/electron/spawn-rx) |
| **shell-quote** | ^1.8.3 | ⭐⭐⭐⭐ | Shell argument parsing | [npmjs.com/package/shell-quote](https://www.npmjs.com/package/shell-quote) |

**Notes**:
- `execa`: Preferred for most process spawning needs
- `cross-spawn`: Used when Windows compatibility is critical
- `spawn-rx`: Used for reactive process handling in MCP server management

### Utilities

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **nanoid** | ^5.1.5 | ⭐⭐⭐⭐⭐ | Secure unique ID generator | [github.com/ai/nanoid](https://github.com/ai/nanoid) |
| **minimatch** | ^10.1.1 | ⭐⭐⭐⭐⭐ | Glob pattern matching | [npmjs.com/package/minimatch](https://www.npmjs.com/package/minimatch) |
| **dotenv** | ^16.5.0 | ⭐⭐⭐⭐⭐ | Environment variable loading | [npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv) |

---

## Frontend Dependencies

### Core Framework

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **next** | ^15.4.8 | ⭐⭐⭐⭐⭐ | React framework with App Router | [nextjs.org](https://nextjs.org/docs) |
| **react** | ^19.1.2 | ⭐⭐⭐⭐⭐ | UI library | [react.dev](https://react.dev/) |
| **react-dom** | ^19.1.2 | ⭐⭐⭐⭐⭐ | React DOM bindings | [react.dev](https://react.dev/) |

**Notes**:
- Using React 19 with new features (use, Actions, etc.)
- Next.js 15 with Turbopack for dev server (`--turbopack` flag)

### Styling

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **tailwindcss** | ^4.1.10 | ⭐⭐⭐⭐⭐ | Utility-first CSS framework | [tailwindcss.com](https://tailwindcss.com/) |
| **@tailwindcss/postcss** | ^4.1.10 | ⭐⭐⭐⭐⭐ | Tailwind PostCSS plugin | [tailwindcss.com](https://tailwindcss.com/) |
| **tailwind-merge** | ^3.3.1 | ⭐⭐⭐⭐⭐ | Merge Tailwind classes without conflicts | [github.com/dcastil/tailwind-merge](https://github.com/dcastil/tailwind-merge) |
| **clsx** | ^2.1.1 | ⭐⭐⭐⭐⭐ | Conditional className utility | [npmjs.com/package/clsx](https://www.npmjs.com/package/clsx) |
| **class-variance-authority** | ^0.7.1 | ⭐⭐⭐⭐ | Component variant management | [cva.style](https://cva.style/docs) |

**Notes**:
- Tailwind 4 uses CSS-first configuration (no `tailwind.config.js`)
- `clsx` + `tailwind-merge` = `cn()` utility function

### UI Components (Radix UI)

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **@radix-ui/react-dialog** | ^1.1.14 | ⭐⭐⭐⭐⭐ | Accessible dialog/modal | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/dialog) |
| **@radix-ui/react-dropdown-menu** | ^2.1.15 | ⭐⭐⭐⭐⭐ | Accessible dropdown menu | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) |
| **@radix-ui/react-select** | ^2.2.5 | ⭐⭐⭐⭐⭐ | Accessible select | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/select) |
| **@radix-ui/react-tabs** | ^1.1.12 | ⭐⭐⭐⭐⭐ | Accessible tabs | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/tabs) |
| **@radix-ui/react-tooltip** | ^1.2.7 | ⭐⭐⭐⭐⭐ | Accessible tooltip | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/tooltip) |
| **@radix-ui/react-checkbox** | ^1.3.2 | ⭐⭐⭐⭐⭐ | Accessible checkbox | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/checkbox) |
| **@radix-ui/react-switch** | ^1.2.5 | ⭐⭐⭐⭐⭐ | Accessible switch | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/switch) |
| **@radix-ui/react-label** | ^2.1.7 | ⭐⭐⭐⭐⭐ | Accessible label | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/label) |
| **@radix-ui/react-separator** | ^1.1.7 | ⭐⭐⭐⭐⭐ | Accessible separator | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/separator) |
| **@radix-ui/react-alert-dialog** | ^1.1.15 | ⭐⭐⭐⭐⭐ | Accessible alert dialog | [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/alert-dialog) |
| **@radix-ui/react-slot** | ^1.2.3 | ⭐⭐⭐⭐⭐ | Slot component for composition | [radix-ui.com](https://www.radix-ui.com/primitives/docs/utilities/slot) |

**Notes**:
- All Radix components are unstyled primitives - we apply Tailwind styles via Shadcn UI patterns
- Radix provides excellent accessibility out of the box (ARIA, keyboard navigation)

### Data Fetching & State

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **@tanstack/react-query** | ^5.80.7 | ⭐⭐⭐⭐⭐ | Server state management | [tanstack.com/query](https://tanstack.com/query/latest) |
| **@trpc/client** | ^11.4.1 | ⭐⭐⭐⭐⭐ | tRPC client | [trpc.io](https://trpc.io/) |
| **@trpc/react-query** | ^11.4.1 | ⭐⭐⭐⭐⭐ | tRPC React Query integration | [trpc.io](https://trpc.io/) |
| **swr** | ^2.3.3 | ⭐⭐⭐⭐⭐ | React Hooks for data fetching | [swr.vercel.app](https://swr.vercel.app/) |
| **zustand** | ^5.0.6 | ⭐⭐⭐⭐⭐ | Lightweight state management | [zustand-demo.pmnd.rs](https://zustand-demo.pmnd.rs/) |
| **@better-fetch/fetch** | ^1.1.18 | ⭐⭐⭐⭐ | Enhanced fetch wrapper | [npmjs.com/package/@better-fetch/fetch](https://www.npmjs.com/package/@better-fetch/fetch) |

**Notes**:
- Primary data fetching: tRPC + React Query
- `swr`: Used for simpler fetch cases
- `zustand`: Used for client-side only state (UI state, preferences)

### Forms

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **react-hook-form** | ^7.58.0 | ⭐⭐⭐⭐⭐ | Performant forms with hooks | [react-hook-form.com](https://react-hook-form.com/) |
| **@hookform/resolvers** | ^5.1.1 | ⭐⭐⭐⭐⭐ | Validation resolvers (Zod) | [react-hook-form.com](https://react-hook-form.com/docs/useform#resolver) |

**Notes**:
- Always use with Zod resolver for type-safe validation
- Pattern: `useForm({ resolver: zodResolver(schema) })`

### Tables

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **@tanstack/react-table** | ^8.21.3 | ⭐⭐⭐⭐⭐ | Headless table library | [tanstack.com/table](https://tanstack.com/table/latest) |

### UI Utilities

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **lucide-react** | ^0.515.0 | ⭐⭐⭐⭐⭐ | Icon library | [lucide.dev](https://lucide.dev/) |
| **sonner** | ^2.0.5 | ⭐⭐⭐⭐⭐ | Toast notifications | [sonner.emilkowal.ski](https://sonner.emilkowal.ski/) |
| **next-themes** | ^0.4.6 | ⭐⭐⭐⭐⭐ | Theme switching for Next.js | [github.com/pacocoursey/next-themes](https://github.com/pacocoursey/next-themes) |
| **date-fns** | ^4.1.0 | ⭐⭐⭐⭐⭐ | Date utility library | [date-fns.org](https://date-fns.org/) |
| **ahooks** | ^3.9.0 | ⭐⭐⭐⭐ | React hooks collection | [ahooks.js.org](https://ahooks.js.org/) |

### Code Display

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **react-syntax-highlighter** | ^15.6.1 | ⭐⭐⭐⭐ | Syntax highlighting for React | [npmjs.com/package/react-syntax-highlighter](https://www.npmjs.com/package/react-syntax-highlighter) |
| **prismjs** | ^1.30.0 | ⭐⭐⭐⭐⭐ | Syntax highlighting engine | [prismjs.com](https://prismjs.com/) |

### Environment

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **next-runtime-env** | ^3.3.0 | ⭐⭐⭐⭐ | Runtime env vars in Next.js | [github.com/expatfile/next-runtime-env](https://github.com/expatfile/next-runtime-env) |

**Notes**:
- Enables runtime environment variables (not just build-time)
- Required for Docker deployments where env vars change per environment

---

## Monorepo & Build Tools

| Package | Version | Rating | Description | Docs |
|:--------|:--------|:------:|:------------|:-----|
| **turbo** | ^2.5.5 | ⭐⭐⭐⭐⭐ | Monorepo build system | [turbo.build](https://turbo.build/) |
| **pnpm** | 9.0.0 | ⭐⭐⭐⭐⭐ | Fast package manager | [pnpm.io](https://pnpm.io/) |
| **tsup** | ^8.5.0 | ⭐⭐⭐⭐⭐ | TypeScript bundler | [tsup.egoist.dev](https://tsup.egoist.dev/) |
| **tsx** | ^4.20.3 | ⭐⭐⭐⭐⭐ | TypeScript execute | [github.com/privatenumber/tsx](https://github.com/privatenumber/tsx) |
| **typescript** | 5.8.2 | ⭐⭐⭐⭐⭐ | TypeScript compiler | [typescriptlang.org](https://www.typescriptlang.org/) |
| **prettier** | ^3.5.3 | ⭐⭐⭐⭐⭐ | Code formatter | [prettier.io](https://prettier.io/) |
| **eslint** | ^9.28.0 | ⭐⭐⭐⭐⭐ | Linter | [eslint.org](https://eslint.org/) |
| **vitest** | ^4.0.15 | ⭐⭐⭐⭐⭐ | Test framework | [vitest.dev](https://vitest.dev/) |
| **drizzle-kit** | ^0.31.1 | ⭐⭐⭐⭐⭐ | Drizzle migrations CLI | [orm.drizzle.team](https://orm.drizzle.team/kit-docs/overview) |
| **dotenv-cli** | ^8.0.0 | ⭐⭐⭐⭐ | CLI for dotenv | [npmjs.com/package/dotenv-cli](https://www.npmjs.com/package/dotenv-cli) |

---

## Workspace Packages

| Package | Location | Description |
|:--------|:---------|:------------|
| **@repo/trpc** | `packages/trpc` | Shared tRPC router types |
| **@repo/zod-types** | `packages/zod-types` | Shared Zod schemas |
| **@repo/eslint-config** | `packages/eslint-config` | Shared ESLint configuration |
| **@repo/typescript-config** | `packages/typescript-config` | Shared TypeScript configuration |

---

## Git Submodules

| Submodule | Location | Description |
|:----------|:---------|:------------|
| **mcp-shark** | `apps/backend/mcp-shark`, `submodules/mcp-shark` | Traffic inspection/logging module |

**Commands**:
```bash
# Initialize submodules
git submodule update --init --recursive

# Update submodules to latest
git submodule update --remote
```

---

## Dependency Management Guidelines

### Adding Dependencies

1. **Check existing deps first** - Avoid duplicates with similar functionality
2. **Prefer well-maintained packages** - Check last commit date, issue response time
3. **Consider bundle size** - Use [bundlephobia.com](https://bundlephobia.com) to check
4. **Pin MCP SDK version** - Use exact version to avoid breaking changes
5. **Use workspace packages** - For shared code between apps

### Updating Dependencies

```bash
# Check outdated packages
pnpm outdated

# Update all packages (within semver range)
pnpm update

# Update specific package to latest
pnpm update <package>@latest

# Rebuild native modules after Node upgrade
pnpm rebuild
```

### Version Pinning Strategy

| Package Type | Strategy | Example |
|:-------------|:---------|:--------|
| MCP SDK | Exact | `"1.16.0"` |
| Major frameworks | Caret | `"^15.4.8"` |
| Utilities | Caret | `"^5.1.5"` |
| Native modules | Caret with caution | `"^6.0.2"` |

---

## Troubleshooting Common Issues

### `isolated-vm` Build Failures

```bash
# Rebuild native modules
pnpm rebuild isolated-vm

# If using different Node version
rm -rf node_modules && pnpm install
```

### pgvector Connection Issues

Ensure PostgreSQL has pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### TypeScript Version Mismatch

All packages should use the same TypeScript version:
```bash
pnpm why typescript
```

---

## Security Considerations

| Package | Security Notes |
|:--------|:---------------|
| `isolated-vm` | Memory limits configurable via `CODE_EXECUTION_MEMORY_LIMIT` |
| `helmet` | Default security headers applied |
| `better-auth` | OIDC/OAuth for production auth |
| `shell-quote` | Use for safe command parsing |

---

## Performance Notes

| Package | Performance Tip |
|:--------|:----------------|
| `drizzle-orm` | Use `select()` instead of `findMany()` for better perf |
| `react-query` | Configure `staleTime` to reduce refetches |
| `next` | Use Turbopack in dev (`--turbopack`) |
| `tailwindcss` | Tailwind 4 has improved build times |

---

*Last reviewed: 2026-01-09*
