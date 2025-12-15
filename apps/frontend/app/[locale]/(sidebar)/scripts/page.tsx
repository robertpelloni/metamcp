"use client";

import { FileCode, Trash2, Play, Bot } from "lucide-react";
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
import { useTranslations } from "@/hooks/useTranslations";
import { vanillaTrpcClient } from "@/lib/trpc";
import { SavedScript } from "@repo/zod-types";

export default function ScriptsPage() {
  const { t } = useTranslations();
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Agent Test State
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentTask, setAgentTask] = useState("");
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      const response = await vanillaTrpcClient.frontend.savedScripts.get.query();
      if (response.success) {
        // Map strings to Dates to match type definition
        const data = response.data.map((s: any) => ({
            ...s,
            createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
        }));
        setScripts(data);
      }
    } catch (error) {
      toast.error(t("common:errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await vanillaTrpcClient.frontend.savedScripts.delete.mutate({ uuid: deleteId });
      toast.success(t("common:deleteSuccess"));
      fetchScripts();
    } catch (error) {
      toast.error(t("common:deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const runTestAgent = async () => {
      setAgentRunning(true);
      setAgentResult(null);
      try {
          // This is a bit of a hack: we call the tool implementation directly through TRPC if exposed,
          // OR we can just instruct the user to use the playground.
          // Since we don't have a direct TRPC router for 'run_agent' exposed to frontend yet (it's in the proxy),
          // We will mock the output or add a specific router later.
          // For now, let's just show a placeholder message explaining how to use it via MCP client.

          // Actually, let's just simulate the UI for now as I haven't added `runAgent` to frontend TRPC router.
          setAgentResult("To run the agent, please connect an MCP Client (like Claude Desktop) and use the `run_agent` tool. Frontend execution coming soon.");
      } catch (e) {
          setAgentResult("Error running agent");
      } finally {
          setAgentRunning(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">{t("navigation:savedScripts")}</h1>
            <p className="text-sm text-muted-foreground">
              Manage your saved Code Mode scripts
            </p>
          </div>
        </div>
        <Button onClick={() => setAgentDialogOpen(true)} variant="outline">
            <Bot className="mr-2 h-4 w-4" />
            Test Autonomous Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script) => (
          <Card key={script.uuid}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {script.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setDeleteId(script.uuid)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                {script.description || "No description"}
              </div>
              <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-hidden h-24 relative">
                <pre>{script.code}</pre>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent" />
              </div>
            </CardContent>
          </Card>
        ))}
        {scripts.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No saved scripts found. Use the `save_script` tool in Code Mode to create one.
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common:confirmDelete")}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this script? This action cannot be undone.
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

      <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Autonomous Agent Playground</DialogTitle>
                <DialogDescription>
                    Test the `run_agent` tool. (Currently for instruction only).
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md text-sm">
                    <p className="font-semibold mb-2">How to use:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Connect your MCP Client (e.g. Claude Desktop) to MetaMCP.</li>
                        <li>Type: <span className="font-mono bg-background px-1 rounded">Run an agent to [your task]</span></li>
                        <li>The Hub will use <span className="font-mono">run_agent</span> to execute it.</li>
                    </ol>
                </div>
                {agentResult && (
                    <div className="p-4 border rounded-md bg-secondary/10">
                        <pre className="whitespace-pre-wrap text-xs">{agentResult}</pre>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={() => setAgentDialogOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
