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

import { protectedProcedure, router } from "../../trpc";

export const createSavedScriptsRouter = (
  implementations: {
    getScripts: () => Promise<z.infer<typeof GetSavedScriptsResponseSchema>>;
    createScript: (input: z.infer<typeof CreateSavedScriptRequestSchema>) => Promise<z.infer<typeof CreateSavedScriptResponseSchema>>;
    updateScript: (input: z.infer<typeof UpdateSavedScriptRequestSchema>) => Promise<z.infer<typeof UpdateSavedScriptResponseSchema>>;
    deleteScript: (input: z.infer<typeof DeleteSavedScriptRequestSchema>) => Promise<z.infer<typeof DeleteSavedScriptResponseSchema>>;
    runScript: (input: z.infer<typeof RunSavedScriptRequestSchema>, ctx: any) => Promise<z.infer<typeof RunSavedScriptResponseSchema>>;
  },
) =>
  router({
    get: protectedProcedure
      .output(GetSavedScriptsResponseSchema)
      .query(async () => {
        return await implementations.getScripts();
      }),

    create: protectedProcedure
      .input(CreateSavedScriptRequestSchema)
      .output(CreateSavedScriptResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.createScript(input);
      }),

    update: protectedProcedure
      .input(UpdateSavedScriptRequestSchema)
      .output(UpdateSavedScriptResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.updateScript(input);
      }),

    delete: protectedProcedure
      .input(DeleteSavedScriptRequestSchema)
      .output(DeleteSavedScriptResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.deleteScript(input);
      }),

    run: protectedProcedure
      .input(RunSavedScriptRequestSchema)
      .output(RunSavedScriptResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.runScript(input, ctx);
      }),
  });
