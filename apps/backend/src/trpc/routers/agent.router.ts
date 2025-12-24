import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { agentService } from "../../lib/ai/agent.service";
import { createServer } from "../../lib/metamcp/metamcp-proxy";

export const agentRouter = router({
  run: protectedProcedure
    .input(
      z.object({
        task: z.string().min(1),
        policyId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = ctx.session.session.id;

      const { namespacesTable } = await import("../../db/schema");
      const { db } = await import("../../db");
      const { eq } = await import("drizzle-orm");

      const ns = await db.query.namespacesTable.findFirst({
          where: eq(namespacesTable.user_id, ctx.session.user.id)
      });

      if (!ns) throw new Error("No namespace found for user");

      // Create the Hub Server instance
      // Note: We ignore the return `server` object (JSON-RPC) and use the exposed `callToolHandler`.
      const { callToolHandler } = await createServer(ns.uuid, sessionId);

      if (!callToolHandler) {
          throw new Error("Failed to initialize internal tool handler");
      }

      // Execute Agent
      const result = await agentService.runAgent(
          input.task,
          callToolHandler,
          input.policyId
      );

      return result;
    }),
});
