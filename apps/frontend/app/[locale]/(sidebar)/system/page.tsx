"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, GitBranch, Package, Server, FolderTree, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function SystemPage() {
  const { t } = useTranslations();
  const { data: info, isLoading } = trpc.frontend.system.getInfo.useQuery();

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading system information...</p>
        </div>
    </div>;
  }

  if (!info) {
    return <div className="p-8 text-destructive">Failed to load system information.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8 text-primary" />
            System Dashboard
          </h1>
          <Badge variant="outline" className="text-lg px-3 py-1 border-primary/20 bg-primary/5">
            v{info.version}
          </Badge>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="structure">Project Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Version & Build Info */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            Application Runtime
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Node.js Version</span>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{info.nodeVersion}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Platform</span>
                            <span className="font-mono text-sm">{info.platform}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Build Date</span>
                            <span className="text-sm font-medium">{new Date(info.buildDate).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-muted-foreground" />
                            Submodules Status
                        </CardTitle>
                        <CardDescription>
                            Managed Git submodules within the monorepo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead className="text-right">Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {info.submodules.map((sub) => (
                                    <TableRow key={sub.name}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{sub.name}</span>
                                                {sub.description && (
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{sub.description}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                {sub.version || "unknown"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {sub.url && (
                                                <a
                                                    href={sub.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                                                >
                                                    Repo <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Changelog Snippet */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        Latest Changes (CHANGELOG.md)
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto bg-muted/30 p-6 rounded-md border">
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{info.changelogSnippet || "No changelog available."}</ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="structure" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderTree className="h-5 w-5 text-muted-foreground" />
                        Project Directory Structure
                    </CardTitle>
                    <CardDescription>
                        Overview of the monorepo layout and key components.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-950 text-slate-50 p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto shadow-inner border border-slate-800">
<pre>{`metamcp/
├── .github/              # CI/CD workflows (GitHub Actions)
├── apps/                 # Application workspaces
│   ├── backend/          # Express/TRPC API + MCP Proxy + Sandbox
│   │   ├── src/
│   │   │   ├── lib/      # Core logic (AI, Memory, Registry, System)
│   │   │   ├── trpc/     # TRPC Routers & Implementations
│   │   │   └── db/       # Drizzle Schema & Migrations
│   │   └── mcp-shark/    # Traffic Inspector (Submodule)
│   └── frontend/         # Next.js 15 UI (React Server Components)
│       ├── app/          # App Router Pages
│       └── components/   # Shadcn UI Components
├── packages/             # Shared internal packages
│   ├── trpc/             # Shared TRPC router definitions (Backend <-> Frontend)
│   └── zod-types/        # Shared Zod schemas (Type Safety Source of Truth)
├── docs/                 # Documentation
│   ├── AGENTS.md         # Operational Directives for AI Agents
│   ├── HANDOFF.md        # Architecture & Status for AI Handoff
│   └── ROADMAP.md        # Feature Planning
├── submodules/           # External MCP ecosystem components
│   ├── mcp-directories/  # Registry Data Source
│   └── mcpdir/           # Large Scale Index
└── docker-compose.yml    # Container orchestration`}</pre>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-primary">Key Architectural Concepts</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li><strong>Monorepo (Turborepo)</strong>: Unified build system for all apps and packages.</li>
                                <li><strong>Shared Types</strong>: `zod-types` package ensures backend and frontend speak the same language.</li>
                                <li><strong>Submodules</strong>: External components are linked via Git Submodules for modularity.</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                             <h3 className="font-semibold text-primary">Data Flow</h3>
                             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li><strong>Frontend</strong> calls Backend via TRPC (Type-Safe RPC).</li>
                                <li><strong>Backend</strong> proxies MCP requests to downstream tools.</li>
                                <li><strong>Agents</strong> execute in Backend Sandbox (`isolated-vm`).</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
