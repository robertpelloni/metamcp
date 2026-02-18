"use client";

import { AlertTriangle, FolderTree, Info } from "lucide-react";

interface InspectorRootsProps {
  enabled?: boolean;
}

export function InspectorRoots({ enabled = true }: InspectorRootsProps) {
  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <h4 className="text-sm font-medium">Roots Not Supported</h4>
        <p className="text-xs text-muted-foreground mt-1">
          This MCP server does not advertise roots capability.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderTree className="h-5 w-5 text-orange-500" />
        <span className="text-sm font-medium">Roots Capability Detected</span>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Read-Only Status</h4>
            <p className="text-xs text-muted-foreground">
              MetaMCP currently does not expose a concrete roots listing/editor
              flow in this inspector tab. Roots are typically negotiated via
              capability/notification behavior for each server implementation.
            </p>
            <p className="text-xs text-muted-foreground">
              This avoids showing simulated root management actions that are not
              backed by a real MCP request path.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
