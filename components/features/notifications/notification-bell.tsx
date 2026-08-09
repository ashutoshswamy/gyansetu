"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/use-notifications";
import type { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_DOT: Record<Notification["type"], string> = {
  info: "var(--gs-accent)",
  success: "var(--gs-success)",
  warning: "#B8860B",
  error: "var(--gs-danger)",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = notifications ?? [];
  const unreadCount = items.filter(n => !n.read).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="w-8 h-8 rounded relative border border-border"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute z-50 mt-2 right-0 w-[min(320px,calc(100vw-24px))] max-h-[420px] bg-background border border-border rounded-lg shadow-lg flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <p className="text-xs font-bold text-foreground m-0">Notifications</p>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="h-auto p-0 text-[11.5px] font-semibold text-accent hover:text-accent/90"
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center m-0">
                  No notifications yet.
                </p>
              ) : (
                items.map(n => (
                  <Button
                    key={n.id}
                    variant="ghost"
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`flex items-start justify-start gap-2 w-full text-left p-3 h-auto rounded-none border-b border-border ${n.read ? "bg-background" : "bg-accent/5"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: n.read ? "transparent" : TYPE_DOT[n.type] }} />
                    <span className="min-w-0 flex-1 whitespace-normal">
                      <p className={`text-xs ${n.read ? "font-medium" : "font-bold"} text-foreground m-0`}>{n.title}</p>
                      <p className="text-[12px] text-muted-foreground m-0 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10.5px] text-muted-foreground m-0 mt-1">{timeAgo(n.created_at)}</p>
                    </span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
