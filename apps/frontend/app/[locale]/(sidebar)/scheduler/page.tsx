"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Play, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateScheduledTaskRequestSchema } from "@repo/zod-types";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateTaskForm = z.infer<typeof CreateScheduledTaskRequestSchema>;

export default function SchedulerPage() {
  const { t } = useTranslations();
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.frontend.scheduler.list.useQuery();
  const createMutation = trpc.frontend.scheduler.create.useMutation();
  const deleteMutation = trpc.frontend.scheduler.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateTaskForm>({
    resolver: zodResolver(CreateScheduledTaskRequestSchema),
    defaultValues: {
      taskDefinition: {
        type: "agent_task",
        target: "",
      }
    }
  });

  const taskType = watch("taskDefinition.type");

  const onSubmit = async (data: CreateTaskForm) => {
    try {
      await createMutation.mutateAsync(data);
      utils.frontend.scheduler.list.invalidate();
      setIsCreateOpen(false);
      reset();
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (confirm("Are you sure?")) {
      await deleteMutation.mutateAsync({ uuid });
      utils.frontend.scheduler.list.invalidate();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarClock className="h-8 w-8" />
                Scheduler
            </h1>
            <p className="text-muted-foreground mt-1">
                Automate tool execution and agent tasks.
            </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Schedule Task
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Scheduled Task</DialogTitle>
                    <DialogDescription>Run a tool or agent prompt on a schedule.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input {...register("name")} placeholder="Daily Cleanup" />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>CRON Expression</Label>
                        <Input {...register("cronExpression")} placeholder="0 0 * * *" />
                        {errors.cronExpression && <p className="text-sm text-red-500">{errors.cronExpression.message}</p>}
                        <p className="text-xs text-muted-foreground">Standard 5-field cron syntax.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Task Type</Label>
                        <Select onValueChange={(val) => setValue("taskDefinition.type", val as any)} defaultValue="agent_task">
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="agent_task">Agent Task (Natural Language)</SelectItem>
                                <SelectItem value="tool_call" disabled>Tool Call (Coming Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{taskType === "agent_task" ? "Prompt / Instruction" : "Tool Name"}</Label>
                        <Textarea
                            {...register("taskDefinition.target")}
                            placeholder={taskType === "agent_task" ? "Summarize the latest logs..." : "server__tool"}
                        />
                        {errors.taskDefinition?.target && <p className="text-sm text-red-500">{errors.taskDefinition.target.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Creating..." : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead>Next Run</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks?.map((task) => (
                        <TableRow key={task.uuid}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{task.name}</span>
                                    {task.description && <span className="text-xs text-muted-foreground">{task.description}</span>}
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="font-mono">{task.cronExpression}</Badge></TableCell>
                            <TableCell>
                                <Badge variant="secondary">{(task.taskDefinition as any).type}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : "Never"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(task.uuid)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && tasks?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No scheduled tasks.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
