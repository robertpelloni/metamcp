"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MetaMcpLogEntry } from "@repo/zod-types";

import { formatDeterministicDateTime } from "@/lib/datetime";

type LogEntryData = Omit<MetaMcpLogEntry, "timestamp"> & {
  timestamp: Date | string;
};

export const LogEntry = ({ log }: { log: LogEntryData }) => {
  const [expanded, setExpanded] = useState(false);
  const formatTimestamp = (timestamp: Date | string) => {
    return formatDeterministicDateTime(timestamp);
  };

  return (
    <div className="border-b border-gray-800 last:border-0">
      <div
        className="flex items-center gap-2 text-gray-300 hover:bg-gray-800 px-2 py-1 rounded cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-gray-500">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {formatTimestamp(log.timestamp)}
        </span>
        <span className="text-blue-400 font-medium">
          [{log.serverName}]
        </span>
        <span className={`flex-1 ${log.level === 'error' ? 'text-red-400' : ''}`}>
          {log.message}
        </span>
      </div>
      {expanded && (
        <div className="bg-gray-900 p-2 ml-8 mb-2 rounded text-xs overflow-x-auto">
            {log.arguments && (
                <div className="mb-2">
                    <span className="text-yellow-500 font-semibold">Arguments:</span>
                    <pre className="text-gray-400">{JSON.stringify(log.arguments, null, 2)}</pre>
                </div>
            )}
            {log.result && (
                <div>
                    <span className="text-green-500 font-semibold">Result:</span>
                    <pre className="text-gray-400">{JSON.stringify(log.result, null, 2)}</pre>
                </div>
            )}
            {log.error && (
                <div>
                    <span className="text-red-500 font-semibold">Error:</span>
                    <pre className="text-red-400">{log.error}</pre>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
