#!/bin/bash
# Extract GitHub URLs from MCP directory submodules
# Usage: ./extract-urls.sh [output_file]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIRS="$SCRIPT_DIR/.."
OUTPUT_FILE="${1:-$SCRIPT_DIR/../extracted_urls.txt}"

echo "Extracting GitHub URLs from MCP directory submodules..."
echo "Output: $OUTPUT_FILE"
echo ""

# Find all README files in submodules and extract GitHub URLs
find "$MCP_DIRS" -maxdepth 2 -name "README.md" -o -name "readme.md" | while read -r readme; do
    if [[ -f "$readme" ]]; then
        # Extract GitHub URLs (org/repo format)
        grep -oE 'https://github\.com/[^/]+/[^/)"\s>]+' "$readme" 2>/dev/null || true
    fi
done | sort -u > "$OUTPUT_FILE"

# Count results
URL_COUNT=$(wc -l < "$OUTPUT_FILE")
echo "Extracted $URL_COUNT unique GitHub URLs"
echo ""

# Show sample
echo "Sample URLs:"
head -20 "$OUTPUT_FILE"

echo ""
echo "Full list saved to: $OUTPUT_FILE"
