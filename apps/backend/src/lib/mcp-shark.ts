import fs from "node:fs/promises";
import { db } from "../db";
import { mcpServersTable } from "../db/schema";

const MCP_SHARK_CONFIG_PATH = "/mnt/mcpshark/mcp_config.json";
const MCP_SHARK_API_URL = "http://mcp-shark-dev:9853";

export async function syncMcpSharkConfig() {
  try {
    const servers = await db.select().from(mcpServersTable);

    const mcpServers: Record<string, any> = {};

    for (const server of servers) {
      if (server.type === "STDIO") {
        // Only include STDIO servers if we think they can run in mcp-shark container
        // For now, we include them, but they might fail.
        mcpServers[server.name] = {
          command: server.command,
          args: server.args,
          env: server.env,
        };
      } else if (server.type === "SSE" && server.url) {
        mcpServers[server.name] = {
          url: server.url,
        };
      }
    }

    const config = {
      mcpServers,
    };

    // Ensure directory exists
    try {
        await fs.mkdir("/mnt/mcpshark", { recursive: true });
    } catch (e) {
        // Ignore if exists or permission error (volume mount should exist)
    }

    await fs.writeFile(MCP_SHARK_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`Wrote MCP Shark config to ${MCP_SHARK_CONFIG_PATH}`);

    // Trigger reload
    await reloadMcpShark();
  } catch (error) {
    console.error("Failed to sync MCP Shark config:", error);
  }
}

async function reloadMcpShark() {
  try {
    // The path sent to API must be the path INSIDE the mcp-shark container
    // We mounted mcpshark_data_dev to /root/.mcp-shark in mcp-shark container
    // And to /mnt/mcpshark in app container.
    // So the file we wrote to /mnt/mcpshark/mcp_config.json is at /root/.mcp-shark/mcp_config.json in mcp-shark container.

    const configPathInContainer = "/root/.mcp-shark/mcp_config.json";

    const response = await fetch(`${MCP_SHARK_API_URL}/api/composite/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath: configPathInContainer,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP Shark API error: ${response.status} ${text}`);
    }

    console.log("MCP Shark reloaded successfully");
  } catch (error) {
    console.error("Failed to reload MCP Shark:", error);
  }
}
