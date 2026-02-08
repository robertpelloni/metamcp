# Agent Memory

## Overview

MetaMCP provides a robust long-term memory system for AI agents, allowing them to persist information across sessions. This system uses `pgvector` for semantic search, enabling agents to retrieve relevant context based on meaning rather than just keywords.

## Features

*   **Long-Term Persistence**: Memories are stored in a dedicated PostgreSQL table (`memories`).
*   **Semantic Search**: Retrieve memories using natural language queries.
*   **Context Injection**: Relevant memories are automatically injected into the agent's context window.
*   **User Interface**: Manage memories via the `/memories` page.

## Usage

### UI Interaction

1.  Navigate to the **Memories** page from the sidebar.
2.  **Create Memory**: Click "Add Memory" to manually store information.
    *   **Content**: The text to store.
    *   **Tags**: Optional keywords for categorization.
3.  **Search**: Use the search bar to find memories semantically.
4.  **Delete**: Remove outdated or incorrect memories.

### Agent Tools

Agents can interact with memory using the following tools:

*   `save_memory(content: string, tags?: string[])`: Stores a new memory.
*   `search_memory(query: string)`: Retrieves the top relevant memories.
*   `list_memories(limit?: number)`: Lists recent memories.
*   `delete_memory(uuid: string)`: Deletes a specific memory.

## Best Practices

*   **Be Specific**: When saving memories, include specific details to improve retrieval accuracy.
*   **Use Tags**: Tags help in organizing and filtering memories (e.g., `#preference`, `#task-history`).
*   **Regular Cleanup**: Review and delete outdated memories periodically to keep the context relevant.
