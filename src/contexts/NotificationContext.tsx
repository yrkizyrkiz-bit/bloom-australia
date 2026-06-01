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
  icon?: string;
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

// Simulated real-time notifications that would come from a WebSocket
const simulatedNotifications: Omit<RealTimeNotification, "id" | "timestamp" | "read">[] = [
  {
    type: "success",
    title: "Goal Achieved!",
    message: "Congratulations! Your LDL cholesterol has reached the optimal range.",
    category: "goal",
    actionUrl: "/dashboard/goals"
  },
  {
    type: "info",
    title: "New Lab Results Available",
    message: "Your latest blood test results have been uploaded and analyzed.",
    category: "biomarker",
    actionUrl: "/dashboard/biomarkers"
  },
  {
    type: "warning",
    title: "Upcoming Test Reminder",
    message: "Your kidney function test is scheduled for tomorrow at 9:00 AM.",
    category: "reminder",
    actionUrl: "/dashboard/kidney-test"
  },
  {
    type: "alert",
    title: "Biomarker Alert",
    message: "Your cortisol levels remain elevated. Consider reviewing stress management tips.",
    category: "biomarker",
    actionUrl: "/dashboard/hormone-test"
  },
  {
    type: "info",
    title: "Weekly Health Summary",
    message: "Your overall health score improved by 3 points this week!",
    category: "system",
    actionUrl: "/dashboard"
  },
  {
    type: "success",
    title: "Streak Achievement",
    message: "You've tracked your health for 30 consecutive days!",
    category: "system"
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate WebSocket connection
  useEffect(() => {
    // Simulate connection delay
    const connectionTimer = setTimeout(() => {
      setIsConnected(true);
    }, 1000);

    return () => clearTimeout(connectionTimer);
  }, []);

  // Simulate receiving real-time notifications
  useEffect(() => {
    if (!isConnected) return;

    // Add initial notifications
    const initialNotifications: RealTimeNotification[] = [
      {
        id: `notif_${Date.now()}_1`,
        type: "info",
        title: "Welcome Back!",
        message: "Your dashboard has been updated with your latest health data.",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        category: "system"
      },
      {
        id: `notif_${Date.now()}_2`,
        type: "warning",
        title: "Vitamin D Reminder",
        message: "Don't forget to take your vitamin D supplement today.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        category: "reminder"
      },
    ];
    setNotifications(initialNotifications);

    // Simulate periodic notifications (every 30-60 seconds in production, faster for demo)
    const notificationInterval = setInterval(() => {
      const randomNotif = simulatedNotifications[Math.floor(Math.random() * simulatedNotifications.length)];
      const newNotification: RealTimeNotification = {
        ...randomNotif,
        id: `notif_${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
    }, 45000); // Every 45 seconds for demo

    return () => clearInterval(notificationInterval);
  }, [isConnected]);

  const addNotification = useCallback((notification: Omit<RealTimeNotification, "id" | "timestamp" | "read">) => {
    const newNotification: RealTimeNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
