import {
  DeleteSavedScriptRequestSchema,
  DeleteSavedScriptResponseSchema,
  GetSavedScriptsResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createSavedScriptsRouter = (
  implementations: {
    getScripts: () => Promise<z.infer<typeof GetSavedScriptsResponseSchema>>;
    deleteScript: (input: z.infer<typeof DeleteSavedScriptRequestSchema>) => Promise<z.infer<typeof DeleteSavedScriptResponseSchema>>;
  },
) =>
  router({
    get: protectedProcedure
      .output(GetSavedScriptsResponseSchema)
      .query(async () => {
        return await implementations.getScripts();
      }),

    delete: protectedProcedure
      .input(DeleteSavedScriptRequestSchema)
      .output(DeleteSavedScriptResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.deleteScript(input);
      }),
  });
