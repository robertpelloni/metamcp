"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AuditPage() {
  const { t } = useTranslations();
  const { data: logs, isLoading } = trpc.frontend.audit.list.useQuery({ limit: 100 });

  if (isLoading) {
    return <div className="p-8">Loading audit logs...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8" />
            Audit Logs
        </h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
            <CardTitle>Security Events</CardTitle>
            <CardDescription>
                Track critical system actions and security events.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs?.items.map((log) => (
                        <TableRow key={log.uuid}>
                            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.userId || "System"}</TableCell>
                            <TableCell>
                                <span className="font-medium text-xs bg-muted px-1 py-0.5 rounded mr-1">{log.resourceType}</span>
                                <span className="text-xs text-muted-foreground">{log.resourceId}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                            <TableCell>
                                {log.details && (
                                    <pre className="text-[10px] bg-muted/50 p-1 rounded overflow-x-auto max-w-[200px]">
                                        {JSON.stringify(log.details, null, 0)}
                                    </pre>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {!logs?.items.length && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No audit logs found.
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
