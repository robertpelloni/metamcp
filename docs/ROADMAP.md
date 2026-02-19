# MetaMCP Feature Roadmap

**Current Version**: 3.6.0
**Last Updated**: 2026-01-26

---

## Legend

| Status | Meaning            |
| :----- | :----------------- |
| ✅     | Completed          |
| 🚧     | In Progress        |
| 📋     | Planned            |
| 💡     | Idea/Consideration |

---

## Completed Features (v3.x)

### Agent Memory (v3.5.0) ✅

- [x] **Long-term Persistence** - `memories` table with vector embeddings
- [x] **Semantic Search** - `search_memory` tool using `pgvector`
- [x] **Context Injection** - Automatic retrieval of relevant context
- [x] **Memory Management UI** - `/memories` page for creating/deleting memories

### MCP Registry (v3.5.0) ✅

- [x] **Centralized Registry** - Discovery of 950+ MCP servers
- [x] **One-Click Install** - `server-templates.json` for streamlined setup
- [x] **Verified Templates** - Pre-configured settings for popular tools
- [x] **Registry UI** - `/registry` page with search and filtering

### Analytics & Observability (v3.5.0) ✅

- [x] **Analytics Dashboard** - Visualizations for tool usage, error rates, and top tools
- [x] **Traffic Inspector** - Integrated MCP Shark inspector
- [x] **Usage Metrics** - `AnalyticsService` for aggregating logs
- [x] **Historical Data** - Daily activity tracking

### Security & System (v3.6.0) ✅

- [x] **Audit Logging** - Security event tracking (Policy, Auth, Config changes)
- [x] **System Dashboard** - In-app project status, version, and submodule view
- [x] **Database Schema** - `audit_logs` table with JSON details

### Core Architecture ✅

- [x] **MCP Hub/Proxy** - Centralized gateway for downstream MCP servers
- [x] **Progressive Tool Disclosure** - Hide tools by default, expose via search/load
- [x] **Session Management** - Per-session loaded tools with FIFO eviction (max 200)
- [x] **Namespace Tool Names** - `serverName__toolName` format

### Semantic Search ✅

- [x] **Tool RAG** - pgvector + OpenAI embeddings for semantic tool search
- [x] **Auto-indexing** - Tools indexed on upsert
- [x] **Enhanced Indexing** - Improved search relevance (v3.0.3)

### Code Mode ✅

- [x] **Isolated-vm Sandbox** - Secure JavaScript execution environment
- [x] **Tool Chaining** - `mcp.call()` for calling tools from sandbox
- [x] **Memory Limits** - Configurable via `CODE_EXECUTION_MEMORY_LIMIT`
- [x] **Timeout Protection** - 30s default execution timeout

### Tool Customization ✅

- [x] **Tool Override System** - Namespace-scoped tool customization (name, title, description, annotations)
- [x] **Tool Override UI** - Full inline editing UI in namespace tools table with Save/Cancel/Reset

### Autonomous Agent ✅

- [x] **Natural Language Tasks** - NL → code generation → execution
- [x] **Policy Scoping** - Restrict agent access via `policyId`
- [x] **Agent UI** - Frontend interface for agent interaction (v3.1.0)

### Policy Engine ✅

- [x] **Allow/Deny Patterns** - Fine-grained tool access control
- [x] **Policy Middleware** - All tool calls route through policy checks
- [x] **Per-request Policies** - Dynamic policy selection

### Traffic Inspection ✅

- [x] **MCP Shark Integration** - Traffic logging and inspection
- [x] **Logging Middleware** - Capture all tool calls
- [x] **Traffic UI** - Frontend dashboard for traffic inspection

### Infrastructure ✅

- [x] **Turborepo Monorepo** - Optimized builds with caching
- [x] **Docker Deployment** - Production + dev containers
- [x] **OIDC Authentication** - OAuth/OIDC support
- [x] **CI/CD Pipeline** - GitHub Actions with Docker publishing

### Documentation ✅

- [x] **Universal LLM Instructions** - Single source of truth for AI models
- [x] **Model-specific Appendices** - CLAUDE.md, GPT.md, GEMINI.md
- [x] **Dashboard** - Project overview with versions and structure
- [x] **Session Handoff** - Documentation for AI continuity

---

## In Progress (v3.6.x) 🚧

### Developer Experience

- [x] **Hot Reload Improvements** - Faster development cycles (docs/DEVELOPMENT.md)
- [x] **Better Error Messages** - Typed error classes with ErrorCode enum (`errors.ts`)
- [x] **Config Validation** - JSON Schema validation for configuration files (`config-schemas.zod.ts`)

---

## Planned (v4.x) 📋

### Enhanced Agent

- [ ] **Multi-step Planning** - Complex task decomposition
- [ ] **Tool Learning** - Agent learns from tool usage patterns
- [ ] **Tool Composition** - Chain tools together in pipelines

### Security Enhancements

- [x] **Audit Logging** - Comprehensive audit trail (v3.6.0)
- [ ] **Rate Limiting** - Per-user/per-tool rate limits
- [ ] **Cost Tracking** - Token usage and API cost estimation
- [ ] **Encryption at Rest** - Encrypted tool configurations

### Performance

- [ ] **Connection Pooling** - Efficient MCP server connections
- [ ] **Caching Layer** - Redis cache for tool results
- [ ] **Parallel Tool Execution** - Concurrent tool calls

### UI/UX

- [ ] **Dark Mode** - Theme support
- [ ] **Keyboard Shortcuts** - Power user features
- [ ] **Mobile Responsive** - Mobile-friendly dashboard

---

## Ideas/Considerations 💡

### Borg Integration

- [ ] **Main Executable Integration** - MetaMCP as Borg's primary tool orchestration layer
- [ ] **Shared Authentication** - Unified auth between Borg and MetaMCP
- [ ] **Cross-module Tool Discovery** - Discover tools across Borg submodules
- [ ] **Unified Configuration** - Single config source for Borg ecosystem

### Integration

- [ ] **LangChain Integration** - Use as LangChain tool provider
- [ ] **OpenAI Functions** - Native function calling support
- [ ] **Anthropic Tools** - Claude tool format support
- [ ] **UTCP Protocol** - Universal Tool Calling Protocol support
- [ ] **A2A Protocol** - Agent-to-Agent communication protocol support

### Advanced Features

- [ ] **Tool Personas** - Profile-based tool sets (like HyperTool)
- [ ] **Workflow Builder** - Visual tool chain builder
- [ ] **Scheduled Tasks** - Cron-like tool execution
- [ ] **N-to-1 Orchestration** - Aggregate multiple servers (like NCP)
- [x] **OAuth Client UI** - Admin UI for managing OAuth clients (v3.8.0)
- [ ] **Template Marketplace** - Community-contributed server configurations

### Infrastructure

- [ ] **Kubernetes Deployment** - K8s session routing (like MS MCP-Gateway)
- [ ] **OAuth/SSO Integration** - Enterprise SSO support
- [ ] **Docker Hub Integration** - Pull MCP servers from Docker Hub
- [ ] **Homebrew Formula Scanning** - Detect MCP servers installed via Homebrew
- [ ] **pypi/pip Scanning** - Detect Python-based MCP servers from pip

---

## Version History Summary

| Version    | Date       | Highlights                                        |
| :--------- | :--------- | :------------------------------------------------ |
| **3.6.0**  | 2026-01-26 | Audit Logging, System Dashboard                   |
| **3.5.0**  | 2026-01-26 | Agent Memory, MCP Registry, Analytics, Templates  |
| **3.2.18** | 2026-01-11 | npm Global Package Scanning for MCP servers       |
| **3.2.17** | 2026-01-11 | mcp.json Auto-discovery (Claude/Cursor/VS Code)   |
| **3.2.16** | 2026-01-11 | Auto-reconnection with exponential backoff        |
| **3.2.15** | 2026-01-09 | Server Health Checks (periodic health monitoring) |
| **3.2.14** | 2026-01-09 | Deferred Loading Protocol (lazy tool schemas)     |
| **3.2.13** | 2026-01-09 | Pattern-Based Filtering (glob/regex tool filter)  |
| **3.2.12** | 2026-01-09 | mcpdir submodule + Hybrid Search RRF              |
| **3.2.11** | 2026-01-09 | Hybrid Search (BM25 + Semantic)                   |
| **3.2.10** | 2026-01-09 | Hot Reload Improvements (docs/DEVELOPMENT.md)     |
| **3.2.9**  | 2026-01-09 | Config Validation (config-schemas.zod.ts)         |
| **3.2.8**  | 2026-01-09 | Better Error Messages (typed errors in errors.ts) |
| **3.2.7**  | 2026-01-09 | Middleware Development Guide (docs/MIDDLEWARE.md) |
| **3.2.6**  | 2026-01-09 | Configuration Guide (docs/CONFIGURATION.md)       |
| **3.2.5**  | 2026-01-09 | REST API Documentation (docs/REST_API.md)         |
| **3.2.4**  | 2026-01-09 | Documentation correction: Tool Override UI exists |
| **3.2.3**  | 2026-01-09 | Discovered Features Audit (47+ undocumented)      |
| **3.2.2**  | 2026-01-09 | MCP Directories Library, Feature Parity Plan      |
| **3.2.1**  | 2026-01-09 | Dependency Library Index                          |
| **3.2.0**  | 2026-01-09 | Documentation overhaul, enhanced instructions     |
| **3.1.0**  | 2025-12-27 | Agent implementation, dashboard docs              |
| **3.0.3**  | 2025-12-27 | Enhanced semantic indexing                        |
| **3.0.2**  | 2025-12-27 | Policy Engine implementation                      |
| **3.0.1**  | 2025-12-27 | Centralized versioning system                     |
| **3.0.0**  | 2025-12-15 | Major release: Agent, Code Mode, Semantic Search  |
| **2.x**    | 2025       | Progressive disclosure, basic hub features        |
| **1.x**    | 2025       | Initial MCP proxy implementation                  |

---

## Contributing to Roadmap

To suggest features or changes:

1. Check if the feature is already listed
2. Open a GitHub issue with the `enhancement` label
3. Describe the use case and expected behavior
4. Reference any related issues or PRs

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
