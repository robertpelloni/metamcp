"use client";

import { X, Bell, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Notification {
  uuid: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

interface NotificationsListProps {
  notifications: Notification[];
  onClearNotifications: () => void;
  onRemoveNotification: (uuid: string) => void;
}

export function NotificationsList({
  notifications,
  onClearNotifications,
  onRemoveNotification,
}: NotificationsListProps) {
  const { t } = useTranslations();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <CardTitle className="text-base">{t("notifications:title")}</CardTitle>
          <Badge variant="secondary">{notifications.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={onClearNotifications}
        >
          <Trash2 className="mr-2 h-3 w-3" />
          {t("notifications:clearAll")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.uuid}
            className={`relative flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
              notification.type === "error"
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10"
                : notification.type === "warning"
                ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10"
                : notification.type === "success"
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10"
                : "bg-muted/50"
            }`}
          >
            <div className="flex w-full justify-between gap-2">
              <span className="font-semibold">{notification.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent"
                onClick={() => onRemoveNotification(notification.uuid)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
            <p className="text-muted-foreground">{notification.message}</p>
            <span className="text-[10px] text-muted-foreground/60">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
