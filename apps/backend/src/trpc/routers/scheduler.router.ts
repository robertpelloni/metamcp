import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { schedulerService } from "../../lib/scheduler/scheduler.service";

export const schedulerRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await schedulerService.listTasks(ctx.session.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
        cron: z.string(),
        type: z.enum(["agent", "script"]),
        payload: z.any()
    }))
    .mutation(async ({ ctx, input }) => {
        return await schedulerService.createTask(ctx.session.user.id, input.cron, input.type, input.payload);
    }),

  delete: protectedProcedure
    .input(z.object({ uuid: z.string() }))
    .mutation(async ({ input }) => {
      await schedulerService.deleteTask(input.uuid);
      return { success: true };
    }),
});
