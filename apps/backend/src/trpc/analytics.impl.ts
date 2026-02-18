import { createFrontendRouter } from "@repo/trpc/router";
import { analyticsService } from "../lib/analytics/analytics.service";

type Implementations = Parameters<typeof createFrontendRouter>[0];
type AnalyticsImplementations = Implementations["analytics"];

export const analyticsImplementations: AnalyticsImplementations = {
  getStats: async ({ ctx }) => {
    return await analyticsService.getAnalytics(ctx.user.id);
  },
};
