"use client";

import { RegistryItemSchema, TemplateEnvSchema } from "@repo/zod-types";
import {
  Check,
  Download,
  ExternalLink,
  Library,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type RegistryItem = z.infer<typeof RegistryItemSchema>;
type TemplateEnvConfig = z.infer<typeof TemplateEnvSchema>;

export default function RegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [installItem, setInstallItem] = useState<RegistryItem | null>(null);
  const [serverName, setServerName] = useState("");
  const [serverCommand, setServerCommand] = useState("");
  const [serverArgs, setServerArgs] = useState<string[]>([]);
  const [templateEnv, setTemplateEnv] = useState<Record<string, string>>({});

  const { data: registryData, isLoading } =
    trpc.frontend.registry.list.useQuery({
      query: searchQuery,
      category: selectedCategory === "all" ? undefined : selectedCategory,
      limit: 50,
    });

  const { data: categories } = trpc.frontend.registry.getCategories.useQuery();
  const createServerMutation = trpc.frontend.mcpServers.create.useMutation();

  const handleInstallClick = (item: RegistryItem) => {
    setInstallItem(item);
    // Sanitize name for server ID
    setServerName(item.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));

    if (item.template) {
      setServerCommand(item.template.command);
      setServerArgs(item.template.args);
      setTemplateEnv({});
    } else {
      setServerCommand("npx");
      setServerArgs(["-y", "package-name"]); // Placeholder
    }
  };

  const handleInstallConfirm = async () => {
    if (!installItem) {
      return;
    }

    try {
      // Validate required env vars for templates
      if (installItem.template?.env) {
        const missing = Object.entries(installItem.template.env).filter(
          ([key, config]: [string, TemplateEnvConfig]) =>
            config.required && !templateEnv[key],
        );

        if (missing.length > 0) {
          toast.error(
            `Missing required environment variables: ${missing.map((m) => m[0]).join(", ")}`,
          );
          return;
        }
      }

      await createServerMutation.mutateAsync({
        name: serverName,
        description: installItem.description,
        type: "STDIO",
        command: serverCommand,
        args: serverArgs,
        env: templateEnv,
      });
      toast.success(`Server ${serverName} installed successfully`);
      setInstallItem(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to install server: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Library className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">MCP Registry</h1>
          <p className="text-sm text-muted-foreground">
            Discover and install community MCP servers.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/<[^>]*>?/gm, "")}{" "}
                {/* Strip HTML from category names */}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-8">
          {registryData?.items.map((item) => (
            <Card key={item.url} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg leading-tight">
                        {item.name}
                      </CardTitle>
                      {item.template && (
                        <Badge
                          variant="default"
                          className="text-[10px] h-5 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                <div className="flex flex-wrap gap-1">
                  {item.categories.slice(0, 3).map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {cat.replace(/<[^>]*>?/gm, "").split(" ")[0]}{" "}
                      {/* Simplified category display */}
                    </Badge>
                  ))}
                </div>
                <Button
                  className="w-full"
                  variant={item.template ? "default" : "outline"}
                  onClick={() => handleInstallClick(item)}
                >
                  {item.template ? (
                    <Zap className="mr-2 h-4 w-4" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {item.template ? "One-Click Install" : "Install"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {(!registryData?.items || registryData.items.length === 0) &&
            !isLoading && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No servers found matching your criteria.
              </div>
            )}
        </div>
      </ScrollArea>

      <Dialog
        open={!!installItem}
        onOpenChange={(open) => !open && setInstallItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {installItem?.name}</DialogTitle>
            <DialogDescription>
              {installItem?.template
                ? "This is a Verified Server. Just fill in the required environment variables."
                : "Configure the MCP server parameters. You need to provide the correct NPM package name or command."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Server Name (Internal ID)</Label>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>

            {installItem?.template ? (
              // Template Mode: Show Env Vars
              <div className="space-y-4 border-t pt-4">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Configuration
                </Label>
                {Object.entries(installItem.template.env).map(
                  ([key, config]: [string, TemplateEnvConfig]) => (
                    <div key={key} className="space-y-2">
                      <Label>
                        {key}{" "}
                        {config.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      <Input
                        value={templateEnv[key] || ""}
                        onChange={(e) =>
                          setTemplateEnv({
                            ...templateEnv,
                            [key]: e.target.value,
                          })
                        }
                        placeholder={config.description}
                        type={
                          key.includes("KEY") ||
                          key.includes("TOKEN") ||
                          key.includes("SECRET")
                            ? "password"
                            : "text"
                        }
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  ),
                )}
                {Object.keys(installItem.template.env).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No configuration required.
                  </p>
                )}
              </div>
            ) : (
              // Manual Mode: Show Command/Args
              <>
                <div className="space-y-2">
                  <Label>Command</Label>
                  <Input
                    value={serverCommand}
                    onChange={(e) => setServerCommand(e.target.value)}
                    placeholder="npx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arguments</Label>
                  <Input
                    value={serverArgs.join(" ")}
                    onChange={(e) => setServerArgs(e.target.value.split(" "))}
                    placeholder="-y @modelcontextprotocol/server-filesystem /path/to/allow"
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Check the{" "}
                    <a
                      href={installItem?.url}
                      target="_blank"
                      className="underline"
                      rel="noreferrer"
                    >
                      repository README
                    </a>{" "}
                    for installation instructions.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleInstallConfirm}>
              {installItem?.template ? "Install Server" : "Add Server"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
