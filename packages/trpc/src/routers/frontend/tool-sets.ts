import {
  DeleteToolSetRequestSchema,
  DeleteToolSetResponseSchema,
  GetToolSetsResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createToolSetsRouter = (
  implementations: {
    getToolSets: () => Promise<z.infer<typeof GetToolSetsResponseSchema>>;
    deleteToolSet: (input: z.infer<typeof DeleteToolSetRequestSchema>) => Promise<z.infer<typeof DeleteToolSetResponseSchema>>;
  },
) =>
  router({
    get: protectedProcedure
      .output(GetToolSetsResponseSchema)
      .query(async () => {
        return await implementations.getToolSets();
      }),

    delete: protectedProcedure
      .input(DeleteToolSetRequestSchema)
      .output(DeleteToolSetResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.deleteToolSet(input);
      }),
  });
