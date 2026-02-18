
import { JsonStore } from "../json-store";
import { Memory, MemoryStorageProvider } from "./memory-storage.interface";
import { v4 as uuidv4 } from "uuid";

interface MemorySchema {
    memories: Memory[];
}

export class JsonMemoryStorage implements MemoryStorageProvider {
    private backend: JsonStore<MemorySchema>;

    constructor() {
        this.backend = new JsonStore<MemorySchema>("memories.json", { memories: [] });
    }

    async init() {
        await this.backend.init();
    }

    async store(memory: Omit<Memory, "id" | "timestamp">): Promise<Memory> {
        await this.init();

        // Create new memory object
        const newMemory: Memory = {
            ...memory,
            id: uuidv4(),
            timestamp: Date.now(),
        };

        await this.backend.update((data: MemorySchema) => {
            data.memories.push(newMemory);
            return data;
        });

        return newMemory;
    }

    async search(vector: number[], excludeLastN: number = 0, limit: number = 5): Promise<Memory[]> {
        await this.init();
        const memories = this.backend.get().memories;

        // Simple cosine similarity search
        // Exclude the last N memories to avoid context repetition overlap if needed
        const candidateMemories = excludeLastN > 0
            ? memories.slice(0, -excludeLastN)
            : memories;

        if (candidateMemories.length === 0) return [];

        // Calculate similarity for each memory
        const scores = candidateMemories.map(mem => {
            if (!mem.embedding) return { memory: mem, score: -1 };
            return {
                memory: mem,
                score: this.cosineSimilarity(vector, mem.embedding)
            };
        });

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        // Filter out low relevance if needed (optional optimization)
        // For now just return top K
        return scores.slice(0, limit).map(s => s.memory);
    }

    async getRecent(limit: number): Promise<Memory[]> {
        await this.init();
        const memories = this.backend.get().memories;
        // Return last N memories
        return memories.slice(-limit);
    }

    async clear(): Promise<void> {
        await this.backend.set({ memories: [] });
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dot = 0;
        let magA = 0;
        let magB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
    }
}
