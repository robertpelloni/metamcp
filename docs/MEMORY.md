# MetaMCP Project Memory & Design Preferences

**Version:** 3.7.0
**Last Updated:** 2026-02-17

## 🧠 Core Philosophy
- **User First:** The user is the ultimate architect. We implement their vision with precision.
- **Robustness:** "It just works." No simulated paths in production. Real implementations only.
- **Hybrid Resilience:** depend on files (`mcp.json`) for configuration, Database (`pgvector`) for power.
- **Progressive Disclosure:** Hide complexity. Expose power on demand.

## 🎨 Design Preferences
- **UI/UX:** clean, dark-mode first, shadcn/ui.
- **Code Style:** Strict TypeScript, Functional patterns where possible, explicit error handling.
- **Logging:** Structured logs, no console noise in production.

## 🏗️ Architecture Decisions
- **Monorepo:** Turborepo for strict boundary management.
- **MCP Hub:** The core value is the *proxy* and *orchestration*, not just hosting.
- **Agent Memory:** Context is king. We save agent execution results to `memories.json`/DB.

## 📝 Recurring Patterns
- **Service Layer:** `*.service.ts` encapsulates business logic.
- **TRPC Router:** Exposes service methods to frontend.
- **Repository:** `*.repo.ts` handles data access (File or DB).
