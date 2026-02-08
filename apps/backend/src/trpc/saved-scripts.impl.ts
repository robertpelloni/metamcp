import {
  DeleteSavedScriptRequestSchema,
  DeleteSavedScriptResponseSchema,
  GetSavedScriptsResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { savedScriptService } from "../lib/sandbox/saved-script.service";
import { db } from "../db";
import { savedScriptsTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const savedScriptsImplementations = {
  getScripts: async (): Promise<z.infer<typeof GetSavedScriptsResponseSchema>> => {
    try {
      const scripts = await savedScriptService.listScripts();

      return {
        success: true as const,
        data: scripts.map(s => ({
            uuid: s.uuid,
            name: s.name,
            description: s.description,
            code: s.code,
            userId: s.userId
        })),
      };
    } catch (error) {
      console.error("Error getting saved scripts:", error);
      throw new Error("Failed to get saved scripts");
    }
  },

  deleteScript: async (
    input: z.infer<typeof DeleteSavedScriptRequestSchema>,
  ): Promise<z.infer<typeof DeleteSavedScriptResponseSchema>> => {
    try {
      await db.delete(savedScriptsTable).where(eq(savedScriptsTable.uuid, input.uuid));
      return {
        success: true,
        message: "Script deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting script:", error);
      throw new Error("Failed to delete script");
    }
  },
};
