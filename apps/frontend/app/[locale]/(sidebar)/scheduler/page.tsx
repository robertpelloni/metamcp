"use client";

import { Calendar, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "@/hooks/useTranslations";
import { vanillaTrpcClient } from "@/lib/trpc";

interface ScheduledTask {
    uuid: string;
    cron: string;
    task_type: string;
    payload: any;
    last_run: string | null;
    is_active: boolean;
}

export default function SchedulerPage() {
  const { t } = useTranslations();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Form State
  const [cron, setCron] = useState("0 9 * * *");
  const [type, setType] = useState<"agent" | "script">("agent");
  const [agentTask, setAgentTask] = useState("");
  const [scriptName, setScriptName] = useState("");

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await vanillaTrpcClient.frontend.scheduler.list.query();
      setTasks(response);
    } catch (error) {
      toast.error(t("common:errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await vanillaTrpcClient.frontend.scheduler.delete.mutate({ id: deleteId });
      toast.success(t("common:deleteSuccess"));
      fetchTasks();
    } catch (error) {
      toast.error(t("common:deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const handleCreate = async () => {
      try {
          let payload = {};
          if (type === "agent") {
              if (!agentTask) return toast.error("Agent task is required");
              payload = { agentTask };
          } else {
              if (!scriptName) return toast.error("Script name is required");
              payload = { scriptName };
          }

          await vanillaTrpcClient.frontend.scheduler.create.mutate({
              cron,
              type,
              payload
          });

          toast.success("Task scheduled");
          setIsCreateOpen(false);
          fetchTasks();
      } catch (e: any) {
          toast.error(`Failed: ${e.message}`);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Scheduler</h1>
            <p className="text-sm text-muted-foreground">
              Manage periodic background tasks.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.uuid}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {task.cron}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setDeleteId(task.uuid)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-sm mb-1 uppercase text-muted-foreground">{task.task_type}</div>
              <p className="text-sm mb-2">
                  {task.task_type === 'agent'
                    ? `Task: "${task.payload.agentTask}"`
                    : `Script: ${task.payload.scriptName}`
                  }
              </p>
              <div className="text-xs text-muted-foreground">
                  Last Run: {task.last_run ? new Date(task.last_run).toLocaleString() : "Never"}
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No scheduled tasks.
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Task Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="agent">Autonomous Agent</SelectItem>
                        <SelectItem value="script">Saved Script</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 9 * * *" />
              <p className="text-[0.8rem] text-muted-foreground">min hour day month weekday</p>
            </div>
            {type === "agent" ? (
                <div className="space-y-2">
                    <Label>Instruction</Label>
                    <Input value={agentTask} onChange={(e) => setAgentTask(e.target.value)} placeholder="e.g. Check GitHub notifications" />
                </div>
            ) : (
                <div className="space-y-2">
                    <Label>Script Name</Label>
                    <Input value={scriptName} onChange={(e) => setScriptName(e.target.value)} placeholder="e.g. daily_cleanup" />
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common:confirmDelete")}</DialogTitle>
            <DialogDescription>
              Stop this task?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common:cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common:delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
