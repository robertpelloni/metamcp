import {
  ApiKeyCreateInput,
  ApiKeyType,
  ApiKeyUpdateInput,
} from "@repo/zod-types";
<<<<<<< HEAD
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { customAlphabet } from "nanoid";
=======
import { ApiKeysJsonRepository } from "./api-keys-json.repo";
>>>>>>> fix/detached-head-recovery

// Default to JSON repository for now. 
// In the future, we can add a factory or config switch here.
const jsonRepo = new ApiKeysJsonRepository();

export class ApiKeysRepository {
<<<<<<< HEAD
  /**
   * Generate a new API key with the specified format: sk_mt_{64-char-nanoid}
   */
  private generateApiKey(): string {
    const keyPart = nanoid();
    const key = `sk_mt_${keyPart}`;

    return key;
  }

  async create(input: ApiKeyCreateInput): Promise<{
    uuid: string;
    name: string;
    key: string;
    type: ApiKeyType;
    user_id: string | null;
    created_at: Date;
  }> {
    const key = this.generateApiKey();

    const [createdApiKey] = await db
      .insert(apiKeysTable)
      .values({
        name: input.name,
        key: key,
        type: input.type ?? "MCP",
        user_id: input.user_id,
        is_active: input.is_active ?? true,
      })
      .returning({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        type: apiKeysTable.type,
        user_id: apiKeysTable.user_id,
        created_at: apiKeysTable.created_at,
      });

    if (!createdApiKey) {
      throw new Error("Failed to create API key");
    }

    return {
      ...createdApiKey,
      key, // Return the actual key
    };
  }

  async findByUserId(userId: string) {
    return await db
      .select({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.user_id, userId))
      .orderBy(desc(apiKeysTable.created_at));
=======
  async create(input: ApiKeyCreateInput) {
    return jsonRepo.create(input);
  }

  async findByUserId(userId: string) {
    return jsonRepo.findByUserId(userId);
>>>>>>> fix/detached-head-recovery
  }

  async findAll() {
<<<<<<< HEAD
    return await db
      .select({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
        user_id: apiKeysTable.user_id,
      })
      .from(apiKeysTable)
      .orderBy(desc(apiKeysTable.created_at));
=======
    return jsonRepo.findAll();
>>>>>>> fix/detached-head-recovery
  }

  async findPublicApiKeys() {
<<<<<<< HEAD
    return await db
      .select({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
        user_id: apiKeysTable.user_id,
      })
      .from(apiKeysTable)
      .where(isNull(apiKeysTable.user_id))
      .orderBy(desc(apiKeysTable.created_at));
=======
    return jsonRepo.findPublicApiKeys();
>>>>>>> fix/detached-head-recovery
  }

  async findAccessibleToUser(userId: string) {
<<<<<<< HEAD
    return await db
      .select({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
        user_id: apiKeysTable.user_id,
      })
      .from(apiKeysTable)
      .where(
        or(
          isNull(apiKeysTable.user_id), // Public API keys
          eq(apiKeysTable.user_id, userId), // User's own API keys
        ),
      )
      .orderBy(desc(apiKeysTable.created_at));
  }

  async findByUuid(uuid: string, userId: string) {
    const [apiKey] = await db
      .select({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
        user_id: apiKeysTable.user_id,
      })
      .from(apiKeysTable)
      .where(
        and(eq(apiKeysTable.uuid, uuid), eq(apiKeysTable.user_id, userId)),
      );

    return apiKey;
=======
    return jsonRepo.findAccessibleToUser(userId);
  }

  async findByUuid(uuid: string, userId: string) {
    return jsonRepo.findByUuid(uuid, userId);
>>>>>>> fix/detached-head-recovery
  }

  async findByUuidWithAccess(uuid: string, userId?: string) {
<<<<<<< HEAD
    const [apiKey] = await db
      .select({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
        user_id: apiKeysTable.user_id,
      })
      .from(apiKeysTable)
      .where(
        and(
          eq(apiKeysTable.uuid, uuid),
          userId
            ? or(
                isNull(apiKeysTable.user_id), // Public API keys
                eq(apiKeysTable.user_id, userId), // User's own API keys
              )
            : isNull(apiKeysTable.user_id), // Only public if no user context
        ),
      );

    return apiKey;
  }

  async validateApiKey(key: string): Promise<{
    valid: boolean;
    user_id?: string | null;
    key_uuid?: string;
    type?: ApiKeyType;
  }> {
    const [apiKey] = await db
      .select({
        uuid: apiKeysTable.uuid,
        user_id: apiKeysTable.user_id,
        type: apiKeysTable.type,
        is_active: apiKeysTable.is_active,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.key, key));

    if (!apiKey) {
      return { valid: false };
    }

    // Check if key is active
    if (!apiKey.is_active) {
      return { valid: false };
    }

    return {
      valid: true,
      user_id: apiKey.user_id,
      key_uuid: apiKey.uuid,
      type: apiKey.type,
    };
  }

  async update(uuid: string, userId: string, input: ApiKeyUpdateInput) {
    const [updatedApiKey] = await db
      .update(apiKeysTable)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.type && { type: input.type }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      })
      .where(
        and(
          eq(apiKeysTable.uuid, uuid),
          or(eq(apiKeysTable.user_id, userId), isNull(apiKeysTable.user_id)),
        ),
      )
      .returning({
        uuid: apiKeysTable.uuid,
        name: apiKeysTable.name,
        key: apiKeysTable.key,
        type: apiKeysTable.type,
        created_at: apiKeysTable.created_at,
        is_active: apiKeysTable.is_active,
      });

    if (!updatedApiKey) {
      throw new Error("Failed to update API key or API key not found");
    }

    return updatedApiKey;
=======
    return jsonRepo.findByUuidWithAccess(uuid, userId);
  }

  async validateApiKey(key: string) {
    return jsonRepo.validateApiKey(key);
  }

  async update(uuid: string, userId: string, input: ApiKeyUpdateInput) {
    return jsonRepo.update(uuid, userId, input);
>>>>>>> fix/detached-head-recovery
  }

  async delete(uuid: string, userId: string) {
    return jsonRepo.delete(uuid, userId);
  }
}
