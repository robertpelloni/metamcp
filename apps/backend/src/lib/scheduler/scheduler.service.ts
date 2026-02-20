import cron from "node-cron";
import { db } from "../../db";
import { scheduledTasksTable } from "../../db/schema-scheduler";
import { eq, sql } from "drizzle-orm";
import { agentService } from "../ai/agent.service";
import { mcpServerPool } from "../metamcp/mcp-server-pool";
import { v4 as uuidv4 } from "uuid";

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.init();
  }

  async init() {
    console.log("[Scheduler] Initializing...");
    const tasks = await db.query.scheduledTasksTable.findMany({
      where: eq(scheduledTasksTable.is_active, true),
    });

    for (const task of tasks) {
      this.scheduleTask(task);
    }
    console.log(`[Scheduler] Loaded ${tasks.length} active tasks.`);
  }

  scheduleTask(task: any) {
    if (this.jobs.has(task.uuid)) {
      this.jobs.get(task.uuid)?.stop();
    }

    if (!cron.validate(task.cron_expression)) {
      console.error(`[Scheduler] Invalid cron for task ${task.uuid}: ${task.cron_expression}`);
      return;
    }

    const job = cron.schedule(task.cron_expression, async () => {
      console.log(`[Scheduler] Running task: ${task.name} (${task.uuid})`);
      await this.executeTask(task);
    });

    this.jobs.set(task.uuid, job);
  }

  async executeTask(task: any) {
    try {
      if (task.task_definition.type === "agent_task") {
        // Run as autonomous agent
        await agentService.runAgent(
          task.task_definition.target, // The prompt
          // We need a dummy callback handler or reuse the proxy logic (headless)
          // For now, we'll implement a headless handler
          this.createHeadlessToolHandler(task.user_id),
          undefined, // policyId (could be added to task def)
          task.user_id
        );
      }

      // Update last run time
      await db.update(scheduledTasksTable)
        .set({ last_run_at: new Date() })
        .where(eq(scheduledTasksTable.uuid, task.uuid));

    } catch (error) {
      console.error(`[Scheduler] Task failed: ${task.name}`, error);
    }
  }

  private createHeadlessToolHandler(userId: string) {
    // This duplicates some logic from metamcp-proxy.ts
    // Ideally we export callToolHandler from metamcp-proxy.ts or refactor
    // For MVP, we'll assume the agent service can run but tool calls might fail if they need specific session context
    // Real implementation requires a headless session/context creation.

    // We will import `createServer` logic or extract the handler.
    // Given the complexity, for this iteration, we'll placeholder this.
    // The `metamcp-proxy.ts` is tightly coupled to request/response.

    // Solution: We import `callToolHandler` if we export it, or replicate minimal logic.
    // Let's assume we can fetch the `callToolHandler` from a utility.

    return async (name: string, args: any, meta?: any) => {
       console.log(`[Scheduler:Headless] Calling tool ${name}`);
       // TODO: Implement headless tool execution (requires refactoring metamcp-proxy)
       // For now, we allow the agent to "think" but tools won't actually fire without a session.
       return { content: [{ type: "text", text: "Headless tool execution not fully implemented yet." }] };
    };
  }

  async createTask(data: any) {
    const [task] = await db.insert(scheduledTasksTable).values({
      uuid: uuidv4(),
      ...data
    }).returning();

    if (task.is_active) {
      this.scheduleTask(task);
    }
    return task;
  }

  async deleteTask(uuid: string) {
    await db.delete(scheduledTasksTable).where(eq(scheduledTasksTable.uuid, uuid));
    this.jobs.get(uuid)?.stop();
    this.jobs.delete(uuid);
  }
}

export const schedulerService = new SchedulerService();
