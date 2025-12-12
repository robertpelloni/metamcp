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

export const toolSetsImplementations = {
  getToolSets: async (): Promise<z.infer<typeof GetToolSetsResponseSchema>> => {
    try {
      const toolSets = await toolSetService.listToolSets();

      return {
        success: true as const,
        data: toolSets.map(ts => ({
            uuid: ts.uuid,
            name: ts.name,
            description: ts.description,
            tools: ts.tools
        })),
      };
    } catch (error) {
      console.error("Error getting tool sets:", error);
      throw new Error("Failed to get tool sets");
    }
  },

  deleteToolSet: async (
    input: z.infer<typeof DeleteToolSetRequestSchema>,
  ): Promise<z.infer<typeof DeleteToolSetResponseSchema>> => {
    try {
      await db.delete(toolSetsTable).where(eq(toolSetsTable.uuid, input.uuid));
      return {
        success: true,
        message: "Tool set deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting tool set:", error);
      throw new Error("Failed to delete tool set");
    }
  },
};
