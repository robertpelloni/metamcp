import {
  CheckServerHealthRequestSchema,
  CheckServerHealthResponseSchema,
  GetHealthSummaryResponseSchema,
  GetServerHealthRequestSchema,
  GetServerHealthResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createServerHealthRouter = (implementations: {
  checkHealth: (
    input: z.infer<typeof CheckServerHealthRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof CheckServerHealthResponseSchema>>;
  getHealth: (
    input: z.infer<typeof GetServerHealthRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof GetServerHealthResponseSchema>>;
  getSummary: (
    userId: string,
  ) => Promise<z.infer<typeof GetHealthSummaryResponseSchema>>;
  startPeriodicChecks: () => Promise<void>;
  stopPeriodicChecks: () => Promise<void>;
}) => {
  return router({
    checkHealth: protectedProcedure
      .input(CheckServerHealthRequestSchema)
      .output(CheckServerHealthResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.checkHealth(input, ctx.user.id);
      }),

    getHealth: protectedProcedure
      .input(GetServerHealthRequestSchema)
      .output(GetServerHealthResponseSchema)
      .query(async ({ input, ctx }) => {
        return await implementations.getHealth(input, ctx.user.id);
      }),

    getSummary: protectedProcedure
      .output(GetHealthSummaryResponseSchema)
      .query(async ({ ctx }) => {
        return await implementations.getSummary(ctx.user.id);
      }),
  });
};
