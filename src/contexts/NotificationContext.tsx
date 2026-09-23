"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface RealTimeNotification {
  id: string;
  type: "info" | "success" | "warning" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: "biomarker" | "goal" | "reminder" | "system";
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: RealTimeNotification[];
  unreadCount: number;
  isConnected: boolean;
  addNotification: (notification: Omit<RealTimeNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type ApiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  category?: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
};

function mapNotification(row: ApiNotification): RealTimeNotification {
  const type = row.type?.toLowerCase();
  const category = row.category?.toLowerCase();
  return {
    id: row.id,
    type: type === "success" || type === "warning" || type === "alert" ? type : "info",
    title: row.title,
    message: row.message,
    timestamp: new Date(row.createdAt),
    read: row.isRead,
    category:
      category === "biomarker" || category === "goal" || category === "reminder" || category === "system"
        ? category
        : "system",
    actionUrl: row.actionUrl || undefined,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) {
        setIsConnected(false);
        return;
      }
      const data = await res.json();
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(rows.map(mapNotification));
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : rows.filter((row: ApiNotification) => !row.isRead).length);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [refresh]);

  const addNotification = useCallback((_notification: Omit<RealTimeNotification, "id" | "timestamp" | "read">) => {
    refresh();
  }, [refresh]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then((res) => {
      if (!res.ok) refresh();
    }).catch(() => refresh());
  }, [refresh]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).then((res) => {
      if (!res.ok) refresh();
    }).catch(() => refresh());
  }, [refresh]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
    fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) refresh();
      })
      .catch(() => refresh());
  }, [refresh]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    fetch("/api/notifications?clearAll=true", { method: "DELETE" })
      .then((res) => {
        if (!res.ok) refresh();
      })
      .catch(() => refresh());
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
