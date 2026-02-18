
import {
    ApiKeyCreateInput,
    ApiKeyType,
    ApiKeyUpdateInput,
} from "@repo/zod-types";
import { customAlphabet } from "nanoid";
import { JsonStore } from "../../lib/json-store";
import { randomUUID } from "crypto";
import logger from "../../utils/logger";

const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    64
);

export interface ApiKeyRecord {
    uuid: string;
    name: string;
    key: string;
    type: ApiKeyType;
    user_id: string | null;
    created_at: string; // JSON stores dates as strings
    is_active: boolean;
}

interface ApiKeysSchema {
    apiKeys: Record<string, ApiKeyRecord>; // uuid -> record
}

export class ApiKeysJsonRepository {
    private store: JsonStore<ApiKeysSchema>;

    constructor() {
        this.store = new JsonStore<ApiKeysSchema>("api-keys.json", { apiKeys: {} });
    }

    async init() {
        await this.store.init();
    }

    private generateApiKey(): string {
        const keyPart = nanoid();
        return `sk_mt_${keyPart}`;
    }

    async create(input: ApiKeyCreateInput) {
        await this.init();
        const key = this.generateApiKey();
        const uuid = randomUUID();
        const now = new Date().toISOString();

        const newKey: ApiKeyRecord = {
            uuid,
            name: input.name,
            key,
            type: input.type ?? "MCP",
            user_id: input.user_id ?? null,
            created_at: now,
            is_active: input.is_active ?? true,
        };

        await this.store.update((data: ApiKeysSchema) => {
            data.apiKeys[uuid] = newKey;
            return data;
        });

        return {
            ...newKey,
            created_at: new Date(newKey.created_at),
        };
    }

    async findByUserId(userId: string) {
        await this.init();
        const all = Object.values(this.store.get().apiKeys);
        return all
            .filter((k) => k.user_id === userId)
            .map((k) => ({ ...k, created_at: new Date(k.created_at) }))
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    async findAll() {
        await this.init();
        const all = Object.values(this.store.get().apiKeys);
        return all
            .map((k) => ({ ...k, created_at: new Date(k.created_at) }))
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    async findPublicApiKeys() {
        await this.init();
        const all = Object.values(this.store.get().apiKeys);
        return all
            .filter((k) => !k.user_id)
            .map((k) => ({ ...k, created_at: new Date(k.created_at) }))
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    async findAccessibleToUser(userId: string) {
        await this.init();
        const all = Object.values(this.store.get().apiKeys);
        return all
            .filter((k) => !k.user_id || k.user_id === userId)
            .map((k) => ({ ...k, created_at: new Date(k.created_at) }))
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    async findByUuid(uuid: string, userId: string) {
        await this.init();
        const record = this.store.get().apiKeys[uuid];
        if (record && record.user_id === userId) {
            return { ...record, created_at: new Date(record.created_at) };
        }
        return undefined;
    }

    async findByUuidWithAccess(uuid: string, userId?: string) {
        await this.init();
        const record = this.store.get().apiKeys[uuid];
        if (!record) return undefined;

        const isPublic = !record.user_id;
        const isOwner = userId && record.user_id === userId;

        if (isPublic || isOwner) {
            return { ...record, created_at: new Date(record.created_at) };
        }
        return undefined;
    }

    async validateApiKey(key: string) {
        await this.init();
        // This is a bit inefficient (O(n)), but for local JSON/dev it's fine.
        // If n grows large, we maintain a secondary index in memory.
        const all = Object.values(this.store.get().apiKeys);
        const match = all.find((k) => k.key === key);

        if (!match || !match.is_active) {
            return { valid: false };
        }

        return {
            valid: true,
            user_id: match.user_id,
            key_uuid: match.uuid,
            type: match.type,
        };
    }

    async update(uuid: string, userId: string, input: ApiKeyUpdateInput) {
        await this.init();
        let updated: ApiKeyRecord | undefined;

        await this.store.update((data: ApiKeysSchema) => {
            const record = data.apiKeys[uuid];
            if (
                record &&
                (record.user_id === userId || (!record.user_id && !userId)) // Simple ownership check
            ) {
                updated = {
                    ...record,
                    ...(input.name && { name: input.name }),
                    ...(input.type && { type: input.type }),
                    ...(input.is_active !== undefined && { is_active: input.is_active }),
                };
                data.apiKeys[uuid] = updated;
            }
            return data;
        });

        if (!updated) {
            throw new Error("Failed to update API key or API key not found");
        }

        return { ...updated, created_at: new Date(updated.created_at) };
    }

    async delete(uuid: string, userId: string) {
        await this.init();
        let deleted: ApiKeyRecord | undefined;

        await this.store.update((data: ApiKeysSchema) => {
            const record = data.apiKeys[uuid];
            if (
                record &&
                (record.user_id === userId || (!record.user_id && !userId))
            ) {
                deleted = record;
                delete data.apiKeys[uuid];
            }
            return data;
        });

        if (!deleted) {
            throw new Error("Failed to delete API key or API key not found");
        }

        return {
            uuid: deleted.uuid,
            name: deleted.name
        };
    }
}
