import {
  CreateScheduledTaskRequestSchema,
  DeleteScheduledTaskRequestSchema,
  ListScheduledTasksResponseSchema,
  ScheduledTaskSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createSchedulerRouter = (implementations: {
  list: (opts: {
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof ListScheduledTasksResponseSchema>>;
  create: (opts: {
    input: z.infer<typeof CreateScheduledTaskRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<z.infer<typeof ScheduledTaskSchema>>;
  delete: (opts: {
    input: z.infer<typeof DeleteScheduledTaskRequestSchema>;
    ctx: { user: { id: string } };
  }) => Promise<void>;
}) => {
  return router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return implementations.list({ ctx });
    }),
    create: protectedProcedure
      .input(CreateScheduledTaskRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.create({ input, ctx });
      }),
    delete: protectedProcedure
      .input(DeleteScheduledTaskRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return implementations.delete({ input, ctx });
      }),
  });
};
