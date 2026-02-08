import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
<<<<<<< HEAD
<<<<<<< HEAD
import { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
=======
>>>>>>> origin/docker-in-docker
=======
>>>>>>> origin/docker-per-mcp
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { ServerParameters } from "@repo/zod-types";

<<<<<<< HEAD
<<<<<<< HEAD
import logger from "@/utils/logger";

import { ProcessManagedStdioTransport } from "../stdio-transport/process-managed-transport";
=======
import { dockerManager } from "./docker-manager/index.js";
>>>>>>> origin/docker-in-docker
import { metamcpLogStore } from "./log-store";
import { serverErrorTracker } from "./server-error-tracker";
import { resolveEnvVariables } from "./utils";
=======
import { dockerManager } from "./docker-manager/index.js";
import { metamcpLogStore } from "./log-store";
>>>>>>> origin/docker-per-mcp

const sleep = (time: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export interface ConnectedClient {
  client: Client;
  cleanup: () => Promise<void>;
<<<<<<< HEAD
  onProcessCrash?: (exitCode: number | null, signal: string | null) => void;
=======
  serverUuid: string;
>>>>>>> origin/docker-in-docker
}

/**
 * Transforms localhost URLs to use host.docker.internal when running inside Docker
 */
export const transformDockerUrl = (url: string): string => {
  if (process.env.TRANSFORM_LOCALHOST_TO_DOCKER_INTERNAL === "true") {
    const transformed = url.replace(
      /localhost|127\.0\.0\.1/g,
      "host.docker.internal",
    );
    return transformed;
  }
  return url;
};

/**
 * Handles Docker container URLs for internal networking
 */
export const handleDockerContainerUrl = (url: string): string => {
  // If the URL is already an internal container URL (contains container name), use it as-is
  // Handle both old naming convention (metamcp-stdio-server-) and new naming convention (mcp-stdio-)
  if (url.includes("metamcp-stdio-server-") || url.includes("mcp-stdio-")) {
    return url;
  }

  // Otherwise, apply the standard transformation for external URLs
  return transformDockerUrl(url);
};

/**
 * Creates a client for an MCP server based on its type
 */
export const createMetaMcpClient = async (
  serverUuid: string,
  serverParams: ServerParameters,
): Promise<{
  client: Client | undefined;
  transport: Transport | undefined;
}> => {
  let transport: Transport | undefined;

  // For STDIO servers, use Docker container URL
  if (!serverParams.type || serverParams.type === "STDIO") {
<<<<<<< HEAD
<<<<<<< HEAD
    // Resolve environment variable placeholders
    const resolvedEnv = serverParams.env
      ? resolveEnvVariables(serverParams.env)
      : undefined;

    const stdioParams: StdioServerParameters = {
      command: serverParams.command || "",
      args: serverParams.args || undefined,
      env: resolvedEnv,
      stderr: "pipe",
    };
    transport = new ProcessManagedStdioTransport(stdioParams);

    // Handle stderr stream when set to "pipe"
    if ((transport as ProcessManagedStdioTransport).stderr) {
      const stderrStream = (transport as ProcessManagedStdioTransport).stderr;

      stderrStream?.on("data", (chunk: Buffer) => {
        metamcpLogStore.addLog(
          serverParams.name,
          "error",
          chunk.toString().trim(),
=======
=======
>>>>>>> origin/docker-per-mcp
    let dockerUrl = await dockerManager.getServerUrl(serverUuid);

    // If container doesn't exist, create it
    if (!dockerUrl) {
      try {
        const dockerServer = await dockerManager.createContainer(
          serverUuid,
          serverParams,
<<<<<<< HEAD
>>>>>>> origin/docker-in-docker
=======
>>>>>>> origin/docker-per-mcp
        );
        dockerUrl = dockerServer.url;
      } catch (error) {
        metamcpLogStore.addLog(
          serverParams.name,
          "error",
          `Failed to create Docker container for stdio server: ${serverUuid}`,
          error,
        );
        return { client: undefined, transport: undefined };
      }
    }

    // Use SSE for Docker containers
    // Transform localhost to host.docker.internal for Docker container access
    const transformedDockerUrl = handleDockerContainerUrl(dockerUrl);
    transport = new SSEClientTransport(new URL(transformedDockerUrl));
    console.log(`Using Docker container URL: ${dockerUrl}`);
    console.log(`Connecting to MCP server ${serverUuid} at ${dockerUrl}`);
  } else if (serverParams.type === "SSE" && serverParams.url) {
    // Transform the URL if TRANSFORM_LOCALHOST_TO_DOCKER_INTERNAL is set to "true"
    const transformedUrl = handleDockerContainerUrl(serverParams.url);

    // Build headers: start with custom headers, then add auth header
    const headers: Record<string, string> = {
      ...(serverParams.headers || {}),
    };

    // Check for authentication - prioritize OAuth tokens, fallback to bearerToken
    const authToken =
      serverParams.oauth_tokens?.access_token || serverParams.bearerToken;
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const hasHeaders = Object.keys(headers).length > 0;

    if (!hasHeaders) {
      transport = new SSEClientTransport(new URL(transformedUrl));
    } else {
      transport = new SSEClientTransport(new URL(transformedUrl), {
        requestInit: {
          headers,
        },
        eventSourceInit: {
          fetch: (url, init) => fetch(url, { ...init, headers }),
        },
      });
    }
  } else if (serverParams.type === "STREAMABLE_HTTP" && serverParams.url) {
    // Transform the URL if TRANSFORM_LOCALHOST_TO_DOCKER_INTERNAL is set to "true"
    const transformedUrl = handleDockerContainerUrl(serverParams.url);

    // Build headers: start with custom headers, then add auth header
    const headers: Record<string, string> = {
      ...(serverParams.headers || {}),
    };

    // Check for authentication - prioritize OAuth tokens, fallback to bearerToken
    const authToken =
      serverParams.oauth_tokens?.access_token || serverParams.bearerToken;
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const hasHeaders = Object.keys(headers).length > 0;

    if (!hasHeaders) {
      transport = new StreamableHTTPClientTransport(new URL(transformedUrl));
    } else {
      transport = new StreamableHTTPClientTransport(new URL(transformedUrl), {
        requestInit: {
          headers,
        },
      });
    }
  } else {
    metamcpLogStore.addLog(
      serverParams.name,
      "error",
      `Unsupported server type: ${serverParams.type}`,
    );
    return { client: undefined, transport: undefined };
  }

  const client = new Client(
    {
      name: "metamcp-client",
      version: "2.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {},
      },
    },
  );
  return { client, transport };
};

/**
 * Connect to an MCP server without session management
 */
export const connectMetaMcpClient = async (
  serverUuid: string,
  serverParams: ServerParameters,
  onProcessCrash?: (exitCode: number | null, signal: string | null) => void,
): Promise<ConnectedClient | undefined> => {
<<<<<<< HEAD
  const waitFor = 5000;

  // Get max attempts from server error tracker instead of hardcoding
  const maxAttempts = await serverErrorTracker.getServerMaxAttempts(
    serverParams.uuid,
  );
=======
  const waitFor = 1000;
  const retries = 1;
>>>>>>> origin/docker-in-docker
  let count = 0;
  let retry = true;

  logger.info(
    `Connecting to server ${serverParams.name} (${serverParams.uuid}) with max attempts: ${maxAttempts}`,
  );

  while (retry) {
    let transport: Transport | undefined;
    let client: Client | undefined;

    try {
      // Check if server is already in error state before attempting connection
      const isInErrorState = await serverErrorTracker.isServerInErrorState(
        serverParams.uuid,
      );
      if (isInErrorState) {
        logger.info(
          `Server ${serverParams.name} (${serverParams.uuid}) is already in ERROR state, skipping connection attempt`,
        );
        return undefined;
      }

      // Create fresh client and transport for each attempt
<<<<<<< HEAD
      const result = createMetaMcpClient(serverParams);
      client = result.client;
      transport = result.transport;

=======
      const { client, transport } = await createMetaMcpClient(
        serverUuid,
        serverParams,
      );
>>>>>>> origin/docker-in-docker
      if (!client || !transport) {
        return undefined;
      }

      // Set up process crash detection for STDIO transports BEFORE connecting
      if (transport instanceof ProcessManagedStdioTransport) {
        logger.info(
          `Setting up crash handler for server ${serverParams.name} (${serverParams.uuid})`,
        );
        transport.onprocesscrash = (exitCode, signal) => {
          logger.info(
            `Process crashed for server ${serverParams.name} (${serverParams.uuid}): code=${exitCode}, signal=${signal}`,
          );

          // Notify the pool about the crash
          if (onProcessCrash) {
            logger.info(
              `Calling onProcessCrash callback for server ${serverParams.name} (${serverParams.uuid})`,
            );
            onProcessCrash(exitCode, signal);
          } else {
            logger.info(
              `No onProcessCrash callback provided for server ${serverParams.name} (${serverParams.uuid})`,
            );
          }
        };
      }

      await client.connect(transport);

      return {
        client,
        serverUuid,
        cleanup: async () => {
          await transport!.close();
          await client!.close();
        },
        onProcessCrash: (exitCode, signal) => {
          logger.warn(
            `Process crash detected for server ${serverParams.name} (${serverParams.uuid}): code=${exitCode}, signal=${signal}`,
          );

          // Notify the pool about the crash
          if (onProcessCrash) {
            onProcessCrash(exitCode, signal);
          }
        },
      };
    } catch (error) {
      metamcpLogStore.addLog(
        serverParams.name,
        "error",
<<<<<<< HEAD
        `Error connecting to MetaMCP client (attempt ${count + 1}/${maxAttempts})`,
=======
        `Error connecting to MCP client (attempt ${count + 1}/${retries})`,
>>>>>>> origin/docker-in-docker
        error,
      );

      // CRITICAL FIX: Clean up transport/process on connection failure
      // This prevents orphaned processes from accumulating
      if (transport) {
        try {
          await transport.close();
          console.log(
            `Cleaned up transport for failed connection to ${serverParams.name} (${serverParams.uuid})`,
          );
        } catch (cleanupError) {
          console.error(
            `Error cleaning up transport for ${serverParams.name} (${serverParams.uuid}):`,
            cleanupError,
          );
        }
      }
      if (client) {
        try {
          await client.close();
        } catch (cleanupError) {
          // Client may not be fully initialized, ignore
        }
      }

      count++;
      retry = count < maxAttempts;
      if (retry) {
        await sleep(waitFor);
      }
    }
  }

  return undefined;
};
