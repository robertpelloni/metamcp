# Web-Based MCP Registries

**URLs and scraping information for web-based MCP server registries that cannot be added as git submodules.**

---

## Active Registries

### PulseMCP

- **URL**: https://www.pulsemcp.com/servers
- **Type**: Directory/Discovery
- **API**: Unknown (scrape HTML)
- **Update Frequency**: Daily
- **Features**: Real-time discovery, popularity ranking, categories

### Playbooks MCP

- **URL**: https://playbooks.com/mcp/
- **Type**: Integration Platform
- **API**: Unknown
- **Update Frequency**: Weekly
- **Features**: Playbook integrations, workflow templates

### Docker Hub MCP

- **URL**: https://hub.docker.com/search?q=mcp
- **Type**: Container Registry
- **API**: Docker Hub API v2
- **Update Frequency**: Continuous
- **Features**: Docker images, pull counts, verified publishers
- **API Endpoint**: `https://hub.docker.com/v2/search/repositories/?query=mcp`

### Enact Tools

- **URL**: https://enact.tools/
- **Type**: Tool Platform
- **API**: Unknown
- **Update Frequency**: Weekly
- **Features**: Tool execution, sandboxing

### Smithery

- **URL**: https://smithery.ai/servers
- **Type**: Marketplace
- **API**: REST API available
- **Update Frequency**: Daily
- **Features**: Hosted MCP servers, one-click deployment, usage analytics

### MCP.run

- **URL**: https://mcp.run/
- **Type**: Hosting Platform
- **API**: REST API
- **Update Frequency**: Daily
- **Features**: Server hosting, instant deployment

### Glama AI

- **URL**: https://glama.ai/mcp/servers
- **Type**: Directory
- **API**: Unknown
- **Update Frequency**: Weekly
- **Features**: Server discovery, ratings

### MCPHub

- **URL**: https://mcphubx.com/
- **Type**: Hub/Gateway
- **API**: REST API
- **Update Frequency**: Daily
- **Features**: Multi-server management, vector search routing

### Plugged.in

- **URL**: https://plugged.in/library
- **Type**: Enterprise Hub
- **API**: REST API
- **Update Frequency**: Daily
- **Features**: RAG v2, AI attribution, enterprise features

### DXT.so Funnel MCP

- **URL**: https://dxt.so/mcp-server/developer-tools/funnel-mcp
- **Type**: Tool Directory
- **API**: Unknown
- **Update Frequency**: Weekly
- **Features**: Developer tool MCPs

---

## Scraping Scripts

### Docker Hub API Example

```bash
# Search MCP repositories on Docker Hub
curl -s "https://hub.docker.com/v2/search/repositories/?query=mcp&page_size=100" | jq '.results[] | {name: .repo_name, stars: .star_count, pulls: .pull_count}'
```

### Generic HTML Scraper

```python
#!/usr/bin/env python3
"""
Scrape MCP servers from web registries.
"""
import requests
from bs4 import BeautifulSoup
import json
import re

REGISTRIES = {
    "pulsemcp": "https://www.pulsemcp.com/servers",
    "smithery": "https://smithery.ai/servers",
    "glama": "https://glama.ai/mcp/servers",
}

def scrape_github_urls(url: str) -> list[str]:
    """Extract GitHub URLs from a webpage."""
    response = requests.get(url, timeout=30)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all GitHub links
    github_pattern = re.compile(r'https://github\.com/[^/]+/[^/"\'>\s]+')
    urls = set()

    for link in soup.find_all('a', href=True):
        if 'github.com' in link['href']:
            match = github_pattern.search(link['href'])
            if match:
                urls.add(match.group())

    return sorted(urls)

if __name__ == "__main__":
    all_urls = {}
    for name, url in REGISTRIES.items():
        try:
            urls = scrape_github_urls(url)
            all_urls[name] = urls
            print(f"{name}: {len(urls)} URLs found")
        except Exception as e:
            print(f"{name}: Error - {e}")

    with open("scraped_urls.json", "w") as f:
        json.dump(all_urls, f, indent=2)
```

---

## Integration Notes

### Deduplication Strategy

When merging URLs from multiple sources:

1. **Normalize GitHub URLs**: Remove trailing slashes, `.git` suffix, query params
2. **Canonical Form**: `https://github.com/{owner}/{repo}` (lowercase)
3. **Merge Metadata**: Combine star counts, descriptions from multiple sources
4. **Priority Order**: Official > High-star awesome lists > Web registries

### Example Deduplication

```python
def normalize_github_url(url: str) -> str:
    """Normalize GitHub URL to canonical form."""
    url = url.lower().rstrip('/')
    url = re.sub(r'\.git$', '', url)
    url = re.sub(r'\?.*$', '', url)
    url = re.sub(r'#.*$', '', url)

    match = re.match(r'https://github\.com/([^/]+)/([^/]+)', url)
    if match:
        return f"https://github.com/{match.group(1)}/{match.group(2)}"
    return url
```

---

## Update Schedule

| Registry   | Scrape Frequency | Last Updated |
| ---------- | ---------------- | ------------ |
| PulseMCP   | Weekly           | -            |
| Docker Hub | Weekly           | -            |
| Smithery   | Weekly           | -            |
| Glama      | Bi-weekly        | -            |
| MCPHub     | Weekly           | -            |
| Plugged.in | Weekly           | -            |

---

## Adding New Registries

To add a new web registry:

1. Add entry to this file with URL, API info, and scraping notes
2. Update `scripts/scrape-web-registries.py` with new source
3. Test scraping and verify URL extraction
4. Run deduplication against existing index
