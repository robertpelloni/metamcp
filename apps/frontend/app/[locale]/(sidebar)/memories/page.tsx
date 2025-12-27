"use client";

import { Brain, Trash2 } from "lucide-react";
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

interface Memory {
    uuid: string;
    content: string;
    tags: string[] | null;
    created_at: string;
}

export default function MemoriesPage() {
  const { t } = useTranslations();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const response = await vanillaTrpcClient.frontend.memories.list.query({});
      setMemories(response);
    } catch (error) {
      toast.error(t("common:errorLoadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await vanillaTrpcClient.frontend.memories.delete.mutate({ id: deleteId });
      toast.success(t("common:deleteSuccess"));
      fetchMemories();
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
          <Brain className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Long-Term Memory</h1>
            <p className="text-sm text-muted-foreground">
              Knowledge stored by agents across sessions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memories.map((memory) => (
          <Card key={memory.uuid}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex gap-2 flex-wrap">
                  {memory.tags?.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setDeleteId(memory.uuid)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-4">{memory.content}</p>
              <div className="text-xs text-muted-foreground mt-2">
                  {new Date(memory.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
        {memories.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No memories found. Agents can save memories using `save_memory`.
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common:confirmDelete")}</DialogTitle>
            <DialogDescription>
              Are you sure you want to forget this memory?
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
