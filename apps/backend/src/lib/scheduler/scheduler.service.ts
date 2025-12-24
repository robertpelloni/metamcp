import cron from "node-cron";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { scheduledTasksTable, namespacesTable } from "../../db/schema";
import { createServer } from "../metamcp/metamcp-proxy";
import { agentService } from "../ai/agent.service";
import { codeExecutorService } from "../sandbox/code-executor.service";
import { savedScriptService } from "../sandbox/saved-script.service";

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  async start(): Promise<void> {
    console.log("[Scheduler] Starting...");
    const activeTasks = await db.query.scheduledTasksTable.findMany({
        where: eq(scheduledTasksTable.is_active, true)
    });

    for (const task of activeTasks) {
        this.scheduleTask(task);
    }
    console.log(`[Scheduler] Loaded ${activeTasks.length} tasks.`);
  }

  private scheduleTask(task: any) {
      if (!cron.validate(task.cron)) {
          console.error(`[Scheduler] Invalid cron for task ${task.uuid}: ${task.cron}`);
          return;
      }

      const job = cron.schedule(task.cron, async () => {
          console.log(`[Scheduler] Running task ${task.uuid} (${task.task_type})`);
          try {
              // 1. Setup Context (Namespace/Proxy)
              // We need the user's namespace.
              const ns = await db.query.namespacesTable.findFirst({
                  where: eq(namespacesTable.user_id, task.user_id)
              });

              if (!ns) {
                  throw new Error(`No namespace found for user ${task.user_id}`);
              }

              // Create Headless Hub Instance
              const { callToolHandler } = await createServer(ns.uuid, "scheduler-session");
              if (!callToolHandler) throw new Error("Failed to create tool handler");

              // 2. Execute Logic
              if (task.task_type === 'agent') {
                  const { agentTask, policyId } = task.payload;
                  await agentService.runAgent(agentTask, callToolHandler, policyId);
              } else if (task.task_type === 'script') {
                  const { scriptName } = task.payload;
                  const script = await savedScriptService.getScript(scriptName); // Need user scope? logic handles global currently
                  if (script) {
                      await codeExecutorService.executeCode(script.code, callToolHandler);
                  }
              }

              // 3. Update Last Run
              await db.update(scheduledTasksTable)
                .set({ last_run: new Date() })
                .where(eq(scheduledTasksTable.uuid, task.uuid));

          } catch (error) {
              console.error(`[Scheduler] Task ${task.uuid} failed:`, error);
          }
      });

      this.tasks.set(task.uuid, job);
  }

  async createTask(userId: string, cronExpression: string, type: 'agent'|'script', payload: any): Promise<any> {
      const [task] = await db.insert(scheduledTasksTable).values({
          cron: cronExpression,
          task_type: type,
          payload,
          user_id: userId,
          is_active: true
      }).returning();

      this.scheduleTask(task);
      return task;
  }

  async deleteTask(uuid: string): Promise<void> {
      const job = this.tasks.get(uuid);
      if (job) {
          job.stop();
          this.tasks.delete(uuid);
      }
      await db.delete(scheduledTasksTable).where(eq(scheduledTasksTable.uuid, uuid));
  }

  async listTasks(userId: string): Promise<any[]> {
      return await db.select().from(scheduledTasksTable).where(eq(scheduledTasksTable.user_id, userId));
  }
}

export const schedulerService = new SchedulerService();
