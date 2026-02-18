import { z } from "zod";

export const CostStatsSchema = z.object({
  totalCost: z.number(),
  totalTokens: z.number(),
  count: z.number(),
});

export const GetCostStatsResponseSchema = CostStatsSchema;
