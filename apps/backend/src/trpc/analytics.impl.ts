import { createFrontendRouter } from "@repo/trpc/router";
import { analyticsService } from "../lib/analytics/analytics.service";
import { costTrackingService } from "../lib/analytics/cost-tracking.service";

type Implementations = Parameters<typeof createFrontendRouter>[0];
type AnalyticsImplementations = Implementations["analytics"];

export const analyticsImplementations: AnalyticsImplementations = {
  getStats: async ({ ctx }) => {
    return await analyticsService.getAnalytics(ctx.user.id);
  },
  getCostStats: async ({ ctx }) => {
    return await costTrackingService.getStats();
  },
};
