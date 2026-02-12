import {
  AuditLogListResponseSchema,
  ListAuditLogsRequestSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createAuditRouter = (implementations: {
  list: (opts: {
    input: z.infer<typeof ListAuditLogsRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof AuditLogListResponseSchema>>;
}) => {
  return router({
    list: protectedProcedure
      .input(ListAuditLogsRequestSchema)
      .query(async ({ input, ctx }) => {
        return implementations.list({ input, ctx });
      }),
  });
};
