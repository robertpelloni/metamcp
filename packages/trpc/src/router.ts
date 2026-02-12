import { createFrontendRouter } from "./routers/frontend";
import { router } from "./trpc";

export const createAppRouter = (implementations: {
  frontend: Parameters<typeof createFrontendRouter>[0];
}) => {
  const frontendRouters = createFrontendRouter(implementations.frontend);

  return router({
    frontend: router({
      mcpServers: frontendRouters.mcpServers,
      namespaces: frontendRouters.namespaces,
      endpoints: frontendRouters.endpoints,
      oauth: frontendRouters.oauth,
      tools: frontendRouters.tools,
      apiKeys: frontendRouters.apiKeys,
      autoDiscovery: frontendRouters.autoDiscovery,
      autoReconnect: frontendRouters.autoReconnect,
      config: frontendRouters.config,
      logs: frontendRouters.logs,
      savedScripts: frontendRouters.savedScripts,
      serverHealth: frontendRouters.serverHealth,
      toolSets: frontendRouters.toolSets,
      policies: frontendRouters.policies,
      agent: frontendRouters.agent,
      memories: frontendRouters.memories,
      registry: frontendRouters.registry,
      analytics: frontendRouters.analytics,
      system: frontendRouters.system,
      audit: frontendRouters.audit,
    }),
  });
};

export type AppRouter = ReturnType<typeof createAppRouter>;

// Export types for the router
export type { BaseContext } from "./trpc";
export { createFrontendRouter } from "./routers/frontend";
