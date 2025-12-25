"use client";

import { FileCode, Trash2, Play, Bot, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";

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
import { useTranslations } from "@/hooks/useTranslations";
import { vanillaTrpcClient } from "@/lib/trpc";
import { SavedScript } from "@repo/zod-types";

export default function ScriptsPage() {
  const { t } = useTranslations();
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scriptName, setScriptName] = useState("");
  const [scriptDesc, setScriptDesc] = useState("");
  const [code, setCode] = useState("// Loading types...\n\n// Write your script here using the 'mcp' object.\n// Example: await mcp.call('tool_name', { arg: 'val' });\n");
  const [typeDefs, setTypeDefs] = useState("");

  // Agent Test State
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentResult, setAgentResult] = useState<string | null>(null);

  // Script Runner State
  const [isRunning, setIsRunning] = useState(false);

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

  // Fetch Types for IntelliSense
  useEffect(() => {
      if (editorOpen && !typeDefs) {
          vanillaTrpcClient.frontend.tools.getTypes.query().then(defs => {
              setTypeDefs(defs);
          });
      }
  }, [editorOpen]);

  const handleEditorMount = (editor: any, monaco: any) => {
      if (typeDefs) {
          monaco.languages.typescript.javascriptDefaults.addExtraLib(typeDefs, 'ts:filename/mcp.d.ts');
      }
  };

  const openEditor = (script?: SavedScript) => {
      if (script) {
          setEditingId(script.uuid);
          setScriptName(script.name);
          setScriptDesc(script.description || "");
          setCode(script.code);
      } else {
          setEditingId(null);
          setScriptName("");
          setScriptDesc("");
          setCode(`// Write your script here.\n// Tip: Use await mcp.call('tool_name', args);\n\n`);
      }
      setEditorOpen(true);
  };

  const handleSaveScript = async () => {
      if (!scriptName || !code) {
          toast.error("Name and Code are required");
          return;
      }
      try {
          if (editingId) {
              await vanillaTrpcClient.frontend.savedScripts.update.mutate({
                  uuid: editingId,
                  name: scriptName,
                  description: scriptDesc,
                  code: code
              });
              toast.success("Script updated");
          } else {
              await vanillaTrpcClient.frontend.savedScripts.create.mutate({
                  name: scriptName,
                  description: scriptDesc,
                  code: code
              });
              toast.success("Script created");
          }
          setEditorOpen(false);
          fetchScripts();
      } catch (e: any) {
          toast.error(`Failed to save: ${e.message}`);
      }
  };

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

  const handleRunScript = async (uuid: string) => {
      setIsRunning(true);
      try {
          const res = await vanillaTrpcClient.frontend.savedScripts.run.mutate({ uuid });
          if (res.success) {
              const output = JSON.stringify(res.result, null, 2);
              setAgentResult(output);
              setAgentDialogOpen(true);
              toast.success("Script executed successfully");
          } else {
              toast.error(`Execution failed: ${res.error}`);
          }
      } catch (e: any) {
          toast.error(`Error running script: ${e.message}`);
      } finally {
          setIsRunning(false);
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
        <div className="flex gap-2">
            <Button onClick={() => setEditorOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Script
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script) => (
          <Card key={script.uuid}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium cursor-pointer hover:underline" onClick={() => openEditor(script)}>
                {script.name}
              </CardTitle>
              <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleRunScript(script.uuid)}
                    title="Run Script"
                    disabled={isRunning}
                  >
                    <Play className={`h-4 w-4 text-green-500 ${isRunning ? 'animate-pulse' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setDeleteId(script.uuid)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                {script.description || "No description"}
              </div>
              <div
                className="bg-muted p-2 rounded-md font-mono text-xs overflow-hidden h-24 relative cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => openEditor(script)}
              >
                <pre>{script.code}</pre>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent" />
              </div>
            </CardContent>
          </Card>
        ))}
        {scripts.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No saved scripts found. Create one using the button above.
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
                <DialogTitle>Execution Result</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                {agentResult && (
                    <div className="p-4 border rounded-md bg-secondary/10 overflow-auto max-h-[60vh]">
                        <pre className="whitespace-pre-wrap text-xs font-mono">{agentResult}</pre>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={() => setAgentDialogOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{editingId ? "Edit Script" : "New Script"} (IntelliSense Enabled)</DialogTitle>
            </DialogHeader>
            <div className="flex gap-4 mb-2">
                <div className="flex-1">
                    <Label>Name</Label>
                    <Input value={scriptName} onChange={e => setScriptName(e.target.value)} placeholder="my_script" />
                </div>
                <div className="flex-1">
                    <Label>Description</Label>
                    <Input value={scriptDesc} onChange={e => setScriptDesc(e.target.value)} placeholder="What it does..." />
                </div>
            </div>
            <div className="flex-1 border rounded-md overflow-hidden">
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    theme="vs-dark"
                    onMount={handleEditorMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14
                    }}
                />
            </div>
            <DialogFooter>
                {editingId && (
                    <Button variant="secondary" onClick={() => handleRunScript(editingId)} disabled={isRunning}>
                        {isRunning ? "Running..." : "Run"}
                    </Button>
                )}
                <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveScript}>Save Script</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
