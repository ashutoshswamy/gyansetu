"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/use-notifications";
import type { Notification } from "@/types";

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
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="flex items-center justify-center rounded relative"
        style={{ width: 32, height: 32, background: "none", border: "1.5px solid var(--border)", cursor: "pointer" }}
      >
        <Bell className="w-4 h-4" style={{ color: "var(--gs-text-secondary)" }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8,
              background: "var(--gs-danger)", color: "white", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute z-50"
            style={{
              top: "calc(100% + 8px)", right: 0, width: "min(320px, calc(100vw - 24px))", maxHeight: 420,
              background: "white", border: "1px solid var(--border)", borderRadius: 10,
              boxShadow: "0 8px 24px rgba(25,20,15,0.12)", display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-between" style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  style={{ fontSize: 11.5, fontWeight: 600, color: "var(--gs-accent)", background: "none", border: "none", cursor: markAllRead.isPending ? "not-allowed" : "pointer" }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto" }}>
              {items.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--gs-muted)", padding: "24px 14px", textAlign: "center", margin: 0 }}>
                  No notifications yet.
                </p>
              ) : (
                items.map(n => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className="flex items-start gap-2 w-full text-left"
                    style={{
                      padding: "10px 14px", borderBottom: "1px solid var(--gs-card)", background: n.read ? "white" : "#F7F8FD",
                      border: "none", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--gs-card)",
                      cursor: n.read ? "default" : "pointer",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: n.read ? "transparent" : TYPE_DOT[n.type] }} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 12.5, fontWeight: n.read ? 500 : 700, color: "var(--foreground)", margin: 0 }}>{n.title}</p>
                      <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: "2px 0 0", lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 10.5, color: "var(--gs-muted)", margin: "4px 0 0" }}>{timeAgo(n.created_at)}</p>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
