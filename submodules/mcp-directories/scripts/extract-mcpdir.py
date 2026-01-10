#!/usr/bin/env python3
"""
Extract MCP server entries from mcpdir (eL1fe/mcpdir) submodule.

mcpdir aggregates 8000+ MCP servers from multiple sources:
- MCP Registry
- npm packages
- GitHub repositories
- Glama
- PulseMCP

This script extracts the structured JSON data and merges it into our unified index.
"""

import json
import re
from pathlib import Path
from typing import Optional


def normalize_github_url(url: str) -> Optional[str]:
    if not url:
        return None

    url = url.lower().strip().rstrip("/")
    url = re.sub(r"\.git$", "", url)
    url = re.sub(r"\?.*$", "", url)
    url = re.sub(r"#.*$", "", url)
    url = re.sub(r"/tree/.*$", "", url)
    url = re.sub(r"/blob/.*$", "", url)
    url = re.sub(r"/issues.*$", "", url)
    url = re.sub(r"/pulls.*$", "", url)
    url = re.sub(r"/releases.*$", "", url)

    match = re.match(r"https://github\.com/([^/]+)/([^/]+)", url)
    if match:
        return f"https://github.com/{match.group(1)}/{match.group(2)}"
    return None


def extract_mcpdir_servers(mcpdir_path: Path) -> list[dict]:
    servers = []
    pulsemcp_file = mcpdir_path / "data" / "pulsemcp-slugs.json"

    if pulsemcp_file.exists():
        print(f"  Reading: {pulsemcp_file}")
        try:
            data = json.loads(pulsemcp_file.read_text(encoding="utf-8"))

            for entry in data:
                github_url = normalize_github_url(entry.get("githubUrl", ""))
                classification = entry.get("classification", "").lower()

                category = "Community Servers"
                if classification == "official":
                    category = "Official Servers"
                elif classification == "reference":
                    category = "Reference Implementations"

                server = {
                    "url": github_url or entry.get("providerUrl", ""),
                    "name": entry.get("name", entry.get("slug", "")),
                    "description": entry.get("description", ""),
                    "categories": [category],
                    "sources": ["mcpdir"],
                    "stars": entry.get("starsCount"),
                    "classification": classification or "community",
                    "provider": entry.get("provider", ""),
                    "slug": entry.get("slug", ""),
                }

                if server["url"]:
                    servers.append(server)

            print(f"    Extracted {len(servers)} servers from pulsemcp-slugs.json")

        except Exception as e:
            print(f"    Error reading {pulsemcp_file}: {e}")

    return servers


def generate_mcpdir_index(servers: list[dict], output_path: Path) -> None:
    by_classification: dict[str, list[dict]] = {
        "Official Servers": [],
        "Reference Implementations": [],
        "Community Servers": [],
    }

    for server in servers:
        category = (
            server["categories"][0] if server["categories"] else "Community Servers"
        )
        if category not in by_classification:
            by_classification[category] = []
        by_classification[category].append(server)

    lines = [
        "# mcpdir Server Index",
        "",
        f"**Source**: [mcpdir.dev](https://mcpdir.dev) ([GitHub](https://github.com/eL1fe/mcpdir))",
        f"**Total Servers**: {len(servers)}",
        "",
        "This index is auto-generated from the mcpdir submodule data.",
        "",
        "---",
        "",
        "## Statistics\n",
    ]

    for category, items in sorted(by_classification.items()):
        lines.append(f"- **{category}**: {len(items)}")
    lines.append("")

    starred = [s for s in servers if s.get("stars")]
    starred.sort(key=lambda x: x.get("stars", 0), reverse=True)

    if starred:
        lines.append("## Top Servers by Stars\n")
        lines.append("| Server | Stars | Description |")
        lines.append("|--------|-------|-------------|")

        for server in starred[:50]:
            name = server["name"]
            url = server["url"]
            stars = server.get("stars", 0)
            desc = (
                server["description"][:60] + "..."
                if len(server["description"]) > 60
                else server["description"]
            )
            desc = desc.replace("|", "\\|").replace("\n", " ")

            if url.startswith("https://"):
                lines.append(f"| [{name}]({url}) | {stars:,} | {desc} |")
            else:
                lines.append(f"| {name} | {stars:,} | {desc} |")

        lines.append("")

    for category in [
        "Official Servers",
        "Reference Implementations",
        "Community Servers",
    ]:
        items = by_classification.get(category, [])
        if not items:
            continue

        lines.append(f"\n## {category}\n")
        lines.append("| Server | Stars | Provider | Description |")
        lines.append("|--------|-------|----------|-------------|")

        items.sort(key=lambda x: (-(x.get("stars") or 0), x["name"].lower()))

        for server in items:
            name = server["name"]
            url = server["url"]
            stars = server.get("stars", 0) or "-"
            provider = server.get("provider", "-") or "-"
            desc = (
                server["description"][:50] + "..."
                if len(server["description"]) > 50
                else server["description"]
            )
            desc = desc.replace("|", "\\|").replace("\n", " ")

            if url.startswith("https://"):
                lines.append(f"| [{name}]({url}) | {stars} | {provider} | {desc} |")
            else:
                lines.append(f"| {name} | {stars} | {provider} | {desc} |")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated mcpdir index: {output_path}")


def main():
    script_dir = Path(__file__).parent
    mcp_dirs = script_dir.parent
    root_submodules = mcp_dirs.parent
    mcpdir_path = root_submodules / "mcpdir"

    if not mcpdir_path.exists():
        print(f"Error: mcpdir not found at {mcpdir_path}")
        print(
            "Run: git submodule add https://github.com/eL1fe/mcpdir.git submodules/mcpdir"
        )
        return

    print(f"Extracting from mcpdir: {mcpdir_path}")

    servers = extract_mcpdir_servers(mcpdir_path)

    if servers:
        output_path = mcp_dirs / "MCPDIR_INDEX.md"
        generate_mcpdir_index(servers, output_path)

        json_path = mcp_dirs / "mcpdir-servers.json"
        json_data = {
            "source": "mcpdir",
            "count": len(servers),
            "servers": servers,
        }
        json_path.write_text(json.dumps(json_data, indent=2), encoding="utf-8")
        print(f"Generated JSON: {json_path}")

    print(f"\nExtracted {len(servers)} servers from mcpdir")


if __name__ == "__main__":
    main()
