"use client";

import { CheckCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

type DiscoveredServer = {
  name: string;
  type: string;
  alreadyRegistered: boolean;
};

type DiscoveredSource = {
  description: string;
  path: string;
  status: string;
  servers?: DiscoveredServer[];
};

export function AutoDiscovery() {
  const [isScanning, setIsScanning] = useState(false);

  const scanMutation = trpc.frontend.autoDiscovery.scanForConfigs.useMutation();
  const importMutation =
    trpc.frontend.autoDiscovery.importDiscovered.useMutation();
  const utils = trpc.useUtils();

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await scanMutation.mutateAsync({});
      toast.success("Scan complete");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Scan failed: ${errorMessage}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async (serverName: string, sourcePath: string) => {
    try {
      await importMutation.mutateAsync({
        serverNames: [serverName],
        sourcePath,
        skipExisting: true,
      });
      toast.success(`Imported ${serverName}`);
      utils.frontend.mcpServers.list.invalidate();
      // Re-scan to update status
      handleScan();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Import failed: ${errorMessage}`);
    }
  };

  const discoveredSources =
    (scanMutation.data?.result?.sources as DiscoveredSource[] | undefined) ||
    [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Auto-Discovery</h2>
          <p className="text-sm text-muted-foreground">
            Scan your system for existing MCP configurations (Claude Desktop,
            Cursor, VS Code).
          </p>
        </div>
        <Button onClick={handleScan} disabled={isScanning}>
          {isScanning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Scan Now
        </Button>
      </div>

      {discoveredSources.length === 0 && !isScanning && scanMutation.data && (
        <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10">
          No configurations found.
        </div>
      )}

      <div className="grid gap-6">
        {discoveredSources.map((source, i: number) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {source.description}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono mt-1 break-all">
                    {source.path}
                  </CardDescription>
                </div>
                {source.status === "found" ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-200"
                  >
                    Found
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-600 border-red-200"
                  >
                    {source.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            {source.servers && source.servers.length > 0 && (
              <CardContent>
                <div className="border rounded-md divide-y">
                  {source.servers.map((server) => (
                    <div
                      key={server.name}
                      className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {server.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {server.type}
                          </span>
                        </div>
                        {server.alreadyRegistered && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5"
                          >
                            Installed
                          </Badge>
                        )}
                      </div>

                      {!server.alreadyRegistered ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleImport(server.name, source.path)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Imported
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
