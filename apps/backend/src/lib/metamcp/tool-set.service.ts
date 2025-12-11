import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { toolSetItemsTable, toolSetsTable } from "../../db/schema";

export interface ToolSet {
  uuid: string;
  name: string;
  description: string | null;
  tools: string[];
}

export class ToolSetService {
  async listToolSets(userId?: string | null): Promise<ToolSet[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(toolSetsTable.user_id, userId));
    } else {
      conditions.push(sql`${toolSetsTable.user_id} IS NULL`);
    }

    const sets = await db
      .select()
      .from(toolSetsTable)
      .where(sql.join(conditions, sql` AND `));

    // Fetch items for each set (N+1 query, but N is small)
    // Could use a join, but this is simpler for now
    const results: ToolSet[] = [];
    for (const set of sets) {
      const items = await db
        .select({ name: toolSetItemsTable.tool_name })
        .from(toolSetItemsTable)
        .where(eq(toolSetItemsTable.tool_set_uuid, set.uuid));

      results.push({
        uuid: set.uuid,
        name: set.name,
        description: set.description,
        tools: items.map(i => i.name),
      });
    }

    return results;
  }

  async getToolSet(name: string, userId?: string | null): Promise<ToolSet | undefined> {
    const conditions = [eq(toolSetsTable.name, name)];
    if (userId) {
      conditions.push(eq(toolSetsTable.user_id, userId));
    } else {
      conditions.push(sql`${toolSetsTable.user_id} IS NULL`);
    }

    const [set] = await db
      .select()
      .from(toolSetsTable)
      .where(sql.join(conditions, sql` AND `))
      .limit(1);

    if (!set) return undefined;

    const items = await db
      .select({ name: toolSetItemsTable.tool_name })
      .from(toolSetItemsTable)
      .where(eq(toolSetItemsTable.tool_set_uuid, set.uuid));

    return {
      uuid: set.uuid,
      name: set.name,
      description: set.description,
      tools: items.map(i => i.name),
    };
  }

  async createToolSet(
    name: string,
    tools: string[],
    description?: string,
    userId?: string | null
  ): Promise<ToolSet> {
    // Transactional creation
    return await db.transaction(async (tx) => {
      const [set] = await tx
        .insert(toolSetsTable)
        .values({
          name,
          description,
          user_id: userId,
        })
        .onConflictDoUpdate({
            target: [toolSetsTable.name, toolSetsTable.user_id],
            set: { description: sql`excluded.description` } // Update desc if exists
        })
        .returning();

      // Clear existing items if updating
      await tx
        .delete(toolSetItemsTable)
        .where(eq(toolSetItemsTable.tool_set_uuid, set.uuid));

      // Insert new items
      if (tools.length > 0) {
        await tx.insert(toolSetItemsTable).values(
          tools.map(toolName => ({
            tool_set_uuid: set.uuid,
            tool_name: toolName,
          }))
        );
      }

      return {
        uuid: set.uuid,
        name: set.name,
        description: set.description,
        tools: tools,
      };
    });
  }
}

export const toolSetService = new ToolSetService();
