import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

import { BaseContext } from "../../trpc";

export const createAgentRouter = (implementations: {
  run: (input: { task: string; policyId?: string }, ctx: BaseContext) => Promise<any>;
}) => {
  return router({
    run: protectedProcedure
      .input(
        z.object({
          task: z.string().min(1),
          policyId: z.string().optional()
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await implementations.run(input, ctx);
      }),
  });
};
