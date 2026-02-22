import {
  CreateRateLimitRequestSchema,
  CreateRateLimitResponseSchema,
  DeleteRateLimitRequestSchema,
  DeleteRateLimitResponseSchema,
  ListRateLimitsResponseSchema,
  UpdateRateLimitRequestSchema,
  UpdateRateLimitResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createRateLimitsRouter = (
  implementations: {
    list: (userId?: string) => Promise<z.infer<typeof ListRateLimitsResponseSchema>>;
    create: (input: z.infer<typeof CreateRateLimitRequestSchema>, userId?: string) => Promise<z.infer<typeof CreateRateLimitResponseSchema>>;
    update: (input: z.infer<typeof UpdateRateLimitRequestSchema>) => Promise<z.infer<typeof UpdateRateLimitResponseSchema>>;
    delete: (input: z.infer<typeof DeleteRateLimitRequestSchema>) => Promise<z.infer<typeof DeleteRateLimitResponseSchema>>;
  },
) =>
  router({
    list: protectedProcedure
      .output(ListRateLimitsResponseSchema)
      .query(async ({ ctx }) => {
        return await implementations.list(ctx.user.id);
      }),

    create: protectedProcedure
      .input(CreateRateLimitRequestSchema)
      .output(CreateRateLimitResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.create(input, ctx.user.id);
      }),

    update: protectedProcedure
      .input(UpdateRateLimitRequestSchema)
      .output(UpdateRateLimitResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.update(input);
      }),

    delete: protectedProcedure
      .input(DeleteRateLimitRequestSchema)
      .output(DeleteRateLimitResponseSchema)
      .mutation(async ({ input }) => {
        return await implementations.delete(input);
      }),
  });
