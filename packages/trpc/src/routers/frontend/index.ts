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
import { createAgentRouter } from "./agent";
import { createPoliciesRouter } from "./policies";
import { createMemoriesRouter } from "./memories";
import { createSchedulerRouter } from "./scheduler";

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
export { createAgentRouter };
export { createPoliciesRouter };
export { createMemoriesRouter };
export { createSchedulerRouter };

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
  agent: Parameters<typeof createAgentRouter>[0];
  policies: Parameters<typeof createPoliciesRouter>[0];
  memories: Parameters<typeof createMemoriesRouter>[0];
  scheduler: Parameters<typeof createSchedulerRouter>[0];
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
    agent: createAgentRouter(implementations.agent),
    policies: createPoliciesRouter(implementations.policies),
    memories: createMemoriesRouter(implementations.memories),
    scheduler: createSchedulerRouter(implementations.scheduler),
  };
};
