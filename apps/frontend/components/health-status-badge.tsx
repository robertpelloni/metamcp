import { Badge } from "@/components/ui/badge";
import { ServerHealthInfo } from "@repo/zod-types";
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface HealthStatusBadgeProps {
  health?: ServerHealthInfo;
  isLoading?: boolean;
}

export function HealthStatusBadge({ health, isLoading }: HealthStatusBadgeProps) {
  if (isLoading) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
        <Activity className="mr-1 h-3 w-3 animate-pulse" />
        Checking...
      </Badge>
    );
  }

  if (!health) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
        <Activity className="mr-1 h-3 w-3" />
        Unknown
      </Badge>
    );
  }

  if (health.status === "HEALTHY") {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
        <CheckCircle className="mr-1 h-3 w-3" />
        Healthy
      </Badge>
    );
  }

  if (health.status === "UNHEALTHY") {
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        Unhealthy
      </Badge>
    );
  }

  // degraded
  return (
    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
      <AlertTriangle className="mr-1 h-3 w-3" />
      Degraded
    </Badge>
  );
}
