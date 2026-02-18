import { createApiKeysRouter } from "./api-keys";
import { createConfigRouter } from "./config";
import { createEndpointsRouter } from "./endpoints";
import { createLogsRouter } from "./logs";
import { createMcpServersRouter } from "./mcp-servers";
import { createNamespacesRouter } from "./namespaces";
import { createOAuthRouter } from "./oauth";
import { createSavedScriptsRouter } from "./saved-scripts";
import { createToolSetsRouter } from "./tool-sets";
import { createToolsRouter } from "./tools";
import { createPoliciesRouter } from "./policies";
import { createAgentRouter } from "./agent";
import { createServerHealthRouter } from "./server-health";
import { createAnalyticsRouter } from "./analytics";
import { createAuditRouter } from "./audit";
import { createAutoDiscoveryRouter } from "./auto-discovery";
import { createAutoReconnectRouter } from "./auto-reconnect";
import { createCatalogRouter } from "./catalog";
import { createMemoriesRouter } from "./memories";
import { createRegistryRouter } from "./registry";
import { createSystemRouter } from "./system";

export { createMcpServersRouter };
export { createNamespacesRouter };
export { createEndpointsRouter };
export { createOAuthRouter };
export { createToolsRouter };
export { createApiKeysRouter };
export { createConfigRouter };
export { createLogsRouter };
export { createSavedScriptsRouter };
export { createToolSetsRouter };
export { createPoliciesRouter };
export { createAgentRouter };
export { createServerHealthRouter };
export { createAnalyticsRouter };
export { createAuditRouter };
export { createAutoDiscoveryRouter };
export { createAutoReconnectRouter };
export { createCatalogRouter };
export { createMemoriesRouter };
export { createRegistryRouter };
export { createSystemRouter };

export const createFrontendRouter = (implementations: {
  mcpServers: Parameters<typeof createMcpServersRouter>[0];
  namespaces: Parameters<typeof createNamespacesRouter>[0];
  endpoints: Parameters<typeof createEndpointsRouter>[0];
  oauth: Parameters<typeof createOAuthRouter>[0];
  tools: Parameters<typeof createToolsRouter>[0];
  apiKeys: Parameters<typeof createApiKeysRouter>[0];
  config: Parameters<typeof createConfigRouter>[0];
  logs: Parameters<typeof createLogsRouter>[0];
  savedScripts: Parameters<typeof createSavedScriptsRouter>[0];
  toolSets: Parameters<typeof createToolSetsRouter>[0];
  policies: Parameters<typeof createPoliciesRouter>[0];
  agent: Parameters<typeof createAgentRouter>[0];
  serverHealth: Parameters<typeof createServerHealthRouter>[0];
  analytics: Parameters<typeof createAnalyticsRouter>[0];
  audit: Parameters<typeof createAuditRouter>[0];
  autoDiscovery: Parameters<typeof createAutoDiscoveryRouter>[0];
  autoReconnect: Parameters<typeof createAutoReconnectRouter>[0];
  catalog: Parameters<typeof createCatalogRouter>[0];
  memories: Parameters<typeof createMemoriesRouter>[0];
  registry: Parameters<typeof createRegistryRouter>[0];
  system: Parameters<typeof createSystemRouter>[0];
}) => {
  return {
    mcpServers: createMcpServersRouter(implementations.mcpServers),
    namespaces: createNamespacesRouter(implementations.namespaces),
    endpoints: createEndpointsRouter(implementations.endpoints),
    oauth: createOAuthRouter(implementations.oauth),
    tools: createToolsRouter(implementations.tools),
    apiKeys: createApiKeysRouter(implementations.apiKeys),
    config: createConfigRouter(implementations.config),
    logs: createLogsRouter(implementations.logs),
    savedScripts: createSavedScriptsRouter(implementations.savedScripts),
    toolSets: createToolSetsRouter(implementations.toolSets),
    policies: createPoliciesRouter(implementations.policies),
    agent: createAgentRouter(implementations.agent),
    serverHealth: createServerHealthRouter(implementations.serverHealth),
    analytics: createAnalyticsRouter(implementations.analytics),
    audit: createAuditRouter(implementations.audit),
    autoDiscovery: createAutoDiscoveryRouter(implementations.autoDiscovery),
    autoReconnect: createAutoReconnectRouter(implementations.autoReconnect),
    catalog: createCatalogRouter(implementations.catalog),
    memories: createMemoriesRouter(implementations.memories),
    registry: createRegistryRouter(implementations.registry),
    system: createSystemRouter(implementations.system),
  };
};
