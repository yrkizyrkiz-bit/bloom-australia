"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Mail,
  CheckCircle,
  Trash2,
  X,
  ChevronRight,
  Settings,
  Clock,
  Sparkles,
  AlertCircle,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "test_reminder" | "goal_update" | "results_ready" | "weekly_digest" | "achievement" | "alert";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority?: "high" | "medium" | "low";
  metadata?: Record<string, string | number>;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: "notif_1",
    type: "test_reminder",
    title: "Liver Function Test Tomorrow",
    message: "Your scheduled test at Laverty Pathology - Bondi Junction is tomorrow at 8:30 AM. Remember to fast for 12 hours.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    actionUrl: "/dashboard/liver-test?tab=schedule",
    actionLabel: "View Details",
    priority: "high"
  },
  {
    id: "notif_2",
    type: "goal_update",
    title: "Great Progress on Triglycerides!",
    message: "You're 75% of the way to your target. Keep up the excellent work with your diet changes!",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: false,
    actionUrl: "/dashboard/liver-test?tab=goals",
    actionLabel: "View Goal",
    priority: "medium"
  },
  {
    id: "notif_3",
    type: "achievement",
    title: "Goal Achieved: GGT Normalized!",
    message: "Congratulations! Your GGT levels have reached the optimal range. You've successfully improved from 45 to 28 U/L.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: false,
    actionUrl: "/dashboard/liver-test?tab=goals",
    actionLabel: "Celebrate",
    priority: "low"
  },
  {
    id: "notif_4",
    type: "results_ready",
    title: "New Test Results Available",
    message: "Your March 2024 liver function panel results have been uploaded and analyzed.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: true,
    actionUrl: "/dashboard/liver-test",
    actionLabel: "View Results"
  },
  {
    id: "notif_5",
    type: "weekly_digest",
    title: "Your Weekly Health Summary",
    message: "Your liver health score improved by 3 points this week. Check out your personalized insights.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    isRead: true,
    actionUrl: "/dashboard/liver-test?tab=insights",
    actionLabel: "Read Summary"
  },
  {
    id: "notif_6",
    type: "alert",
    title: "Schedule Your Follow-up Test",
    message: "It's been 3 months since your last liver panel. Time to schedule your next test to track progress.",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    isRead: true,
    actionUrl: "/dashboard/liver-test?tab=schedule",
    actionLabel: "Schedule Now"
  },
  {
    id: "notif_7",
    type: "goal_update",
    title: "HDL Goal Progress Update",
    message: "You're making steady progress! HDL increased from 48 to 58 mg/dL. Target: 65 mg/dL.",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    isRead: true,
    actionUrl: "/dashboard/liver-test?tab=goals",
    actionLabel: "View Progress"
  }
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "test_reminder": return Calendar;
    case "goal_update": return Target;
    case "results_ready": return FileText;
    case "weekly_digest": return Mail;
    case "achievement": return Sparkles;
    case "alert": return AlertCircle;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "test_reminder": return "bg-blue-500";
    case "goal_update": return "bg-green-500";
    case "results_ready": return "bg-purple-500";
    case "weekly_digest": return "bg-amber-500";
    case "achievement": return "bg-yellow-500";
    case "alert": return "bg-orange-500";
  }
};

const getNotificationBgColor = (type: Notification["type"], isRead: boolean) => {
  if (isRead) return "bg-muted/30";
  switch (type) {
    case "test_reminder": return "bg-blue-50 dark:bg-blue-950/20";
    case "goal_update": return "bg-green-50 dark:bg-green-950/20";
    case "results_ready": return "bg-purple-50 dark:bg-purple-950/20";
    case "weekly_digest": return "bg-amber-50 dark:bg-amber-950/20";
    case "achievement": return "bg-yellow-50 dark:bg-yellow-950/20";
    case "alert": return "bg-orange-50 dark:bg-orange-950/20";
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
};

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = filter === "all"
    ? notifications
    : notifications.filter(n => !n.isRead);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSwipingId(null);
    setSwipeOffset(0);
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Touch handlers for swipe-to-delete
  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    setSwipingId(id);
    const touch = e.touches[0];
    (e.currentTarget as HTMLElement).dataset.startX = touch.clientX.toString();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId) return;
    const startX = parseFloat((e.currentTarget as HTMLElement).dataset.startX || "0");
    const touch = e.touches[0];
    const diff = startX - touch.clientX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60 && swipingId) {
      deleteNotification(swipingId);
    } else {
      setSwipeOffset(0);
      setSwipingId(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between mb-3">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">{unreadCount} new</Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-8"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className="flex-1"
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="flex-1"
            >
              Unread ({unreadCount})
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const isCurrentlySwiping = swipingId === notification.id;

                return (
                  <div
                    key={notification.id}
                    className="relative overflow-hidden"
                  >
                    {/* Delete background */}
                    <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>

                    {/* Notification card */}
                    <div
                      className={cn(
                        "relative p-4 transition-transform cursor-pointer",
                        getNotificationBgColor(notification.type, notification.isRead),
                        !notification.isRead && "border-l-4 border-l-primary"
                      )}
                      style={{
                        transform: isCurrentlySwiping ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
                        transition: isCurrentlySwiping ? 'none' : 'transform 0.2s ease-out'
                      }}
                      onTouchStart={(e) => handleTouchStart(notification.id, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => {
                        if (!notification.isRead) markAsRead(notification.id);
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          getNotificationColor(notification.type)
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm line-clamp-1",
                              !notification.isRead ? "font-semibold" : "font-medium"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          {notification.actionUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-2 text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                                setIsOpen(false);
                                // In real app, would use router.push
                              }}
                            >
                              {notification.actionLabel || "View"}
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>

                        {/* Priority indicator */}
                        {notification.priority === "high" && !notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                        )}
                      </div>

                      {/* Desktop delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 hidden sm:flex hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {filter === "unread" ? "All caught up!" : "No notifications"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You've read all your notifications"
                  : "You don't have any notifications yet"
                }
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={clearAll}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Swipe left on mobile to delete
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Compact notification bell for mobile nav
export function NotificationBell({ className }: { className?: string }) {
  const [unreadCount] = useState(3); // In real app, would come from context/state

  return (
    <div className={cn("relative", className)}>
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
}
