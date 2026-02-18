import { db } from "../../db";
import { llmUsageLogsTable } from "../../db/schema";
import { randomUUID } from "crypto";

interface PricingModel {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

// Current pricing as of Jan 2026 (placeholder values, adjust as needed)
const PRICING: Record<string, PricingModel> = {
  // OpenAI
  "gpt-4o": { inputCostPer1M: 2.50, outputCostPer1M: 10.00 },
  "gpt-4o-mini": { inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  "text-embedding-3-small": { inputCostPer1M: 0.02, outputCostPer1M: 0.0 },
  "text-embedding-3-large": { inputCostPer1M: 0.13, outputCostPer1M: 0.0 },

  // Anthropic (if used later)
  "claude-3-5-sonnet-latest": { inputCostPer1M: 3.00, outputCostPer1M: 15.00 },

  // Default fallback
  "default": { inputCostPer1M: 0, outputCostPer1M: 0 }
};

export class CostTrackingService {

  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Normalize model name logic if needed
    const pricing = PRICING[model] || PRICING["default"];

    const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPer1M;

    return inputCost + outputCost;
  }

  async trackUsage(
    model: string,
    context: string,
    inputTokens: number,
    outputTokens: number,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;

    try {
      await db.insert(llmUsageLogsTable).values({
        uuid: randomUUID(),
        model,
        context,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        cost_usd: cost,
        user_id: userId,
        metadata: metadata,
      });
    } catch (error) {
      console.error("Failed to log LLM usage:", error);
    }
  }

  async getStats(days = 30) {
    // Basic aggregation (in a real app, do this in SQL)
    const logs = await db.query.llmUsageLogsTable.findMany({
        // In a real implementation, add date filtering here
    });

    // TODO: Implement date filtering and aggregation in SQL for performance
    // For now, this is a placeholder structure
    const totalCost = logs.reduce((acc, log) => acc + log.cost_usd, 0);
    const totalTokens = logs.reduce((acc, log) => acc + log.total_tokens, 0);

    return {
        totalCost,
        totalTokens,
        count: logs.length
    };
  }
}

export const costTrackingService = new CostTrackingService();
