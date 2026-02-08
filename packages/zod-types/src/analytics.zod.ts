import { z } from "zod";

export const AnalyticsStatsSchema = z.object({
  totalCalls: z.number(),
  errorRate: z.number(),
  topTools: z.array(z.object({ name: z.string(), count: z.number() })),
  dailyUsage: z.array(z.object({ date: z.string(), count: z.number() })),
});
