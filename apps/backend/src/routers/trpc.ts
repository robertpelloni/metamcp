import { createAppRouter } from "@repo/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { createContext } from "../trpc";
import { apiKeysImplementations } from "../trpc/api-keys.impl";
import { autoDiscoveryImplementations } from "../trpc/auto-discovery.impl";
import { autoReconnectImplementations } from "../trpc/auto-reconnect.impl";
import { configImplementations } from "../trpc/config.impl";
import { endpointsImplementations } from "../trpc/endpoints.impl";
import { logsImplementations } from "../trpc/logs.impl";
import { mcpServersImplementations } from "../trpc/mcp-servers.impl";
import { namespacesImplementations } from "../trpc/namespaces.impl";
import { oauthImplementations } from "../trpc/oauth.impl";
import { savedScriptsImplementations } from "../trpc/saved-scripts.impl";
import { serverHealthImplementations } from "../trpc/server-health.impl";
import { toolSetsImplementations } from "../trpc/tool-sets.impl";
import { toolsImplementations } from "../trpc/tools.impl";
import { policiesImplementations } from "../trpc/policies.impl";
import { agentImplementations } from "../trpc/agent.impl";
import { analyticsImplementations } from "../trpc/analytics.impl";
import { memoriesImplementations } from "../trpc/memories.impl";
import { registryImplementations } from "../trpc/registry.impl";
import { systemImplementations } from "../trpc/system.impl";

// Create the app router with implementations
const appRouter = createAppRouter({
  frontend: {
    mcpServers: mcpServersImplementations,
    namespaces: namespacesImplementations,
    endpoints: endpointsImplementations,
    oauth: oauthImplementations,
    tools: toolsImplementations,
    apiKeys: apiKeysImplementations,
    autoDiscovery: autoDiscoveryImplementations,
    autoReconnect: autoReconnectImplementations,
    config: configImplementations,
    logs: logsImplementations,
    savedScripts: savedScriptsImplementations,
    serverHealth: serverHealthImplementations,
    toolSets: toolSetsImplementations,
    policies: policiesImplementations,
    agent: agentImplementations,
    memories: memoriesImplementations,
    registry: registryImplementations,
    analytics: analyticsImplementations,
    system: systemImplementations,
  },
});

// Export the router type for client usage
export type AppRouter = typeof appRouter;

// Create Express router
const trpcRouter = express.Router();

// Apply security middleware for frontend communication
trpcRouter.use(helmet());
trpcRouter.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  }),
);

// Better-auth integration now handled in tRPC context

// Mount tRPC handler
trpcRouter.use(
  "/frontend",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default trpcRouter;
