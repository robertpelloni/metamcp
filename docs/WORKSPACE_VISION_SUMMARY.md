# Workspace Vision Summary

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-09  
**Context:** MetaMCP's position within the broader AIOS ecosystem

---

## Executive Summary

MetaMCP is a **critical submodule** within the AIOS (Super AI Plugin) ecosystem—a Meta-Orchestrator for the Model Context Protocol (MCP). This document consolidates vision findings from across the workspace to provide context for MetaMCP's role and development direction.

---

## The Three Pillars of the Workspace

### 1. AIOS (AI Operating System)

**The "Motherboard & OS" for AI Tools**

AIOS is the universal operating system for AI tools, acting as a "Motherboard" that connects, coordinates, and enhances any AI agent, tool, or service.

| Computer Metaphor | AIOS Equivalent                     |
| ----------------- | ----------------------------------- |
| Motherboard       | Core Service (Hub)                  |
| CPU               | ModelGateway (LLM abstraction)      |
| RAM               | Memory Orchestrator                 |
| USB Ports         | MCP Server Connections              |
| Device Drivers    | Adapters (Claude, Gemini, OpenCode) |
| Applications      | Agents & Skills                     |
| Control Panel     | Web Dashboard                       |
| Terminal          | CLI (`super-ai` commands)           |

**Core Philosophies:**

1. **Universal Integration** - Aggregate, don't compete
2. **Active Intelligence** - Autonomous agents with persistent memory
3. **Physical-Digital Bridge** - The Bobcoin "Proof of Health" economy

### 2. MetaMCP (MCP Hub/Proxy)

**The Docker-Based MCP Backend**

MetaMCP serves as:

- **MCP Aggregator** - Combine multiple MCP servers into one
- **MCP Orchestrator** - Coordinate tool calls across servers
- **MCP Middleware** - Apply policies, logging, transformations
- **MCP Gateway** - Single entry point with auth and rate limiting

**Key Features:**

- Progressive Tool Disclosure (85-98% token reduction)
- Semantic Tool Search (Tool RAG with pgvector)
- Code Mode (isolated-vm sandbox execution)
- Autonomous Agents (NL → code generation → execution)
- Policy Engine (allow/deny patterns)
- Traffic Inspection (MCP Shark integration)

**Token Optimization:**
| Before | After | Reduction |
|--------|-------|-----------|
| 100k tokens (500+ tools) | 1k tokens (meta-tools only) | 99% |

### 3. Bobcoin Economy

**"Proof of Health" Cryptocurrency**

A cryptocurrency rewarding:

- Physical Activity (dancing, exercise)
- Social Interaction
- Healthy Relationships

**Anti-Hoarding Design:** High velocity, use-it-or-lose-it mechanics.

**Technical Stack:**

- Privacy: Monero/Solana hybrid
- Mining: "Proof of Dance" via arcade machines
- Infrastructure: Machines double as Tor nodes, distributed storage, game servers

---

## The "Mecha Suit" Architecture

The workspace envisions a **unified TUI** called "SuperAI CLI" (codename: "Mecha Suit") that orchestrates multiple AI tools:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUPER AI CLI (TUI)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Aider     │  │ Claude Code │  │      Gemini CLI         │  │
│  │ (Editing)   │  │ (Assistant) │  │      (Multimodal)       │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                │
│  ┌──────┴────────────────┴─────────────────────┴──────────────┐ │
│  │                     AIOS HUB (Core)                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │
│  │  │ MetaMCP  │ │  Memory  │ │  Agents  │ │  Skills  │       │ │
│  │  │  (Proxy) │ │  (RAG)   │ │ (ReAct)  │ │  (100+)  │       │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Swiss Army Knife Philosophy:** Integrate best-in-class CLIs rather than recreating them:

| CLI         | Strength                     | Role in AIOS    |
| ----------- | ---------------------------- | --------------- |
| Aider       | SOTA code editing, Repo Map  | Code Editor     |
| Claude Code | v2.0.74 coding assistant     | Code Assistant  |
| Gemini CLI  | Google ecosystem, multimodal | General Purpose |
| Goose       | Block's developer agent      | Developer Agent |
| Fabric      | Patterns for life/work       | Wisdom Engine   |

---

## MetaMCP's Strategic Position

### Within AIOS Hierarchy

```
AIOS (Parent Monorepo)
├── packages/core/          # The Brain
├── packages/ui/            # Control Center
├── packages/cli/           # Terminal Interface
└── submodules/
    ├── metamcp/            # ⭐ MCP Hub/Proxy (THIS PROJECT)
    ├── mcp-shark/          # Traffic monitoring
    ├── mcpenetes/          # Client auto-config
    ├── opencode-core/      # AI coding agent
    └── 70+ more...
```

### MetaMCP's Unique Value

1. **Progressive Disclosure** - The killer feature
   - Hide 500+ tools, expose 4 meta-tools
   - `search_tools`, `load_tool`, `run_code`, `run_agent`
   - 85-98% token reduction

2. **Semantic Search (Tool RAG)**
   - pgvector + OpenAI embeddings
   - Find tools by intent, not exact name
   - Auto-indexing on upsert

3. **Code Mode**
   - TypeScript/JavaScript sandbox (isolated-vm)
   - Tool chaining via `mcp.call()`
   - Recursive routing through middleware

4. **Autonomous Agents**
   - Natural language → code generation → execution
   - Policy-scoped access control
   - Transforms any MCP client into a coding agent

---

## Feature Parity Goals

From the broader AIOS vision, MetaMCP should consider:

| Feature                           | Source   | Status in MetaMCP |
| --------------------------------- | -------- | ----------------- |
| Oracle (reasoning model routing)  | Amp      | 📋 Planned        |
| Librarian (external repo search)  | Amp      | 📋 Planned        |
| Memory Bank architecture          | KiloCode | 📋 Planned        |
| Repo Map (AST-based)              | Aider    | 📋 Planned        |
| Toolboxes (auto-register scripts) | AIOS     | 📋 Planned        |

---

## Key Technical Decisions

### From AIOS Conventions

| Convention      | Implementation                 |
| --------------- | ------------------------------ |
| TypeScript      | Strict, ES2022, NodeNext       |
| Package Manager | pnpm workspaces                |
| Build System    | Turborepo                      |
| Styling         | Tailwind CSS                   |
| Architecture    | Manager pattern + EventEmitter |

### Anti-Patterns to Avoid

| Anti-Pattern           | Reason                  |
| ---------------------- | ----------------------- |
| `as any`, `@ts-ignore` | Type safety violations  |
| Empty catch blocks     | Silent error swallowing |
| Simulated actions      | Tools must do real work |
| GPT-5.0 models         | Deprecated              |

---

## Submodule Ecosystem Context

MetaMCP operates alongside these critical submodules:

| Submodule    | Version | Relationship to MetaMCP         |
| ------------ | ------- | ------------------------------- |
| `mcp-shark`  | v1.5.9  | Traffic monitoring (integrated) |
| `mcpenetes`  | v1.0.3  | Client auto-configuration       |
| `mcp-hub`    | v4.2.1  | Alternative hub implementation  |
| `mcp-router` | v0.6.1  | Routing concepts                |
| `Agent-MCP`  | v4.20.0 | MCP server for agents           |

---

## Development Alignment

### MetaMCP Roadmap Priorities

Based on workspace vision, these should be prioritized:

1. **Token Optimization** (highest impact)
   - Hybrid Search (BM25 + Semantic)
   - Deferred Loading Protocol
   - Pattern-Based Filtering

2. **Auto-Discovery**
   - mcp.json auto-discovery
   - Server health checks
   - npm/Homebrew scanning

3. **Enhanced Agent**
   - Multi-step planning
   - Memory/context persistence
   - Tool composition pipelines

4. **Integration**
   - LangChain/OpenAI/Anthropic native support
   - UTCP Protocol support
   - A2A (Agent-to-Agent) protocol

---

## Quick Reference

### MetaMCP Endpoints

| Endpoint            | Purpose                       |
| ------------------- | ----------------------------- |
| `/api/hub/sse`      | SSE streaming for MCP clients |
| `/api/hub/messages` | JSON-RPC message handling     |
| `/search_tools`     | Semantic tool search          |
| `/load_tool`        | Load tool into session        |
| `/run_code`         | Execute sandboxed code        |
| `/run_agent`        | Spawn autonomous agent        |

### Environment Integration

```env
# MetaMCP connects to AIOS via these patterns:
DATABASE_URL=...          # Shared PostgreSQL
OPENAI_API_KEY=...        # Embeddings for Tool RAG
MCP_PROGRESSIVE_MODE=true # Enable progressive disclosure
```

---

## Conclusion

MetaMCP is not just an MCP proxy—it's the **progressive disclosure engine** for the entire AIOS ecosystem. Its primary value proposition is reducing token costs while maintaining full tool access through intelligent search and lazy loading.

**Key Insight:** The workspace vision emphasizes "aggregate, don't compete." MetaMCP embodies this by being the single gateway that unifies all MCP servers while adding value through semantic search, sandboxed execution, and autonomous agents.

---

_"We don't compete. We aggregate. We orchestrate. We amplify."_
— AIOS Vision Document
