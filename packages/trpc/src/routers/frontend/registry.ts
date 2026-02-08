import {
  GetCategoriesResponseSchema,
  ListRegistryRequestSchema,
  RegistryListResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createRegistryRouter = (implementations: {
  list: (opts: {
    input: z.infer<typeof ListRegistryRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof RegistryListResponseSchema>>;
  getCategories: (opts: {
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof GetCategoriesResponseSchema>>;
}) => {
  return router({
    list: protectedProcedure
      .input(ListRegistryRequestSchema)
      .query(async ({ input, ctx }) => {
        return implementations.list({ input, ctx });
      }),
    getCategories: protectedProcedure
      .query(async ({ ctx }) => {
        return implementations.getCategories({ ctx });
      }),
  });
};
