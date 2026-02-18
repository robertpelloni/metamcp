import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { savedScriptsTable } from "../../db/schema";

export interface SavedScript {
  uuid: string;
  name: string;
  description: string | null;
  code: string;
  userId: string | null;
}

export class SavedScriptService {
  async listScripts(userId?: string | null): Promise<SavedScript[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(savedScriptsTable.user_id, userId));
    } else {
        // If no user ID, mostly just public/anonymous or handled by auth layer filtering
        // For now return all scripts where user_id is null (system scripts maybe?)
        conditions.push(sql`${savedScriptsTable.user_id} IS NULL`);
    }

    const scripts = await db
      .select()
      .from(savedScriptsTable)
      .where(sql.join(conditions, sql` AND `))
      .orderBy(savedScriptsTable.name);

    return scripts.map((s) => ({
      uuid: s.uuid,
      name: s.name,
      description: s.description,
      code: s.code,
      userId: s.user_id,
    }));
  }

  async getScript(name: string, userId?: string | null): Promise<SavedScript | undefined> {
    const conditions = [eq(savedScriptsTable.name, name)];
    if (userId) {
        conditions.push(eq(savedScriptsTable.user_id, userId));
    } else {
        conditions.push(sql`${savedScriptsTable.user_id} IS NULL`);
    }

    const [script] = await db
      .select()
      .from(savedScriptsTable)
      .where(sql.join(conditions, sql` AND `))
      .limit(1);

    if (!script) return undefined;

    return {
      uuid: script.uuid,
      name: script.name,
      description: script.description,
      code: script.code,
      userId: script.user_id,
    };
  }

  async saveScript(
    name: string,
    code: string,
    description?: string,
    userId?: string | null
  ): Promise<SavedScript> {
    const [saved] = await db
      .insert(savedScriptsTable)
      .values({
        name,
        code,
        description,
        user_id: userId,
      })
      .onConflictDoUpdate({
        target: [savedScriptsTable.name, savedScriptsTable.user_id],
        set: {
          code: sql`excluded.code`,
          description: sql`excluded.description`,
          updated_at: new Date(),
        },
      })
      .returning();

    return {
      uuid: saved.uuid,
      name: saved.name,
      description: saved.description,
      code: saved.code,
      userId: saved.user_id,
    };
  }
}

export const savedScriptService = new SavedScriptService();
