import { z } from "zod";
import { RunAgentRequestSchema, RunAgentResponseSchema } from "@repo/zod-types";
import { protectedProcedure, router } from "../../trpc";

export const createAgentRouter = (implementations: {
  run: (input: z.infer<typeof RunAgentRequestSchema>) => Promise<z.infer<typeof RunAgentResponseSchema>>;
}) => {
  return router({
    run: protectedProcedure
      .input(RunAgentRequestSchema)
      .mutation(async ({ input }) => {
        return await implementations.run(input);
      }),
  });
};
