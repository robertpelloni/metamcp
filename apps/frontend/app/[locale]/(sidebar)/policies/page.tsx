"use client";

import { ShieldCheck, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/hooks/useTranslations";
import { vanillaTrpcClient } from "@/lib/trpc";

// Simple type until we have TRPC definition
interface Policy {
    uuid: string;
    name: string;
    description: string | null;
    rules: { allow: string[]; deny?: string[] };
}

export default function PoliciesPage() {
  const { t } = useTranslations();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAllow, setNewAllow] = useState(""); // Comma separated

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      // We need to implement this router! For now it will fail.
      // const response = await vanillaTrpcClient.frontend.policies.list.query();
      // if (response.success) setPolicies(response.data);
      setPolicies([]); // Mock empty for now
    } catch (error) {
      // toast.error(t("common:errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreate = async () => {
      // Implement create logic
      setIsCreateOpen(false);
      toast.success("Policy created (mock)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Security Policies</h1>
            <p className="text-sm text-muted-foreground">
              Define allowed tool scopes for Autonomous Agents
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <Card key={policy.uuid}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{policy.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                {policy.description || "No description"}
              </div>
              <div className="mt-2">
                  <div className="text-xs font-semibold">Allowed:</div>
                  <pre className="text-xs bg-muted p-1 rounded mt-1 overflow-x-auto">
                      {policy.rules.allow.join(", ")}
                  </pre>
              </div>
            </CardContent>
          </Card>
        ))}
        {policies.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No policies found. Create one to secure your agents.
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Security Policy</DialogTitle>
            <DialogDescription>
              Define which tools an agent is allowed to access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Read-Only GitHub" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Allowed Patterns (comma separated)</Label>
                <Textarea
                    value={newAllow}
                    onChange={(e) => setNewAllow(e.target.value)}
                    placeholder="github__get_*, postgres__read_*"
                />
                <p className="text-[0.8rem] text-muted-foreground">Use glob patterns (e.g. *)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
