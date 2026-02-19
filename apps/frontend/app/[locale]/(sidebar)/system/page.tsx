"use client";

import { ExternalLink, GitBranch, Package, Server } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
<<<<<<< HEAD
=======
import { formatDeterministicDateTime } from "@/lib/datetime";
>>>>>>> fix/detached-head-recovery
import { trpc } from "@/lib/trpc";

export default function SystemPage() {
  const { data: info, isLoading } = trpc.frontend.system.getInfo.useQuery();

  if (isLoading) {
    return <div className="p-8">Loading system information...</div>;
  }

  if (!info) {
    return (
      <div className="p-8 text-red-500">Failed to load system information.</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Server className="h-8 w-8" />
        System Dashboard
      </h1>

      {/* Version & Build Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Application Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="default" className="text-lg px-3 py-1">
                {info.version}
              </Badge>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Node.js</span>
              <span className="font-mono">{info.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-mono text-sm">{info.platform}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Build Date</span>
<<<<<<< HEAD
              <span className="text-sm">
                {new Date(info.buildDate).toLocaleString()}
              </span>
=======
              <span className="text-sm">{formatDeterministicDateTime(info.buildDate)}</span>
>>>>>>> fix/detached-head-recovery
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Submodules
            </CardTitle>
            <CardDescription>
              Components managed as Git submodules within the monorepo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
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
                          <span className="text-xs text-muted-foreground">
                            {sub.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {sub.path}
                    </TableCell>
                    <TableCell className="text-right">
                      {sub.url && (
                        <a
                          href={sub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 hover:underline"
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
          <CardTitle>Latest Changes</CardTitle>
          <CardDescription>Excerpt from CHANGELOG.md</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto bg-muted/30 p-4 rounded-md">
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown>
              {info.changelogSnippet || "No changelog available."}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Project Structure Reference (Static for now, but could be dynamic) */}
      <Card>
        <CardHeader>
          <CardTitle>Project Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-black text-white p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
            {`metamcp/
├── apps/
│   ├── backend/          # Express/TRPC API + MCP Proxy
│   └── frontend/         # Next.js 15 UI
├── packages/             # Shared packages
│   ├── trpc/             # Shared API definitions
│   └── zod-types/        # Shared schemas
├── docs/                 # Documentation & Guidelines
├── submodules/           # External components
│   ├── mcp-shark/        # Traffic Inspector
│   ├── mcp-directories/  # Server Registry Data
│   └── mcpdir/           # Large Scale Index
└── VERSION               # Single Source of Truth`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
