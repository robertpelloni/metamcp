import { z } from "zod";
import {
  CreatePolicySchema,
  DeletePolicySchema,
  PolicySchema,
  UpdatePolicySchema,
} from "@repo/zod-types";

import { protectedProcedure, router } from "../../trpc";

export const createPoliciesRouter = (implementations: {
  list: () => Promise<z.infer<typeof PolicySchema>[]>;
  create: (input: z.infer<typeof CreatePolicySchema>) => Promise<z.infer<typeof PolicySchema>>;
  update: (input: z.infer<typeof UpdatePolicySchema>) => Promise<z.infer<typeof PolicySchema>>;
  delete: (input: z.infer<typeof DeletePolicySchema>) => Promise<void>;
}) => {
  return router({
    list: protectedProcedure.query(async () => {
      return await implementations.list();
    }),
    create: protectedProcedure
      .input(CreatePolicySchema)
      .mutation(async ({ input }) => {
        return await implementations.create(input);
      }),
    update: protectedProcedure
      .input(UpdatePolicySchema)
      .mutation(async ({ input }) => {
        return await implementations.update(input);
      }),
    delete: protectedProcedure
      .input(DeletePolicySchema)
      .mutation(async ({ input }) => {
        return await implementations.delete(input);
      }),
  });
};
