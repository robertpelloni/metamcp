# Tool Sets (Profiles) Guide

Tool Sets allow you to manage groups of tools, enabling you to switch contexts quickly without polluting your LLM's context window with hundreds of irrelevant tools.

## The Problem

If you have 50 MCP servers connected (GitHub, Linear, Slack, Postgres, Filesystem, etc.), you might have 500+ tools.
Loading all of these into an LLM context:
1. Costs a lot of tokens.
2. Confuses the model (hallucination).
3. Hits context limits.

## The Solution: Tool Sets

MetaMCP uses **Progressive Disclosure**. By default, you only see "Meta Tools" (`search_tools`, `load_tool`).

You can group tools into **Sets** (Profiles).

### Creating a Tool Set

1. **Load Tools:** Use `search_tools` and `load_tool` to assemble the tools you need for a specific workflow (e.g., "Web Development").

   ```javascript
   // You load these individually
   load_tool('github__create_issue')
   load_tool('github__list_pull_requests')
   load_tool('postgres__query')
   ```

2. **Save the Set:**

   ```javascript
   save_tool_set({
     name: "web_dev_workflow",
     description: "Tools for managing repo and database"
   })
   ```

### Using a Tool Set

Next time you start a session, instead of searching for tools again:

```javascript
load_tool_set({ name: "web_dev_workflow" })
```

This instantly injects those specific tools into your context.

### Managing via UI

You can also manage Tool Sets via the MetaMCP Frontend:

1. Navigate to **Tool Sets** in the sidebar.
2. View existing sets.
3. (Coming Soon) Edit sets visually.

## API Reference

### `save_tool_set`
- **name** (string): Unique identifier.
- **description** (string): Optional description.
- **tools** (implicit): Saves the currently loaded tools in your session.

### `load_tool_set`
- **name** (string): The set to load.

### `list_tool_sets` (Internal)
- Available via the Frontend API to list all sets.
