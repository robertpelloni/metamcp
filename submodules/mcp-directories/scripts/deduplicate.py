#!/usr/bin/env python3
"""
Deduplicate MCP server entries from multiple sources.

This script:
1. Reads URLs from all awesome-mcp-servers submodules
2. Normalizes GitHub URLs to canonical form
3. Merges metadata from multiple sources
4. Outputs a unified, deduplicated index
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MCPServer:
    """Represents an MCP server entry."""

    url: str
    name: str = ""
    description: str = ""
    categories: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    stars: Optional[int] = None

    def merge(self, other: "MCPServer") -> None:
        """Merge metadata from another entry for the same server."""
        if not self.name and other.name:
            self.name = other.name
        if not self.description and other.description:
            self.description = other.description
        if other.description and len(other.description) > len(self.description):
            self.description = other.description
        self.categories = list(set(self.categories + other.categories))
        self.sources = list(set(self.sources + other.sources))
        if other.stars and (not self.stars or other.stars > self.stars):
            self.stars = other.stars


def normalize_github_url(url: str) -> str:
    """Normalize GitHub URL to canonical form."""
    url = url.lower().strip().rstrip("/")

    # Remove common suffixes
    url = re.sub(r"\.git$", "", url)
    url = re.sub(r"\?.*$", "", url)
    url = re.sub(r"#.*$", "", url)
    url = re.sub(r"/tree/.*$", "", url)
    url = re.sub(r"/blob/.*$", "", url)
    url = re.sub(r"/issues.*$", "", url)
    url = re.sub(r"/pulls.*$", "", url)
    url = re.sub(r"/releases.*$", "", url)

    # Extract org/repo
    match = re.match(r"https://github\.com/([^/]+)/([^/]+)", url)
    if match:
        return f"https://github.com/{match.group(1)}/{match.group(2)}"
    return url


def extract_from_markdown(filepath: Path, source_name: str) -> list[MCPServer]:
    """Extract MCP server entries from a markdown file."""
    servers = []

    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Warning: Could not read {filepath}: {e}")
        return servers

    # Pattern for markdown links: [name](url) - description
    link_pattern = re.compile(
        r"\[([^\]]+)\]\((https://github\.com/[^)]+)\)(?:\s*[-–—:]\s*(.+?))?(?:\n|$)",
        re.IGNORECASE,
    )

    current_category = ""
    for line in content.split("\n"):
        # Track current heading as category
        heading_match = re.match(r"^#{1,3}\s+(.+)$", line)
        if heading_match:
            current_category = heading_match.group(1).strip()
            continue

        # Find GitHub links
        for match in link_pattern.finditer(line):
            name = match.group(1).strip()
            url = normalize_github_url(match.group(2))
            description = match.group(3).strip() if match.group(3) else ""

            # Skip non-MCP related URLs
            if "awesome" in url and "mcp" not in name.lower():
                continue

            server = MCPServer(
                url=url,
                name=name,
                description=description,
                categories=[current_category] if current_category else [],
                sources=[source_name],
            )
            servers.append(server)

    return servers


def deduplicate(servers: list[MCPServer]) -> dict[str, MCPServer]:
    """Deduplicate servers by URL, merging metadata."""
    unique: dict[str, MCPServer] = {}

    for server in servers:
        canonical_url = normalize_github_url(server.url)
        if canonical_url in unique:
            unique[canonical_url].merge(server)
        else:
            server.url = canonical_url
            unique[canonical_url] = server

    return unique


def generate_index(servers: dict[str, MCPServer], output_path: Path) -> None:
    """Generate markdown index from deduplicated servers."""
    # Group by first category
    by_category: dict[str, list[MCPServer]] = defaultdict(list)
    for server in servers.values():
        category = server.categories[0] if server.categories else "Uncategorized"
        by_category[category].append(server)

    lines = [
        "# Unified MCP Server Registry Index",
        "",
        f"**Total Servers**: {len(servers)}",
        f"**Categories**: {len(by_category)}",
        "",
        "---",
        "",
    ]

    # Table of contents
    lines.append("## Categories\n")
    for category in sorted(by_category.keys()):
        anchor = category.lower().replace(" ", "-").replace("/", "-")
        lines.append(f"- [{category}](#{anchor}) ({len(by_category[category])})")
    lines.append("")

    # Server listings by category
    for category in sorted(by_category.keys()):
        lines.append(f"\n## {category}\n")
        lines.append("| Server | Description | Sources |")
        lines.append("|--------|-------------|---------|")

        for server in sorted(by_category[category], key=lambda s: s.name.lower()):
            sources = ", ".join(server.sources[:3])
            desc = (
                server.description[:80] + "..."
                if len(server.description) > 80
                else server.description
            )
            desc = desc.replace("|", "\\|").replace("\n", " ")
            lines.append(f"| [{server.name}]({server.url}) | {desc} | {sources} |")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated index: {output_path}")


def main():
    script_dir = Path(__file__).parent
    mcp_dirs = script_dir.parent

    print("Scanning MCP directory submodules...")

    all_servers: list[MCPServer] = []

    # Scan each submodule
    for subdir in mcp_dirs.iterdir():
        if not subdir.is_dir() or subdir.name == "scripts":
            continue

        readme = subdir / "README.md"
        if not readme.exists():
            readme = subdir / "readme.md"

        if readme.exists():
            print(f"  Processing: {subdir.name}")
            servers = extract_from_markdown(readme, subdir.name)
            all_servers.extend(servers)
            print(f"    Found {len(servers)} entries")

    print(f"\nTotal entries before deduplication: {len(all_servers)}")

    # Deduplicate
    unique = deduplicate(all_servers)
    print(f"Unique servers after deduplication: {len(unique)}")

    # Generate outputs
    output_dir = mcp_dirs

    # Markdown index
    generate_index(unique, output_dir / "REGISTRY_INDEX.md")

    # JSON export
    json_output = output_dir / "registry.json"
    json_data = {
        url: {
            "name": s.name,
            "description": s.description,
            "categories": s.categories,
            "sources": s.sources,
        }
        for url, s in unique.items()
    }
    json_output.write_text(json.dumps(json_data, indent=2), encoding="utf-8")
    print(f"Generated JSON: {json_output}")

    print("\nDone!")


if __name__ == "__main__":
    main()
