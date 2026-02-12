import { CallToolHandler, MetaMCPHandlerContext } from "./functional-middleware";
import { rateLimiterService } from "../../access-control/rate-limiter.service";

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

      // Identify by User ID (preferred) or Session ID
      const identifier = context.userId || context.sessionId;
      const key = `rate_limit:${identifier}`;

      const allowed = await rateLimiterService.checkLimit(
        key,
        options.maxRequests,
        options.windowMs
      );

      if (!allowed) {
        return {
          content: [
            {
              type: "text",
              text: `Rate limit exceeded. Please wait before making more requests.`,
            },
          ],
          isError: true,
        };
      }

      return next(request, context);
    };
  };
};
