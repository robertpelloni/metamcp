import { z } from "zod";

export const ScheduledTaskSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  cronExpression: z.string(),
  isActive: z.boolean(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
  taskDefinition: z.object({
    type: z.enum(["tool_call", "agent_task"]),
    target: z.string(),
    arguments: z.record(z.any()).optional(),
  }),
});

export const ListScheduledTasksResponseSchema = z.array(ScheduledTaskSchema);

export const CreateScheduledTaskRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  cronExpression: z.string(),
  taskDefinition: z.object({
    type: z.enum(["tool_call", "agent_task"]),
    target: z.string(),
    arguments: z.record(z.any()).optional(),
  }),
});

export const DeleteScheduledTaskRequestSchema = z.object({
  uuid: z.string(),
});
