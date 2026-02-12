import { AnalyticsStatsSchema } from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createAnalyticsRouter = (implementations: {
  getStats: (opts: {
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof AnalyticsStatsSchema>>;
}) => {
  return router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return implementations.getStats({ ctx });
    }),
  });
};
