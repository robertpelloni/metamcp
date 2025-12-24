import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

export const createPoliciesRouter = (implementations: {
  list: () => Promise<any[]>;
  create: (input: { name: string; description?: string; rules: { allow: string[]; deny?: string[] } }) => Promise<any>;
}) => {
  return router({
    list: protectedProcedure.query(async () => {
      return await implementations.list();
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
        return await implementations.create(input);
      }),
  });
};
