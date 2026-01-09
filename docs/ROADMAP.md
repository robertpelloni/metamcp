# MetaMCP Feature Roadmap

**Current Version**: 3.2.0  
**Last Updated**: 2026-01-09

---

## Legend

| Status | Meaning |
|:-------|:--------|
| ✅ | Completed |
| 🚧 | In Progress |
| 📋 | Planned |
| 💡 | Idea/Consideration |

---

## Completed Features (v3.x)

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

## In Progress (v3.2.x) 🚧

### Documentation Enhancements
- [x] **Enhanced Dashboard** - Comprehensive submodule and dependency documentation
- [x] **Enhanced LLM Instructions** - Detailed workflow preferences
- [x] **ROADMAP.md** - This file
- [ ] **Dependency Library Index** - Rated documentation of all dependencies

### Developer Experience
- [ ] **Hot Reload Improvements** - Faster development cycles
- [ ] **Better Error Messages** - More descriptive error handling

---

## Planned (v3.3.x - v4.x) 📋

### Auto-Discovery
- [ ] **mcp.json Auto-discovery** - Automatic detection of MCP servers
- [ ] **Server Health Checks** - Monitor downstream server status
- [ ] **Auto-reconnection** - Recover from server disconnections

### Enhanced Agent
- [ ] **Multi-step Planning** - Complex task decomposition
- [ ] **Memory/Context** - Agent memory across conversations
- [ ] **Tool Learning** - Agent learns from tool usage patterns

### Security Enhancements
- [ ] **Audit Logging** - Comprehensive audit trail
- [ ] **Rate Limiting** - Per-user/per-tool rate limits
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

### Integration
- [ ] **LangChain Integration** - Use as LangChain tool provider
- [ ] **OpenAI Functions** - Native function calling support
- [ ] **Anthropic Tools** - Claude tool format support

### Advanced Features
- [ ] **Tool Composition** - Create composite tools from existing tools
- [ ] **Workflow Builder** - Visual tool chain builder
- [ ] **Scheduled Tasks** - Cron-like tool execution

### Analytics
- [ ] **Usage Analytics** - Tool usage statistics
- [ ] **Cost Tracking** - Track API costs per tool/user
- [ ] **Performance Metrics** - Tool latency tracking

---

## Version History Summary

| Version | Date | Highlights |
|:--------|:-----|:-----------|
| **3.2.0** | 2026-01-09 | Documentation overhaul, enhanced instructions |
| **3.1.0** | 2025-12-27 | Agent implementation, dashboard docs |
| **3.0.3** | 2025-12-27 | Enhanced semantic indexing |
| **3.0.2** | 2025-12-27 | Policy Engine implementation |
| **3.0.1** | 2025-12-27 | Centralized versioning system |
| **3.0.0** | 2025-12-15 | Major release: Agent, Code Mode, Semantic Search |
| **2.x** | 2025 | Progressive disclosure, basic hub features |
| **1.x** | 2025 | Initial MCP proxy implementation |

---

## Contributing to Roadmap

To suggest features or changes:
1. Check if the feature is already listed
2. Open a GitHub issue with the `enhancement` label
3. Describe the use case and expected behavior
4. Reference any related issues or PRs

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
