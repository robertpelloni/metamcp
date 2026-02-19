"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateOAuthClientRequestSchema, CreateOAuthClientResponseSchema } from "@repo/zod-types";
import { z } from "zod";

type CreateClientForm = z.infer<typeof CreateOAuthClientRequestSchema>;

export default function OAuthSettingsPage() {
  const { t } = useTranslations();
  const utils = trpc.useUtils();
  const { data: clients, isLoading } = trpc.frontend.oauthClients.list.useQuery();
  const createMutation = trpc.frontend.oauthClients.create.useMutation();
  const deleteMutation = trpc.frontend.oauthClients.delete.useMutation();
  const rotateMutation = trpc.frontend.oauthClients.rotateSecret.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClientSecrets, setNewClientSecrets] = useState<z.infer<typeof CreateOAuthClientResponseSchema> | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateClientForm>({
    resolver: zodResolver(CreateOAuthClientRequestSchema),
    defaultValues: {
      redirectUris: ["http://localhost:3000/api/auth/callback/metamcp"], // Example default
      scope: "admin",
    }
  });

  const onSubmit = async (data: CreateClientForm) => {
    try {
      const result = await createMutation.mutateAsync(data);
      setNewClientSecrets(result);
      utils.frontend.oauthClients.list.invalidate();
      reset();
    } catch (error) {
      console.error("Failed to create client", error);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      await deleteMutation.mutateAsync({ clientId });
      utils.frontend.oauthClients.list.invalidate();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Key className="h-8 w-8" />
                OAuth Clients
            </h1>
            <p className="text-muted-foreground mt-1">
                Manage applications authorized to access the MetaMCP API.
            </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setNewClientSecrets(null);
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Register Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Register OAuth Client</DialogTitle>
                    <DialogDescription>
                        Create credentials for a new application.
                    </DialogDescription>
                </DialogHeader>

                {!newClientSecrets ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">Client Name</Label>
                            <Input id="clientName" {...register("clientName")} placeholder="My App" />
                            {errors.clientName && <p className="text-sm text-red-500">{errors.clientName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="redirectUris">Redirect URIs (comma separated)</Label>
                            <Input
                                id="redirectUris"
                                placeholder="https://app.example.com/callback"
                                {...register("redirectUris", {
                                    setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()) : v
                                })}
                            />
                            {errors.redirectUris && <p className="text-sm text-red-500">Invalid URL(s)</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create Client"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                Save these credentials now! The Client Secret will not be shown again.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Client ID</Label>
                            <div className="flex gap-2">
                                <Input value={newClientSecrets.clientId} readOnly className="font-mono" />
                                <CopyButton text={newClientSecrets.clientId} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <div className="flex gap-2">
                                <Input value={newClientSecrets.clientSecret} readOnly className="font-mono" />
                                <CopyButton text={newClientSecrets.clientSecret} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsCreateOpen(false)}>Done</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Client ID</TableHead>
                        <TableHead>Redirect URIs</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients?.map((client) => (
                        <TableRow key={client.client_id}>
                            <TableCell className="font-medium">{client.client_name}</TableCell>
                            <TableCell className="font-mono text-xs">{client.client_id}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {client.redirect_uris.map(uri => (
                                        <Badge key={uri} variant="secondary" className="w-fit text-[10px]">{uri}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {new Date(client.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(client.client_id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && clients?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No OAuth clients registered.
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

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
    );
}
