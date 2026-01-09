# MCP Directories Library

**Comprehensive index of MCP (Model Context Protocol) server directories, registries, and resources.**

This library aggregates multiple MCP server listings from various sources to provide a unified, deduplicated index of available MCP servers and tools.

---

## Directory Sources

### Git Submodules (Auto-Updatable)

| Submodule                       | Source                                                                                | Description                                          | Stars |
| ------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----- |
| `awesome-mcp-servers-punkpeye`  | [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)       | Curated list with categories (Finance, DevOps, etc.) | 35k+  |
| `awesome-mcp-servers-appcypher` | [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers)     | Community-maintained awesome list                    | 8k+   |
| `awesome-mcp-servers-wong2`     | [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)             | Original awesome-mcp-servers list                    | 4k+   |
| `toolsdk-mcp-registry`          | [toolsdk-ai/toolsdk-mcp-registry](https://github.com/toolsdk-ai/toolsdk-mcp-registry) | ToolSDK official MCP registry                        | -     |
| `awesome-ai-apps`               | [Arindam200/awesome-ai-apps](https://github.com/Arindam200/awesome-ai-apps)           | AI apps including MCP servers                        | 2k+   |
| `mcp-official-servers`          | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)       | Official MCP reference servers                       | 75k+  |

### Web-Based Registries (Manual Scrape)

| Registry       | URL                                 | Description                    | Update Frequency |
| -------------- | ----------------------------------- | ------------------------------ | ---------------- |
| PulseMCP       | https://www.pulsemcp.com/servers    | Real-time MCP server discovery | Daily            |
| Playbooks MCP  | https://playbooks.com/mcp/          | Playbooks.com MCP integration  | Weekly           |
| Docker Hub MCP | https://hub.docker.com/search?q=mcp | Docker Hub MCP images          | Continuous       |
| Enact Tools    | https://enact.tools/                | Enact MCP tool platform        | Weekly           |
| Smithery       | https://smithery.ai/servers         | Smithery MCP marketplace       | Daily            |
| MCP.run        | https://mcp.run/                    | MCP server hosting platform    | Daily            |
| Glama MCP      | https://glama.ai/mcp/servers        | Glama MCP directory            | Weekly           |

### Official Resources

| Resource           | URL                                                    | Description                  |
| ------------------ | ------------------------------------------------------ | ---------------------------- |
| MCP Specification  | https://spec.modelcontextprotocol.io/                  | Official MCP protocol spec   |
| MCP GitHub Org     | https://github.com/modelcontextprotocol                | Official GitHub organization |
| MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | Official TS SDK              |
| MCP Python SDK     | https://github.com/modelcontextprotocol/python-sdk     | Official Python SDK          |

---

## Update Commands

### Update All Submodules

```bash
# From metamcp root
git submodule update --remote --merge submodules/mcp-directories/

# Or update specific submodule
git submodule update --remote --merge submodules/mcp-directories/awesome-mcp-servers-punkpeye
```

### Extract URLs Programmatically

```bash
# Extract all GitHub URLs from awesome lists
grep -rohE 'https://github\.com/[^/]+/[^/)]+' submodules/mcp-directories/*/README.md | sort -u

# Extract with context (name + URL)
grep -E '\[.*\]\(https://github\.com' submodules/mcp-directories/*/README.md
```

---

## Directory Structure

```
submodules/mcp-directories/
├── README.md                           # This file
├── REGISTRY_INDEX.md                   # Unified deduplicated index
├── WEB_REGISTRIES.md                   # Web-based registry URLs
├── scripts/
│   ├── extract-urls.sh                 # Extract GitHub URLs
│   ├── deduplicate.py                  # Deduplicate entries
│   └── scrape-web-registries.py        # Scrape web registries
├── awesome-mcp-servers-punkpeye/       # Submodule
├── awesome-mcp-servers-appcypher/      # Submodule
├── awesome-mcp-servers-wong2/          # Submodule
├── toolsdk-mcp-registry/               # Submodule
├── awesome-ai-apps/                    # Submodule
└── mcp-official-servers/               # Submodule (official reference)
```

---

## Integration with MetaMCP

This directory library supports MetaMCP's MCP server discovery features:

1. **Auto-Discovery**: Parse submodules to discover available MCP servers
2. **Tool RAG Indexing**: Index server descriptions for semantic search
3. **Registry Sync**: Periodically sync with web registries
4. **Deduplication**: Unify entries across multiple sources

### Configuration

Add discovered servers to MetaMCP via:

```json
{
  "mcpServers": {
    "discovered-server": {
      "type": "STDIO",
      "command": "npx",
      "args": ["-y", "@discovered/mcp-server"]
    }
  }
}
```

---

## Contributing

To add a new directory source:

1. **Git Repository**: Add as submodule

   ```bash
   git submodule add https://github.com/org/repo submodules/mcp-directories/repo-name
   ```

2. **Web Registry**: Add to `WEB_REGISTRIES.md` with scraping instructions

3. **Update Index**: Run deduplication script
   ```bash
   python scripts/deduplicate.py
   ```

---

## License

This directory library is MIT licensed. Individual submodules retain their original licenses.

See each submodule's LICENSE file for specific terms.
