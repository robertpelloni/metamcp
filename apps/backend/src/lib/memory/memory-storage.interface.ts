
export interface Memory {
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
    user_id: string;
    agent_id?: string | null;
    timestamp: number;
}

export interface MemoryStorageProvider {
    /**
     * Initialize the storage provider (e.g., load file, connect to DB).
     */
    init(): Promise<void>;

    /**
     * Store a new memory item.
     */
    store(memory: Omit<Memory, "id" | "timestamp">): Promise<Memory>;

    /**
     * Retrieve relevant memories based on a query vector.
     * @param vector The embedding vector of the query.
     * @param excludeLastN Exclude the last N memories (for conversation context).
     * @param limit Maximum number of results to return.
     */
    search(vector: number[], excludeLastN?: number, limit?: number): Promise<Memory[]>;

    /**
     * Retrieve the recent N memories.
     */
    getRecent(limit: number): Promise<Memory[]>;

    /**
     * Clear all memories (useful for testing or resetting).
     */
    clear(): Promise<void>;
}
