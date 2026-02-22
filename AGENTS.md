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

## Tool Personas (New in v3.10.0)

Agents can now manage "Tool Personas" (Profiles) for users.

*   **`save_tool_set`**: Use this to save the currently loaded tools as a reusable profile.
    *   Example: `save_tool_set(name="web_dev_persona", description="Tools for web scraping and development")`
*   **`load_tool_set`**: Use this to restore a previously saved environment.
    *   Example: `load_tool_set(name="web_dev_persona")`
*   **UI Management**: Users can manage these personas at `/tool-sets`.

## Scheduling & Notifications (New in v3.9.0)

*   **`schedule_task`**: Use this to automate recurring tasks using cron syntax.
    *   Example: `schedule_task(name="daily_summary", cron="0 9 * * *", script_name="summarize_logs")`
*   **`notify_user`**: Use this to send real-time alerts to the user's notification bell.
    *   Example: `notify_user(title="Task Complete", message="Daily summary generated successfully.", type="success")`

## MCP Registry

You have access to a central registry of MCP servers.

*   **Registry Tools**: While there may not be direct tools to "install" from the registry as an agent, you can query the registry or instruct the user to install servers via the UI (`/registry`).
*   **One-Click Install**: The Registry UI supports one-click installation for verified servers using templates.

## Analytics & Costs

*   **Performance**: Be mindful of tool usage. High-frequency polling or excessive data retrieval can impact performance.
*   **Cost Tracking**: Token usage is now tracked per request. Use `llm_usage_logs` context sparingly if costs are a concern.
*   **Logs**: Your actions are logged and visible in the Observability Dashboard (`/observability`).
