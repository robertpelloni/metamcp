import {
  CreateOAuthClientRequestSchema,
  CreateOAuthClientResponseSchema,
  DeleteOAuthClientRequestSchema,
  ListOAuthClientsResponseSchema,
  RotateSecretRequestSchema,
  RotateSecretResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createOAuthClientsRouter = (implementations: {
  list: (opts: {
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof ListOAuthClientsResponseSchema>>;
  create: (opts: {
    input: z.infer<typeof CreateOAuthClientRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof CreateOAuthClientResponseSchema>>;
  delete: (opts: {
    input: z.infer<typeof DeleteOAuthClientRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<void>;
  rotateSecret: (opts: {
    input: z.infer<typeof RotateSecretRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof RotateSecretResponseSchema>>;
}) => {
  return router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return implementations.list({ ctx });
    }),
    create: protectedProcedure
      .input(CreateOAuthClientRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.create({ input, ctx });
      }),
    delete: protectedProcedure
      .input(DeleteOAuthClientRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.delete({ input, ctx });
      }),
    rotateSecret: protectedProcedure
      .input(RotateSecretRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.rotateSecret({ input, ctx });
      }),
  });
};
