import {
  DeleteToolSetRequestSchema,
  DeleteToolSetResponseSchema,
  GetToolSetsResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { toolSetService } from "../lib/metamcp/tool-set.service";
import { db } from "../db";
import { toolSetsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  NotFoundError,
  DatabaseError,
  logError,
  wrapError,
} from "../lib/errors";

export const toolSetsImplementations = {
  getToolSets: async (): Promise<z.infer<typeof GetToolSetsResponseSchema>> => {
    try {
      const toolSets = await toolSetService.listToolSets();

      return {
        success: true as const,
        data: toolSets.map((ts) => ({
          uuid: ts.uuid,
          name: ts.name,
          description: ts.description,
          tools: ts.tools,
        })),
      };
    } catch (error) {
      logError(error, "toolSets.getToolSets");
      throw new DatabaseError(
        "query",
        error instanceof Error ? error.message : "Unknown database error",
        "tool_sets",
      );
    }
  },

  deleteToolSet: async (
    input: z.infer<typeof DeleteToolSetRequestSchema>,
  ): Promise<z.infer<typeof DeleteToolSetResponseSchema>> => {
    try {
      // Check if tool set exists first
      const existing = await db.query.toolSetsTable.findFirst({
        where: eq(toolSetsTable.uuid, input.uuid),
      });

      if (!existing) {
        throw new NotFoundError("Tool set", input.uuid);
      }

      await db.delete(toolSetsTable).where(eq(toolSetsTable.uuid, input.uuid));

      return {
        success: true,
        message: `Tool set "${existing.name}" deleted successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logError(error, "toolSets.deleteToolSet", { uuid: input.uuid });
      throw wrapError(error, `Failed to delete tool set "${input.uuid}"`);
    }
  },
};
