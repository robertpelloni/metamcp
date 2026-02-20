import { AppRouter } from "@repo/trpc";
import { schedulerService } from "../lib/scheduler/scheduler.service";
import { db } from "../db";
import { scheduledTasksTable } from "../db/schema-scheduler";
import { eq } from "drizzle-orm";

export const schedulerImplementations: AppRouter["frontend"]["scheduler"] = {
  list: async () => {
    const tasks = await db.query.scheduledTasksTable.findMany();
    return tasks.map(t => ({
      uuid: t.uuid,
      name: t.name,
      description: t.description,
      cronExpression: t.cron_expression,
      isActive: t.is_active,
      lastRunAt: t.last_run_at?.toISOString() || null,
      nextRunAt: t.next_run_at?.toISOString() || null,
      taskDefinition: t.task_definition as any,
    }));
  },
  create: async ({ input, ctx }) => {
    const task = await schedulerService.createTask({
      name: input.name,
      description: input.description,
      cron_expression: input.cronExpression,
      task_definition: input.taskDefinition,
      user_id: ctx.user.id,
    });
    return {
      uuid: task.uuid,
      name: task.name,
      description: task.description,
      cronExpression: task.cron_expression,
      isActive: task.is_active,
      lastRunAt: task.last_run_at?.toISOString() || null,
      nextRunAt: task.next_run_at?.toISOString() || null,
      taskDefinition: task.task_definition as any,
    };
  },
  delete: async ({ input }) => {
    await schedulerService.deleteTask(input.uuid);
  },
};
