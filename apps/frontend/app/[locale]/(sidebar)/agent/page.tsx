"use client";

import { Bot, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LogEntry } from "@/components/log-entry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export default function AgentPage() {
  const [task, setTask] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("none");
  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { data: policies } = trpc.frontend.policies.list.useQuery();
  const runAgentMutation = trpc.frontend.agent.run.useMutation();

  // Poll for logs when running or when we have a session ID
  const { data: logsData } = trpc.frontend.logs.get.useQuery(
    { sessionId: sessionId || "", limit: 100 },
    {
      enabled: !!sessionId,
      refetchInterval: isRunning ? 1000 : 5000, // Poll faster when running
    },
  );

  const handleRun = async () => {
    if (!task.trim()) {
      toast.error("Please enter a task");
      return;
    }

    setIsRunning(true);
    setResult(null);

    // Generate a new session ID for this run
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    try {
      const response = await runAgentMutation.mutateAsync({
        task,
        policyId: selectedPolicyId === "none" ? undefined : selectedPolicyId,
        sessionId: newSessionId,
      });

      if (response.success) {
        setResult(JSON.stringify(response.result, null, 2));
        toast.success("Agent finished successfully");
      } else {
        setResult(`Error: ${response.error}`);
        toast.error("Agent failed");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setResult(`Error: ${errorMessage}`);
      toast.error("Agent failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Autonomous Agent</h1>
          <p className="text-sm text-muted-foreground">
            Delegate complex tasks to an AI agent that can use tools.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Task Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Task Description</Label>
              <Textarea
                placeholder="e.g. Find the latest issue in repo X and summarize it..."
                className="min-h-[150px]"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Security Policy</Label>
              <Select
                value={selectedPolicyId}
                onValueChange={setSelectedPolicyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a policy..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Policy (Unrestricted)</SelectItem>
                  {policies?.map((policy) => (
                    <SelectItem key={policy.uuid} value={policy.uuid}>
                      {policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.8rem] text-muted-foreground">
                Restricts which tools the agent can access.
              </p>
            </div>

            <Button className="w-full" onClick={handleRun} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Agent...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Agent
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-1 space-y-6">
          {/* Live Logs Section */}
          <Card className="flex flex-col max-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Live Activity</span>
                {isRunning && (
                  <span className="text-xs text-green-500 animate-pulse">
                    ● Live
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="bg-black min-h-[200px] p-4 font-mono text-sm">
                {!logsData?.data || logsData.data.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    {isRunning
                      ? "Waiting for agent activity..."
                      : "No activity logs yet."}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logsData.data.map((log) => (
                      <LogEntry key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Final Output Section */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Final Output</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
              {result ? (
                <pre className="w-full h-full p-4 bg-muted rounded-md overflow-auto text-xs font-mono whitespace-pre-wrap">
                  {result}
                </pre>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md p-8">
                  Agent output will appear here
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
