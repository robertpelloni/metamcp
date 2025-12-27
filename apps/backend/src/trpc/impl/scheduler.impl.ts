import { schedulerService } from "../../lib/scheduler/scheduler.service";
import { BaseContext } from "@repo/trpc";

export const schedulerImplementations = {
  list: async (_input: any, ctx: BaseContext) => {
    return await schedulerService.listTasks(ctx.session.user.id);
  },
  create: async (input: { cron: string; type: "agent" | "script"; payload: any }, ctx: BaseContext) => {
    return await schedulerService.createTask(ctx.session.user.id, input.cron, input.type, input.payload);
  },
  delete: async (input: { id: string }) => {
    return await schedulerService.deleteTask(input.id);
  }
};
