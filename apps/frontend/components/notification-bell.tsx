"use client";

import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: notifications } = trpc.frontend.notifications.list.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10s
  });
  const markReadMutation = trpc.frontend.notifications.markRead.useMutation();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleMarkRead = async (uuid?: string) => {
    await markReadMutation.mutateAsync({ uuid });
    utils.frontend.notifications.list.invalidate();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
                variant="ghost"
                size="xs"
                className="h-auto px-2 py-1 text-xs"
                onClick={(e) => {
                    e.preventDefault();
                    handleMarkRead();
                }}
            >
                Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
            {notifications?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications.
                </div>
            ) : (
                notifications?.map((notification) => (
                    <DropdownMenuItem
                        key={notification.uuid}
                        className={cn(
                            "flex flex-col items-start gap-1 p-3 cursor-pointer",
                            !notification.isRead && "bg-muted/50"
                        )}
                        onClick={() => handleMarkRead(notification.uuid)}
                    >
                        <div className="flex w-full items-center justify-between">
                            <span className="font-medium text-sm">{notification.title}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                        </p>
                        {!notification.isRead && (
                            <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1">New</Badge>
                        )}
                    </DropdownMenuItem>
                ))
            )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
