# Development Guide

**Version**: 3.2.10  
**Last Updated**: 2026-01-09

This guide covers the development workflow, hot reload configuration, and best practices for working on MetaMCP.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all services (backend + frontend + packages)
pnpm dev

# Or start individual services
pnpm dev:backend   # Backend only (port 12005)
pnpm dev:frontend  # Frontend only (port 12008)
```

---

## Development Scripts

### Root Level

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start all services with hot reload  |
| `pnpm dev:backend`  | Start backend only                  |
| `pnpm dev:frontend` | Start frontend only                 |
| `pnpm dev:docker`   | Start via Docker Compose (dev mode) |
| `pnpm build`        | Production build all packages       |
| `pnpm lint`         | Run ESLint on all packages          |
| `pnpm lint:fix`     | Fix ESLint issues                   |
| `pnpm format`       | Format with Prettier                |
| `pnpm check-types`  | TypeScript type checking            |

### Backend (`apps/backend`)

| Command                | Description                |
| ---------------------- | -------------------------- |
| `pnpm dev`             | tsx watch with hot reload  |
| `pnpm build`           | Production build with tsup |
| `pnpm build:dev`       | Build with sourcemaps      |
| `pnpm build:watch`     | tsup watch mode            |
| `pnpm test`            | Run vitest                 |
| `pnpm test:watch`      | vitest watch mode          |
| `pnpm db:migrate:dev`  | Run migrations (dev)       |
| `pnpm db:generate:dev` | Generate migrations (dev)  |

### Frontend (`apps/frontend`)

| Command            | Description             |
| ------------------ | ----------------------- |
| `pnpm dev`         | Next.js with Turbopack  |
| `pnpm build`       | Production build        |
| `pnpm start`       | Start production server |
| `pnpm lint`        | Next.js lint            |
| `pnpm check-types` | TypeScript check        |

---

## Hot Reload Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        pnpm dev                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Turborepo                                 ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  ││
│  │  │   Backend   │  │  Frontend   │  │      Packages       │  ││
│  │  │  tsx watch  │  │  Turbopack  │  │    tsup --watch     │  ││
│  │  │  (instant)  │  │  (< 100ms)  │  │    (on change)      │  ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  ││
│  │         │                │                    │              ││
│  │         └────────────────┴────────────────────┘              ││
│  │                    Dependency Graph                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Component Details

| Component           | Tool           | Reload Speed | Notes                          |
| ------------------- | -------------- | ------------ | ------------------------------ |
| **Backend**         | `tsx watch`    | ~100ms       | Native ESM, no bundling in dev |
| **Frontend**        | `Turbopack`    | <100ms       | Next.js 15 native bundler      |
| **@repo/trpc**      | `tsup --watch` | ~500ms       | Rebuilds on type changes       |
| **@repo/zod-types** | `tsup --watch` | ~500ms       | Rebuilds on schema changes     |

### Why This Configuration?

1. **tsx watch** (backend)
   - Native TypeScript execution without compilation step
   - `--clear-screen=false` prevents terminal flicker
   - Faster than ts-node or nodemon

2. **Turbopack** (frontend)
   - Next.js native bundler (Rust-based)
   - 10x faster than webpack
   - Incremental compilation

3. **Turborepo orchestration**
   - `dependsOn: ["^dev"]` ensures packages start first
   - `persistent: true` keeps processes running
   - `cache: false` disables caching for dev tasks

---

## Isolated Development

### Backend Only

When working only on backend changes:

```bash
pnpm dev:backend
```

This:

- Starts only the Express server
- Skips frontend compilation
- Faster startup (~2s vs ~5s)

### Frontend Only

When working only on frontend changes:

```bash
pnpm dev:frontend
```

This:

- Starts only Next.js
- Requires backend already running (or use mock API)
- Fastest iteration for UI work

### Full Stack

For changes that span both:

```bash
pnpm dev
```

This starts everything with proper dependency ordering.

---

## Environment Setup

### Required Files

```bash
# Copy environment template
cp .env.example .env.local

# Required variables
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
OPENAI_API_KEY=sk-...  # For semantic search
```

### Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker compose -f docker-compose.dev.yml up -d postgres

# Run migrations
pnpm --filter backend db:migrate:dev
```

---

## Debugging

### Backend Debugging

1. **VS Code**: Use the built-in debugger with tsx:

   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Backend",
     "runtimeExecutable": "pnpm",
     "runtimeArgs": ["--filter", "backend", "dev"],
     "console": "integratedTerminal"
   }
   ```

2. **Console logging**: Already configured with structured logging

### Frontend Debugging

1. **React DevTools**: Install browser extension
2. **Next.js DevTools**: Built into Turbopack
3. **React Query DevTools**: Enabled in development

---

## Performance Tips

### Faster Rebuilds

1. **Use filtered commands** when possible:

   ```bash
   pnpm --filter backend dev  # Only backend
   ```

2. **Close unused editors** - file watchers consume resources

3. **Use SSD** - tsx watch performs many file reads

### Reducing Startup Time

1. **Skip type checking in dev**:

   ```bash
   TSC_COMPILE_ON_ERROR=true pnpm dev
   ```

2. **Use Docker for database** - avoids local Postgres overhead

---

## Troubleshooting

### Hot Reload Not Working

1. **Check file watchers limit** (Linux):

   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Clear Turborepo cache**:

   ```bash
   pnpm turbo clean
   ```

3. **Restart TypeScript server** in VS Code: `Ctrl+Shift+P` → "Restart TS Server"

### Port Conflicts

| Service    | Default Port | Override            |
| ---------- | ------------ | ------------------- |
| Backend    | 12005        | `PORT=12005`        |
| Frontend   | 12008        | Edit `package.json` |
| PostgreSQL | 5432         | `DATABASE_URL`      |

### Package Changes Not Reflecting

If changes to `@repo/trpc` or `@repo/zod-types` aren't detected:

```bash
# Rebuild packages manually
pnpm --filter @repo/trpc build
pnpm --filter @repo/zod-types build
```

---

## Docker Development

### Full Docker Environment

```bash
pnpm dev:docker
```

This starts:

- Backend container with volume mounts
- Frontend container with volume mounts
- PostgreSQL container
- Hot reload via Docker volumes

### Clean Docker Environment

```bash
pnpm dev:docker:clean
```

Removes all containers, volumes, and orphans.

---

## Testing During Development

### Run Tests on Change

```bash
# Backend tests
pnpm --filter backend test:watch

# Run specific test file
pnpm --filter backend test:watch src/lib/ai/agent.test.ts
```

### Type Checking

```bash
# All packages
pnpm check-types

# Single package
pnpm --filter backend check-types
```

---

## IDE Configuration

### VS Code Extensions (Recommended)

- **ESLint** - Linting
- **Prettier** - Formatting
- **Tailwind CSS IntelliSense** - Frontend styling
- **Prisma** (for Drizzle syntax highlighting)

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## Common Workflows

### Adding a New API Endpoint

1. Define types in `packages/zod-types/src/`
2. Add tRPC router in `apps/backend/src/trpc/routers/`
3. Export from `apps/backend/src/trpc/routers/index.ts`
4. Use in frontend via `trpc.yourRouter.yourProcedure`

### Adding a New MCP Tool

1. Create handler in `apps/backend/src/lib/metamcp/`
2. Register in middleware stack
3. Add to policy engine if needed
4. Test via `/api/hub/sse` endpoint

### Modifying Database Schema

1. Edit `apps/backend/src/db/schema.ts`
2. Generate migration: `pnpm --filter backend db:generate:dev`
3. Run migration: `pnpm --filter backend db:migrate:dev`

---

## Related Documentation

- [LLM_INSTRUCTIONS.md](../LLM_INSTRUCTIONS.md) - Architecture overview
- [CONFIGURATION.md](CONFIGURATION.md) - Environment variables
- [MIDDLEWARE.md](MIDDLEWARE.md) - Middleware development
- [REST_API.md](REST_API.md) - API documentation
