import { ListCatalogResponseSchema } from "@repo/zod-types";
import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";

export const createCatalogRouter = (
  implementations: {
    list: () => Promise<z.infer<typeof ListCatalogResponseSchema>>;
  }
) => {
  return router({
    list: protectedProcedure
      .output(ListCatalogResponseSchema)
      .query(async () => {
        return await implementations.list();
      }),
  });
};
