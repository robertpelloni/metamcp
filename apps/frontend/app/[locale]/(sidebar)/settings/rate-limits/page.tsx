"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc, vanillaTrpcClient } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Clock, Gauge, HelpCircle, Plus, Trash2, Zap, Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RateLimitRule } from "@repo/zod-types";

export default function RateLimitsPage() {
  const { t } = useTranslations();
  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.frontend.rateLimits.list.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPattern, setNewPattern] = useState("*");
  const [newLimit, setNewLimit] = useState(60);
  const [newWindow, setNewWindow] = useState(60);

  const createMutation = trpc.frontend.rateLimits.create.useMutation({
    onSuccess: () => {
      toast.success("Rate limit rule created");
      setCreateOpen(false);
      utils.frontend.rateLimits.list.invalidate();
      // Reset form
      setNewName("");
      setNewPattern("*");
      setNewLimit(60);
      setNewWindow(60);
    },
    onError: (err) => {
      toast.error(`Failed to create rule: ${err.message}`);
    },
  });

  const updateMutation = trpc.frontend.rateLimits.update.useMutation({
    onSuccess: () => {
      toast.success("Rate limit rule updated");
      utils.frontend.rateLimits.list.invalidate();
    },
    onError: (err) => {
        toast.error(`Failed to update rule: ${err.message}`);
    }
  });

  const deleteMutation = trpc.frontend.rateLimits.delete.useMutation({
    onSuccess: () => {
      toast.success("Rate limit rule deleted");
      utils.frontend.rateLimits.list.invalidate();
    },
    onError: (err) => {
        toast.error(`Failed to delete rule: ${err.message}`);
    }
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: newName,
      tool_pattern: newPattern,
      max_requests: Number(newLimit),
      window_ms: Number(newWindow) * 1000,
    });
  };

  const toggleActive = (rule: RateLimitRule) => {
    updateMutation.mutate({
        uuid: rule.uuid,
        is_active: !rule.is_active
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Gauge className="h-8 w-8 text-primary" />
                Rate Limits
            </h1>
            <p className="text-muted-foreground mt-1">
                Configure request limits for tools to prevent abuse and manage costs.
            </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Rate Limit Rule</DialogTitle>
              <DialogDescription>
                Define a new rate limit rule. Rules are evaluated in order of specificity.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. GitHub Global Limit"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right flex items-center justify-end gap-1">
                    <Label htmlFor="pattern">Pattern</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Glob pattern for tool names.</p>
                                <p>Example: `github__*` matches all github tools.</p>
                                <p>`*` matches everything.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                  id="pattern"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  className="col-span-3 font-mono text-sm"
                  placeholder="e.g. github__*"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="limit" className="text-right">
                  Max Requests
                </Label>
                <Input
                  id="limit"
                  type="number"
                  min={1}
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="window" className="text-right">
                  Window (Seconds)
                </Label>
                <Input
                  id="window"
                  type="number"
                  min={1}
                  value={newWindow}
                  onChange={(e) => setNewWindow(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!newName || !newPattern}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
             Manage your active rate limit configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.data.map((rule) => (
                  <TableRow key={rule.uuid}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                             <Switch
                                checked={rule.is_active}
                                onCheckedChange={() => toggleActive(rule)}
                                disabled={updateMutation.isLoading}
                             />
                             {rule.is_active ? (
                                <span className="text-xs text-green-500 font-medium">Active</span>
                             ) : (
                                <span className="text-xs text-muted-foreground">Inactive</span>
                             )}
                        </div>
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                            {rule.tool_pattern}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold">{rule.max_requests}</span>
                            <span className="text-muted-foreground">reqs /</span>
                            <span className="font-bold">{rule.window_ms / 1000}s</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        onClick={() => deleteMutation.mutate({ uuid: rule.uuid })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rules?.data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No rules defined. Global defaults may apply.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Performance Note</h4>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Rate limits are checked against a high-performance in-memory cache that syncs with the database every minute.
                    Changes may take up to 60 seconds to propagate to all active sessions.
                </p>
            </div>
      </div>
    </div>
  );
}
