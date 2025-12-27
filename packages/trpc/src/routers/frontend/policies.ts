import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";

export const createPoliciesRouter = (implementations: {
  list: () => Promise<any[]>;
  create: (input: { name: string; description?: string; rules: any[] }) => Promise<any>;
  update: (input: { id: string; name: string; rules: any[] }) => Promise<any>;
  delete: (input: { id: string }) => Promise<any>;
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
          rules: z.array(z.any())
        })
      )
      .mutation(async ({ input }) => {
        return await implementations.create(input);
      }),
    update: protectedProcedure
      .input(
          z.object({
              id: z.string(),
              name: z.string(),
              rules: z.array(z.any())
          })
      )
      .mutation(async ({ input }) => {
          return await implementations.update(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
          return await implementations.delete(input);
      })
  });
};
