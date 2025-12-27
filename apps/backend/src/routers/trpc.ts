import { createAppRouter } from "@repo/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { createContext } from "../trpc";
import { apiKeysImplementations } from "../trpc/api-keys.impl";
import { configImplementations } from "../trpc/config.impl";
import { endpointsImplementations } from "../trpc/endpoints.impl";
import { logsImplementations } from "../trpc/logs.impl";
import { mcpServersImplementations } from "../trpc/mcp-servers.impl";
import { namespacesImplementations } from "../trpc/namespaces.impl";
import { oauthImplementations } from "../trpc/oauth.impl";
import { savedScriptsImplementations } from "../trpc/saved-scripts.impl";
import { toolSetsImplementations } from "../trpc/tool-sets.impl";
import { toolsImplementations } from "../trpc/tools.impl";
import { agentImplementations } from "../trpc/impl/agent.impl";
import { policiesImplementations } from "../trpc/impl/policies.impl";
import { memoriesImplementations } from "../trpc/impl/memories.impl";
import { schedulerImplementations } from "../trpc/impl/scheduler.impl";
import { notificationsImplementations } from "../trpc/impl/notifications.impl";

// Create the app router with implementations
const appRouter = createAppRouter({
  frontend: {
    mcpServers: mcpServersImplementations,
    namespaces: namespacesImplementations,
    endpoints: endpointsImplementations,
    oauth: oauthImplementations,
    tools: toolsImplementations,
    apiKeys: apiKeysImplementations,
    config: configImplementations,
    logs: logsImplementations,
    savedScripts: savedScriptsImplementations,
    toolSets: toolSetsImplementations,
    agent: agentImplementations,
    policies: policiesImplementations,
    memories: memoriesImplementations,
    scheduler: schedulerImplementations,
    notifications: notificationsImplementations,
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

// Mount tRPC handler
trpcRouter.use(
  "/frontend",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default trpcRouter;
