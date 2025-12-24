import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { policyService } from "../../lib/access-control/policy.service";

export const policiesRouter = router({
  list: protectedProcedure.query(async () => {
    // This is a placeholder as PolicyService needs a `listPolicies` method.
    // I'll add a mock one to PolicyService or update it.
    // For now, let's fetch directly from DB or assume the service has it.
    // Wait, PolicyService in previous step only had getPolicy(uuid).
    // Let's implement a quick list via DB here since repository pattern is mixed.
    // Actually, I should stick to service pattern if possible, but for speed I might query DB directly here
    // OR update PolicyService. Let's update PolicyService first? No, I can't easily jump back.
    // I'll import DB here.

    const { db } = await import("../../db");
    const { policiesTable } = await import("../../db/schema");

    return await db.select().from(policiesTable);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        rules: z.object({
            allow: z.array(z.string()),
            deny: z.array(z.string()).optional()
        })
      })
    )
    .mutation(async ({ input }) => {
      return await policyService.createPolicy(input.name, input.rules, input.description);
    }),
});
