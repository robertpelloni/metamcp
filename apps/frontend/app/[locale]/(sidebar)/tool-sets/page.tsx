"use client";

import { Layers, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { ToolSet } from "@repo/zod-types";

export default function ToolSetsPage() {
  const { t } = useTranslations();
  const [toolSets, setToolSets] = useState<ToolSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchToolSets = async () => {
    try {
      setIsLoading(true);
      const response = await vanillaTrpcClient.frontend.toolSets.get.query();
      if (response.success) {
        setToolSets(response.data);
      }
    } catch (error) {
      toast.error(t("common:errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToolSets();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await vanillaTrpcClient.frontend.toolSets.delete.mutate({ uuid: deleteId });
      toast.success(t("common:deleteSuccess"));
      fetchToolSets();
    } catch (error) {
      toast.error(t("common:deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">{t("navigation:toolSets")}</h1>
            <p className="text-sm text-muted-foreground">
              Manage your saved Tool Sets (Profiles)
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {toolSets.map((set) => (
          <Card key={set.uuid}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {set.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setDeleteId(set.uuid)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4">
                {set.description || "No description"}
              </div>
              <div className="flex flex-wrap gap-1">
                {set.tools.slice(0, 5).map((tool) => (
                  <Badge key={tool} variant="secondary" className="text-[10px]">
                    {tool}
                  </Badge>
                ))}
                {set.tools.length > 5 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{set.tools.length - 5} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {toolSets.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No saved tool sets found. Use the `save_tool_set` tool to create one.
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common:confirmDelete")}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tool set? This action cannot be undone.
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
