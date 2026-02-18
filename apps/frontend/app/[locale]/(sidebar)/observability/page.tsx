"use client";

export default function ObservabilityPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Observability (MCP Shark)</h1>
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden bg-background">
        <iframe
          src="http://localhost:9853"
          className="w-full h-full border-0"
          title="MCP Shark Dashboard"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
