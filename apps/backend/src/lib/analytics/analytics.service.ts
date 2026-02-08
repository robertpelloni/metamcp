import { db } from "../../db";
import { toolCallLogsTable } from "../../db/schema";
import { sql, desc, count, gt } from "drizzle-orm";

export interface AnalyticsStats {
  totalCalls: number;
  errorRate: number;
  topTools: { name: string; count: number }[];
  dailyUsage: { date: string; count: number }[];
}

export class AnalyticsService {
  async getAnalytics(userId?: string): Promise<AnalyticsStats> {
    // Basic stats aggregation
    // Note: userId filter is tricky on logs unless we join with sessions/users or start logging userId
    // For now, we'll return global stats or rely on future log schema updates.

    // 1. Total Calls
    const [totalCallsResult] = await db
      .select({ count: count() })
      .from(toolCallLogsTable);
    const totalCalls = totalCallsResult.count;

    // 2. Error Rate
    const [errorCallsResult] = await db
      .select({ count: count() })
      .from(toolCallLogsTable)
      .where(sql`${toolCallLogsTable.error} IS NOT NULL`);
    const errorCount = errorCallsResult.count;
    const errorRate = totalCalls > 0 ? errorCount / totalCalls : 0;

    // 3. Top Tools (Top 5)
    const topTools = await db
      .select({
        name: toolCallLogsTable.tool_name,
        count: count(),
      })
      .from(toolCallLogsTable)
      .groupBy(toolCallLogsTable.tool_name)
      .orderBy(desc(count()))
      .limit(5);

    // 4. Daily Usage (Last 7 Days)
    // Using PostgreSQL date_trunc
    const dailyUsage = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${toolCallLogsTable.created_at}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(toolCallLogsTable)
      .where(gt(toolCallLogsTable.created_at, sql`now() - interval '7 days'`))
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    return {
      totalCalls,
      errorRate,
      topTools,
      dailyUsage,
    };
  }
}

export const analyticsService = new AnalyticsService();
