import { CallToolHandler, MetaMCPHandlerContext } from "./functional-middleware";
import { rateLimiterService } from "../../access-control/rate-limiter.service";
import { rateLimitService } from "../rate-limit.service";

export const createRateLimitMiddleware = (options: {
  enabled: boolean;
  maxRequests?: number;
  windowMs?: number;
}) => {
  return (next: CallToolHandler): CallToolHandler => {
    return async (request, context: MetaMCPHandlerContext) => {
      if (!options.enabled) {
        return next(request, context);
      }

      // Check for dynamic rule first
      const toolName = request.params.name;
      const userId = context.userId;

      let maxRequests = options.maxRequests;
      let windowMs = options.windowMs;

      // If we have a user context (or even without), check for specific rules
      try {
        // findMatchingRule will check user-specific rules first, then global
        // It internally handles minimatch against tool name
        const rule = await rateLimitService.findMatchingRule(toolName, userId);

        if (rule) {
          maxRequests = rule.max_requests;
          windowMs = rule.window_ms;
        }
      } catch (e) {
        console.warn("Failed to check rate limit rules", e);
      }

      // If no limit defined (neither rule nor default), allow
      if (!maxRequests || !windowMs) {
        return next(request, context);
      }

      // Identify by User ID (preferred) or Session ID
      const identifier = userId || context.sessionId;
      // Key should include tool name if rule is specific?
      // If rule is global "*", key is user:global.
      // If rule is "github__*", key is user:github__*.
      // But we just matched a rule. If we matched a rule, the limit applies to THIS rule's scope.
      // So key should probably be `rate_limit:${rule.uuid}:${identifier}`?
      // Or if using default options, `rate_limit:default:${identifier}`.

      // Let's refine key strategy:
      // If dynamic rule matched -> key = `rate_limit:rule:${rule.uuid}:${identifier}`
      // If fallback -> key = `rate_limit:default:${identifier}` (global throttle)

      let key = `rate_limit:default:${identifier}`;

      // We need the rule object again if we want UUID.
      // Optimization: findMatchingRule returns the rule object.
      // Let's re-fetch or trust the previous call.
      const rule = await rateLimitService.findMatchingRule(toolName, userId);
      if (rule) {
         key = `rate_limit:rule:${rule.uuid}:${identifier}`;
         maxRequests = rule.max_requests;
         windowMs = rule.window_ms;
      }

      const allowed = await rateLimiterService.checkLimit(
        key,
        maxRequests,
        windowMs
      );

      if (!allowed) {
        return {
          content: [
            {
              type: "text",
              text: `Rate limit exceeded for tool '${toolName}'. Limit: ${maxRequests} reqs / ${windowMs / 1000}s.`,
            },
          ],
          isError: true,
        };
      }

      return next(request, context);
    };
  };
};
