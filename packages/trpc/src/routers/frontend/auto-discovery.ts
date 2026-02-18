import {
  ScanForConfigsRequestSchema,
  ScanForConfigsResponseSchema,
  ImportDiscoveredServersRequestSchema,
  ImportDiscoveredServersResponseSchema,
  GetDiscoveryPathsRequestSchema,
  GetDiscoveryPathsResponseSchema,
  AddCustomPathRequestSchema,
  AddCustomPathResponseSchema,
  ScanNpmGlobalRequestSchema,
  ScanNpmGlobalResponseSchema,
  ImportNpmServersRequestSchema,
  ImportNpmServersResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createAutoDiscoveryRouter = (implementations: {
  scanForConfigs: (
    input: z.infer<typeof ScanForConfigsRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof ScanForConfigsResponseSchema>>;
  importDiscovered: (
    input: z.infer<typeof ImportDiscoveredServersRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof ImportDiscoveredServersResponseSchema>>;
  getDiscoveryPaths: (
    input: z.infer<typeof GetDiscoveryPathsRequestSchema>,
  ) => Promise<z.infer<typeof GetDiscoveryPathsResponseSchema>>;
  addCustomPath: (
    input: z.infer<typeof AddCustomPathRequestSchema>,
  ) => Promise<z.infer<typeof AddCustomPathResponseSchema>>;
  scanNpmGlobal: (
    input: z.infer<typeof ScanNpmGlobalRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof ScanNpmGlobalResponseSchema>>;
  importNpmServers: (
    input: z.infer<typeof ImportNpmServersRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof ImportNpmServersResponseSchema>>;
}) => {
  return router({
    scanForConfigs: protectedProcedure
      .input(ScanForConfigsRequestSchema)
      .output(ScanForConfigsResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.scanForConfigs(input, ctx.user.id);
      }),

    importDiscovered: protectedProcedure
      .input(ImportDiscoveredServersRequestSchema)
      .output(ImportDiscoveredServersResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.importDiscovered(input, ctx.user.id);
      }),

    getDiscoveryPaths: protectedProcedure
      .input(GetDiscoveryPathsRequestSchema)
      .output(GetDiscoveryPathsResponseSchema)
      .query(async ({ input }) => {
        return await implementations.getDiscoveryPaths(input);
      }),

    addCustomPath: protectedProcedure
      .input(AddCustomPathRequestSchema)
      .output(AddCustomPathResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.addCustomPath(input);
      }),

    scanNpmGlobal: protectedProcedure
      .input(ScanNpmGlobalRequestSchema)
      .output(ScanNpmGlobalResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.scanNpmGlobal(input, ctx.user.id);
      }),

    importNpmServers: protectedProcedure
      .input(ImportNpmServersRequestSchema)
      .output(ImportNpmServersResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.importNpmServers(input, ctx.user.id);
      }),
  });
};
