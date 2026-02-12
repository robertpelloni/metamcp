import { configService } from "../../config.service";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiterService {
  private limits = new Map<string, RateLimitEntry>();
  // Default: 60 calls per minute
  private readonly DEFAULT_WINDOW_MS = 60 * 1000;
  private readonly DEFAULT_MAX_REQUESTS = 60;

  async checkLimit(key: string, maxRequests: number = this.DEFAULT_MAX_REQUESTS, windowMs: number = this.DEFAULT_WINDOW_MS): Promise<boolean> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  // Cleanup old entries periodically (could be a scheduled task)
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiterService = new RateLimiterService();
