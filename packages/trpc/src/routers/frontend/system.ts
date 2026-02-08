import {
  GetSystemInfoResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createSystemRouter = (implementations: {
  getInfo: (opts: {
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof GetSystemInfoResponseSchema>>;
}) => {
  return router({
    getInfo: protectedProcedure
      .query(async ({ ctx }) => {
        return implementations.getInfo({ ctx });
      }),
  });
};
