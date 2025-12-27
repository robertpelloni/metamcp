import { agentService } from "../../lib/ai/agent.service";
import { createServer } from "../../lib/metamcp/metamcp-proxy";
import { db } from "../../db";
import { namespacesTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { BaseContext } from "@repo/trpc";

// Since the shared package defines the router, we just need to provide the implementation function
// compatible with `implementations.run(input)`.
// However, the backend needs Access to Context (for session ID).
// The shared package's `createAgentRouter` takes `implementations` which only get `input`.
// This is a flaw in the shared package design if Context is needed.
//
// Let's check `packages/trpc/src/routers/frontend/agent.ts`:
// .mutation(async ({ input }) => { return await implementations.run(input); })
// It DOES NOT pass context!
//
// We must update the shared package to pass Context if we want to use it.
// OR we move the Router definition to the backend entirely? No, the shared package is for type safety.
//
// Refactor Strategy: Update `packages/trpc` to pass `ctx` to implementations.

export const agentImplementations = {
  run: async (input: { task: string; policyId?: string }, ctx: BaseContext) => {
      const sessionId = ctx.session.session.id;

      const ns = await db.query.namespacesTable.findFirst({
          where: eq(namespacesTable.user_id, ctx.session.user.id)
      });

      if (!ns) throw new Error("No namespace found for user");

      const { callToolHandler } = await createServer(ns.uuid, sessionId);

      if (!callToolHandler) {
          throw new Error("Failed to initialize internal tool handler");
      }

      const result = await agentService.runAgent(
          input.task,
          callToolHandler,
          input.policyId
      );

      return result;
  }
};
