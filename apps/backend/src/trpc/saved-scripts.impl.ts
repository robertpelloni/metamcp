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
import {
  NotFoundError,
  DatabaseError,
  logError,
  wrapError,
} from "../lib/errors";

export const savedScriptsImplementations = {
  getScripts: async (): Promise<
    z.infer<typeof GetSavedScriptsResponseSchema>
  > => {
    try {
      const scripts = await savedScriptService.listScripts();

      return {
        success: true as const,
        data: scripts.map((s) => ({
          uuid: s.uuid,
          name: s.name,
          description: s.description,
          code: s.code,
          userId: s.userId,
        })),
      };
    } catch (error) {
      logError(error, "savedScripts.getScripts");
      throw new DatabaseError(
        "query",
        error instanceof Error ? error.message : "Unknown database error",
        "saved_scripts",
      );
    }
  },

  deleteScript: async (
    input: z.infer<typeof DeleteSavedScriptRequestSchema>,
  ): Promise<z.infer<typeof DeleteSavedScriptResponseSchema>> => {
    try {
      // Check if script exists first
      const existing = await db.query.savedScriptsTable.findFirst({
        where: eq(savedScriptsTable.uuid, input.uuid),
      });

      if (!existing) {
        throw new NotFoundError("Saved script", input.uuid);
      }

      await db
        .delete(savedScriptsTable)
        .where(eq(savedScriptsTable.uuid, input.uuid));

      return {
        success: true,
        message: `Script "${existing.name}" deleted successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logError(error, "savedScripts.deleteScript", { uuid: input.uuid });
      throw wrapError(error, `Failed to delete script "${input.uuid}"`);
    }
  },
};
