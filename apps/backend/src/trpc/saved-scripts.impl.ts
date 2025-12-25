import {
  CreateSavedScriptRequestSchema,
  CreateSavedScriptResponseSchema,
  DeleteSavedScriptRequestSchema,
  DeleteSavedScriptResponseSchema,
  GetSavedScriptsResponseSchema,
  RunSavedScriptRequestSchema,
  RunSavedScriptResponseSchema,
  UpdateSavedScriptRequestSchema,
  UpdateSavedScriptResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { savedScriptService } from "../lib/sandbox/saved-script.service";
import { db } from "../db";
import { savedScriptsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { createServer } from "../lib/metamcp/metamcp-proxy";

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

  createScript: async (
    input: z.infer<typeof CreateSavedScriptRequestSchema>
  ): Promise<z.infer<typeof CreateSavedScriptResponseSchema>> => {
      try {
          const script = await savedScriptService.saveScript(input.name, input.code, input.description || undefined);
          return {
              success: true as const,
              data: {
                  ...script,
                  createdAt: script.created_at,
                  updatedAt: script.updated_at,
                  userId: script.user_id,
              }
          };
      } catch (error: any) {
          console.error("Error creating script:", error);
          throw new Error(error.message || "Failed to create script");
      }
  },

  updateScript: async (
    input: z.infer<typeof UpdateSavedScriptRequestSchema>
  ): Promise<z.infer<typeof UpdateSavedScriptResponseSchema>> => {
      try {
          const [updated] = await db.update(savedScriptsTable)
            .set({
                name: input.name,
                description: input.description,
                code: input.code,
                updated_at: new Date()
            })
            .where(eq(savedScriptsTable.uuid, input.uuid))
            .returning();

          if (!updated) throw new Error("Script not found");

          return {
              success: true as const,
              data: {
                  ...updated,
                  createdAt: updated.created_at,
                  updatedAt: updated.updated_at,
                  userId: updated.user_id,
              }
          };
      } catch (error: any) {
          console.error("Error updating script:", error);
          throw new Error(error.message || "Failed to update script");
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

  runScript: async (
      input: z.infer<typeof RunSavedScriptRequestSchema>,
      // We need session info to create the server context
      ctx: { session?: { session: { id: string }, user: { id: string } } }
  ): Promise<z.infer<typeof RunSavedScriptResponseSchema>> => {
      try {
          const script = await savedScriptService.getScript(input.uuid); // Or findByUuid if getScript expects name?
          // savedScriptService.getScript expects NAME. We need UUID lookup.
          const [dbScript] = await db.select().from(savedScriptsTable).where(eq(savedScriptsTable.uuid, input.uuid));

          if (!dbScript) throw new Error("Script not found");

          // Initialize Proxy Context (similar to agent)
          // Use user ID to find namespace
          if (!ctx.session) throw new Error("Unauthorized");

          const { namespacesTable } = await import("../db/schema");
          const ns = await db.query.namespacesTable.findFirst({
              where: eq(namespacesTable.user_id, ctx.session.user.id)
          });
          if (!ns) throw new Error("No namespace found");

          const { callToolHandler } = await createServer(ns.uuid, ctx.session.session.id);
          if (!callToolHandler) throw new Error("Failed to init tools");

          // Execute Code
          const { codeExecutorService } = await import("../lib/sandbox/code-executor.service");

          const result = await codeExecutorService.executeCode(
              dbScript.code,
              callToolHandler
          );

          return {
              success: true,
              result
          };

      } catch (e: any) {
          console.error("Script execution error", e);
          return {
              success: false,
              error: e.message
          };
      }
  }
};
