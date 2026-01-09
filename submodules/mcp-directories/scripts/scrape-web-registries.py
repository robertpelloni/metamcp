#!/usr/bin/env python3
"""
Scrape MCP servers from web-based registries.

This script scrapes MCP server listings from web registries that
cannot be added as git submodules.
"""

import os
import re
import json
import time
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Required packages: pip install requests beautifulsoup4")
    exit(1)


@dataclass
class ScrapedServer:
    """Represents a scraped MCP server entry."""

    url: str
    name: str
    description: str = ""
    source: str = ""
    scraped_at: str = ""


# Web registries to scrape
REGISTRIES = {
    "pulsemcp": {
        "url": "https://www.pulsemcp.com/servers",
        "type": "html",
    },
    "smithery": {
        "url": "https://smithery.ai/servers",
        "type": "html",
    },
    "glama": {
        "url": "https://glama.ai/mcp/servers",
        "type": "html",
    },
    "docker_hub": {
        "url": "https://hub.docker.com/v2/search/repositories/?query=mcp&page_size=100",
        "type": "json",
    },
}


def normalize_github_url(url: str) -> Optional[str]:
    """Normalize GitHub URL to canonical form."""
    url = url.lower().strip().rstrip("/")
    url = re.sub(r"\.git$", "", url)
    url = re.sub(r"\?.*$", "", url)
    url = re.sub(r"#.*$", "", url)

    match = re.match(r"https://github\.com/([^/]+)/([^/]+)", url)
    if match:
        return f"https://github.com/{match.group(1)}/{match.group(2)}"
    return None


def scrape_html_registry(name: str, url: str) -> list[ScrapedServer]:
    """Scrape GitHub URLs from an HTML page."""
    servers = []

    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; MCPDirectoryBot/1.0)"}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Find all GitHub links
        github_pattern = re.compile(r'https://github\.com/[^/]+/[^/"\'>\s]+')
        seen_urls = set()

        for link in soup.find_all("a", href=True):
            href = link["href"]

            # Handle relative URLs
            if href.startswith("/"):
                href = urljoin(url, href)

            if "github.com" in href:
                normalized = normalize_github_url(href)
                if normalized and normalized not in seen_urls:
                    seen_urls.add(normalized)

                    # Try to get name from link text
                    name_text = link.get_text(strip=True) or normalized.split("/")[-1]

                    servers.append(
                        ScrapedServer(
                            url=normalized,
                            name=name_text,
                            source=name,
                            scraped_at=time.strftime("%Y-%m-%d %H:%M:%S"),
                        )
                    )

        print(f"  {name}: Found {len(servers)} GitHub URLs")

    except Exception as e:
        print(f"  {name}: Error - {e}")

    return servers


def scrape_docker_hub(name: str, url: str) -> list[ScrapedServer]:
    """Scrape MCP-related repositories from Docker Hub API."""
    servers = []

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        for result in data.get("results", []):
            repo_name = result.get("repo_name", "")

            # Only include MCP-related repos
            if (
                "mcp" in repo_name.lower()
                or "mcp" in result.get("short_description", "").lower()
            ):
                servers.append(
                    ScrapedServer(
                        url=f"https://hub.docker.com/r/{repo_name}",
                        name=repo_name,
                        description=result.get("short_description", ""),
                        source=name,
                        scraped_at=time.strftime("%Y-%m-%d %H:%M:%S"),
                    )
                )

        print(f"  {name}: Found {len(servers)} Docker images")

    except Exception as e:
        print(f"  {name}: Error - {e}")

    return servers


def main():
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent

    print("Scraping web-based MCP registries...\n")

    all_servers: list[ScrapedServer] = []

    for name, config in REGISTRIES.items():
        print(f"Scraping {name}...")

        if config["type"] == "html":
            servers = scrape_html_registry(name, config["url"])
        elif config["type"] == "json" and "docker" in name:
            servers = scrape_docker_hub(name, config["url"])
        else:
            print(f"  {name}: Unknown type {config['type']}")
            continue

        all_servers.extend(servers)

        # Rate limiting
        time.sleep(1)

    print(f"\nTotal scraped entries: {len(all_servers)}")

    # Save results
    output_file = output_dir / "scraped_web_registries.json"
    output_data = {
        "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_entries": len(all_servers),
        "servers": [asdict(s) for s in all_servers],
    }

    output_file.write_text(json.dumps(output_data, indent=2), encoding="utf-8")
    print(f"Saved to: {output_file}")

    # Also save URL-only list for quick reference
    urls_file = output_dir / "scraped_urls.txt"
    urls = sorted(set(s.url for s in all_servers))
    urls_file.write_text("\n".join(urls), encoding="utf-8")
    print(f"URL list: {urls_file}")

    print("\nDone!")


if __name__ == "__main__":
    main()
