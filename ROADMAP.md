# 🗺️ MetaMCP Roadmap & Status

## ✅ Accomplished Features

### Core Infrastructure
- [x] **Unified MCP Hub (`metamcp-proxy.ts`):** Aggregates multiple downstream MCP servers into a single endpoint.
- [x] **Postgres & pgvector:** Modernized Docker setup for vector storage.
- [x] **Auto-Discovery:** `McpConfigWatcher` monitors `/app/config/mcp` for changes.
- [x] **Import/Export:** UI for bulk server configuration.

### Intelligence & RAG
- [x] **Progressive Disclosure:** Tools hidden by default; exposed via `search_tools` / `load_tool`.
- [x] **Semantic Search (Tool RAG):** OpenAI embeddings + pgvector.
- [x] **Context Optimization:** `DescriptionEnhancerService` generates "Concise" descriptions for LLM context and "Rich" descriptions for search. Proxy dynamically injects the concise version.
- [x] **Memory RAG:** Agent automatically searches long-term memory (`memories` table) and injects context into the system prompt.
- [x] **Type Safety:** `ToolTypeGenerator` injects strict TypeScript definitions into the Agent's prompt.

### Code Mode & Orchestration
- [x] **JavaScript Sandbox:** `run_code` using `isolated-vm`.
- [x] **Python Bridge:** `run_python` with `PythonBridgeService` allows Python scripts to orchestrate MCP tools via `mcp.call()`.
- [x] **Persistence:** `save_script`, `save_tool_set` meta-tools.
- [x] **Syntax Compression:** `TOON` serializer support.
- [x] **LLM Sampling:** `ask_llm` tool for scripts to query LLMs.

### Agents & Isolation
- [x] **Autonomous Agent:** `run_agent` (Planner/Executor).
- [x] **Sub-Agent Policies:** `PolicyService` allows restricting agents to specific tool scopes (`policyId`).
- [x] **Hallucination Prevention:** Agent search results are filtered by Policy before presentation.

### Observability & UX
- [x] **Live Logs:** Real-time JSON-RPC payload inspector.
- [x] **Agent Thought Streaming:** Frontend streams tool calls and logs as "Thoughts".
- [x] **Inline Inspection:** Thoughts are collapsible to view raw JSON.
- [x] **Notifications:** Full-stack alert system.
- [x] **IntelliSense UI:** Scripts editor with auto-injected tool types.

## 🚧 Pending / In Progress

### Scripts Management (Next Priority)
- [ ] **Create/Update Scripts via UI:** Currently the UI is a simulation; backend router needs updates.
- [ ] **Run Scripts via UI:** Ability to execute saved scripts directly from the dashboard.
- [ ] **Agent Playground:** Wire up the "Test Agent" button to the real backend mutation.

### Future Considerations
- **Multi-Tenant Context:** Currently scoped effectively to single-user/admin.
- **Visual Graph:** Visualization of tool dependencies or agent execution paths.
- **External Auth Providers:** OIDC is scaffolded but full multi-provider setup could be expanded.

## 📚 Documentation
- `HANDOFF.md`: Architecture overview.
- `AGENTS.md`: Operational guide.
- `CLAUDE.md`: AI coding guidelines.
