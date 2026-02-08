# Agent Operational Directives

Please refer to [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) for the universal guidelines, architecture, and workflows.

## Agent-Specific Notes

*   **Security**: Always verify policy constraints before executing tools.
*   **Context**: Use `search_tools` to find relevant tools before attempting to use them.

## Memory Management

Agents are equipped with long-term memory capabilities. You should actively use these tools to persist important information and retrieve context from past interactions.

*   **`save_memory`**: Use this to store key facts, user preferences, or task outcomes.
    *   Example: `save_memory(content="User prefers TypeScript for all code examples", tags=["preference", "coding"])`
*   **`search_memory`**: Use this to retrieve relevant context before starting a complex task.
    *   Example: `search_memory(query="project coding standards")`
*   **`list_memories`**: Use this to browse recent memories.
*   **`delete_memory`**: Use this to remove outdated information.

## MCP Registry

You have access to a central registry of MCP servers.

*   **Registry Tools**: While there may not be direct tools to "install" from the registry as an agent, you can query the registry or instruct the user to install servers via the UI (`/registry`).
*   **One-Click Install**: The Registry UI supports one-click installation for verified servers using templates.

## Analytics

*   **Performance**: Be mindful of tool usage. High-frequency polling or excessive data retrieval can impact performance.
*   **Logs**: Your actions are logged and visible in the Observability Dashboard (`/observability`).
