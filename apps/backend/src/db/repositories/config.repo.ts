import { eq } from "drizzle-orm";

import { db } from "../index";
import { configTable } from "../schema";

function isConfigStorageUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const causeMessage =
    error.cause instanceof Error ? error.cause.message.toLowerCase() : "";

  return (
    message.includes('relation "config" does not exist') ||
    message.includes("no such table: config") ||
    message.includes("econnrefused") ||
    message.includes("connection terminated unexpectedly") ||
    causeMessage.includes('relation "config" does not exist') ||
    causeMessage.includes("no such table: config") ||
    causeMessage.includes("econnrefused") ||
    causeMessage.includes("connection terminated unexpectedly")
  );
}

function warnConfigStorageUnavailable(operation: string, error: Error): void {
  console.warn(
    `[config.repo] ${operation}: config storage unavailable; falling back to default behavior. ${error.message}`,
  );
}

export const configRepo = {
  async getConfig(
    id: string,
  ): Promise<
    { id: string; value: string; description?: string | null } | undefined
  > {
    try {
      const result = await db
        .select()
        .from(configTable)
        .where(eq(configTable.id, id));
      return result[0];
    } catch (error) {
      if (isConfigStorageUnavailableError(error)) {
        warnConfigStorageUnavailable("getConfig", error);
        return undefined;
      }
      throw error;
    }
  },

  async setConfig(
    id: string,
    value: string,
    description?: string,
  ): Promise<void> {
    await db
      .insert(configTable)
      .values({
        id,
        value,
        description,
      })
      .onConflictDoUpdate({
        target: configTable.id,
        set: {
          value,
          description,
          updated_at: new Date(),
        },
      });
  },

  async getAllConfigs(): Promise<
    Array<{ id: string; value: string; description?: string | null }>
  > {
    try {
      return await db.select().from(configTable);
    } catch (error) {
      if (isConfigStorageUnavailableError(error)) {
        warnConfigStorageUnavailable("getAllConfigs", error);
        return [];
      }
      throw error;
    }
  },

  async deleteConfig(id: string): Promise<void> {
    await db.delete(configTable).where(eq(configTable.id, id));
  },
};
