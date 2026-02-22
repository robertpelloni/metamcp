import { eq, and, or, sql } from "drizzle-orm";
import { minimatch } from "minimatch";
import { db } from "../../db";
import { rateLimitsTable } from "../../db/schema";
import { SubscribableCache } from "./tools-sync-cache"; // Reusing cache pattern or create new

export interface RateLimitRule {
  uuid: string;
  name: string;
  tool_pattern: string;
  max_requests: number;
  window_ms: number;
  user_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class RateLimitService {
  // Simple in-memory cache for rules
  private rulesCache: { [userId: string]: RateLimitRule[] } = {};
  private globalRulesCache: RateLimitRule[] | null = null;
  private lastCacheUpdate = 0;
  private CACHE_TTL = 60000; // 1 minute

  async listRules(userId?: string): Promise<RateLimitRule[]> {
    const conditions = [];
    if (userId) {
       // specific user OR global (null)
       conditions.push(or(eq(rateLimitsTable.user_id, userId), sql`${rateLimitsTable.user_id} IS NULL`));
    } else {
       // only global
       conditions.push(sql`${rateLimitsTable.user_id} IS NULL`);
    }

    const rules = await db.select().from(rateLimitsTable).where(and(...conditions));
    return rules;
  }

  async getRule(uuid: string): Promise<RateLimitRule | undefined> {
    const [rule] = await db.select().from(rateLimitsTable).where(eq(rateLimitsTable.uuid, uuid));
    return rule;
  }

  async createRule(
    name: string,
    toolPattern: string,
    maxRequests: number,
    windowMs: number,
    userId?: string | null
  ): Promise<RateLimitRule> {
    const [rule] = await db
      .insert(rateLimitsTable)
      .values({
        name,
        tool_pattern: toolPattern,
        max_requests: maxRequests,
        window_ms: windowMs,
        user_id: userId,
      })
      .returning();

    this.invalidateCache();
    return rule;
  }

  async updateRule(
    uuid: string,
    updates: Partial<Omit<RateLimitRule, "uuid" | "user_id" | "created_at" | "updated_at">>
  ): Promise<RateLimitRule> {
    const [updated] = await db
      .update(rateLimitsTable)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(rateLimitsTable.uuid, uuid))
      .returning();

    this.invalidateCache();
    return updated;
  }

  async deleteRule(uuid: string): Promise<boolean> {
    const result = await db.delete(rateLimitsTable).where(eq(rateLimitsTable.uuid, uuid)).returning({ uuid: rateLimitsTable.uuid });
    this.invalidateCache();
    return result.length > 0;
  }

  private invalidateCache() {
    this.rulesCache = {};
    this.globalRulesCache = null;
    this.lastCacheUpdate = 0;
  }

  // Helper for middleware to find matching rule
  async findMatchingRule(toolName: string, userId?: string): Promise<RateLimitRule | null> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.CACHE_TTL) {
       // Refresh cache logic could be improved to not block, but for now simple fetch
       this.invalidateCache();
       this.lastCacheUpdate = now;
    }

    let userRules = this.rulesCache[userId || "global"];
    if (!userRules) {
        userRules = await this.listRules(userId);
        this.rulesCache[userId || "global"] = userRules;
    }

    // Find first matching rule (priority by specificity?)
    // For now, first match in DB order (which is usually insertion order unless ordered).
    // Better to sort by specificity (exact match > pattern).
    // Let's simple check all and pick "best" match (longest pattern?)

    const activeRules = userRules.filter(r => r.is_active);

    let bestMatch: RateLimitRule | null = null;
    let bestMatchLength = -1;

    for (const rule of activeRules) {
        if (minimatch(toolName, rule.tool_pattern)) {
            // Prefer exact match or longer pattern
            if (rule.tool_pattern.length > bestMatchLength) {
                bestMatch = rule;
                bestMatchLength = rule.tool_pattern.length;
            }
        }
    }

    return bestMatch;
  }
}

export const rateLimitService = new RateLimitService();
