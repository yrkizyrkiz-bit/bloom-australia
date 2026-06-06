"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Plus,
  Search,
  Send,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Filter,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "reminder" | "alert" | "achievement" | "info";
  channel: "email" | "sms" | "push" | "all";
  recipients: "all" | "group" | "individual";
  recipientDetails: string;
  status: "sent" | "scheduled" | "draft" | "failed";
  scheduledFor?: string;
  sentAt?: string;
  openRate?: number;
  createdBy: string;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Test Reminder",
    message: "Your liver function test is scheduled for tomorrow at 9:00 AM. Please remember to fast for 12 hours before the test.",
    type: "reminder",
    channel: "email",
    recipients: "individual",
    recipientDetails: "Sarah Johnson",
    status: "sent",
    sentAt: "2024-01-15 08:00",
    openRate: 100,
    createdBy: "System"
  },
  {
    id: "n2",
    title: "Goal Achievement",
    message: "Congratulations! You've achieved your GGT target goal. Keep up the great work!",
    type: "achievement",
    channel: "all",
    recipients: "individual",
    recipientDetails: "Michael Chen",
    status: "sent",
    sentAt: "2024-01-14 14:30",
    openRate: 100,
    createdBy: "System"
  },
  {
    id: "n3",
    title: "Monthly Health Report",
    message: "Your January liver health report is ready. View your progress and personalized recommendations.",
    type: "info",
    channel: "email",
    recipients: "all",
    recipientDetails: "All Members (156)",
    status: "scheduled",
    scheduledFor: "2024-02-01 09:00",
    createdBy: "Admin"
  },
  {
    id: "n4",
    title: "Elevated Marker Alert",
    message: "Your recent test shows elevated ALT levels. Please consult with your healthcare provider.",
    type: "alert",
    channel: "email",
    recipients: "individual",
    recipientDetails: "Emma Wilson",
    status: "sent",
    sentAt: "2024-01-13 11:00",
    openRate: 100,
    createdBy: "System"
  },
];

const mockMembers = [
  { id: "user_1", name: "Sarah Johnson" },
  { id: "user_2", name: "Michael Chen" },
  { id: "user_3", name: "Emma Wilson" },
  { id: "user_4", name: "James Brown" },
];

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "reminder" as Notification["type"],
    channel: "email" as Notification["channel"],
    recipients: "all" as Notification["recipients"],
    memberId: "",
    scheduleDate: "",
    scheduleTime: ""
  });

  // Notification settings
  const [settings, setSettings] = useState({
    autoReminders: true,
    goalAchievements: true,
    testResults: true,
    weeklyDigest: false,
    reminderDays: 3
  });

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         n.recipientDetails.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Notification["status"]) => {
    switch (status) {
      case "sent": return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "scheduled": return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const getTypeBadge = (type: Notification["type"]) => {
    switch (type) {
      case "reminder": return <Badge variant="outline" className="border-purple-500 text-purple-600">Reminder</Badge>;
      case "alert": return <Badge variant="outline" className="border-red-500 text-red-600">Alert</Badge>;
      case "achievement": return <Badge variant="outline" className="border-green-500 text-green-600">Achievement</Badge>;
      case "info": return <Badge variant="outline" className="border-blue-500 text-blue-600">Info</Badge>;
    }
  };

  const getChannelIcon = (channel: Notification["channel"]) => {
    switch (channel) {
      case "email": return <Mail className="w-4 h-4" />;
      case "sms": return <MessageSquare className="w-4 h-4" />;
      case "push": return <Bell className="w-4 h-4" />;
      case "all": return <Users className="w-4 h-4" />;
    }
  };

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("Please fill in title and message");
      return;
    }

    const member = newNotification.recipients === "individual"
      ? mockMembers.find(m => m.id === newNotification.memberId)
      : null;

    const notification: Notification = {
      id: `n_${Date.now()}`,
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      channel: newNotification.channel,
      recipients: newNotification.recipients,
      recipientDetails: newNotification.recipients === "all"
        ? "All Members (156)"
        : member?.name || "Selected Group",
      status: newNotification.scheduleDate ? "scheduled" : "sent",
      scheduledFor: newNotification.scheduleDate
        ? `${newNotification.scheduleDate} ${newNotification.scheduleTime || "09:00"}`
        : undefined,
      sentAt: !newNotification.scheduleDate
        ? new Date().toLocaleString()
        : undefined,
      createdBy: "Admin"
    };

    setNotifications([notification, ...notifications]);
    setIsCreateDialogOpen(false);
    setNewNotification({
      title: "",
      message: "",
      type: "reminder",
      channel: "email",
      recipients: "all",
      memberId: "",
      scheduleDate: "",
      scheduleTime: ""
    });

    toast.success(notification.status === "scheduled"
      ? "Notification scheduled successfully"
      : "Notification sent successfully"
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    toast.success("Notification deleted");
  };

  const handleResendNotification = (notification: Notification) => {
    toast.success(`Notification resent to ${notification.recipientDetails}`);
  };

  const stats = {
    totalSent: notifications.filter(n => n.status === "sent").length,
    scheduled: notifications.filter(n => n.status === "scheduled").length,
    avgOpenRate: Math.round(
      notifications
        .filter(n => n.openRate !== undefined)
        .reduce((sum, n) => sum + (n.openRate || 0), 0) /
      notifications.filter(n => n.openRate !== undefined).length || 0
    )
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.avgOpenRate}%</p>
              <p className="text-xs text-muted-foreground">Avg Open Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Notification List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage member notifications and alerts</CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create Notification
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notification</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map(notification => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {notification.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">{notification.recipientDetails}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {getChannelIcon(notification.channel)}
                            <span className="text-xs capitalize">{notification.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {notification.sentAt || notification.scheduledFor}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {notification.status === "sent" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendNotification(notification)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>Configure automatic notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Auto Test Reminders</Label>
                  <p className="text-xs text-muted-foreground">Send reminders before scheduled tests</p>
                </div>
                <Switch
                  checked={settings.autoReminders}
                  onCheckedChange={(checked) => setSettings({...settings, autoReminders: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Goal Achievements</Label>
                  <p className="text-xs text-muted-foreground">Notify when members achieve goals</p>
                </div>
                <Switch
                  checked={settings.goalAchievements}
                  onCheckedChange={(checked) => setSettings({...settings, goalAchievements: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Test Results</Label>
                  <p className="text-xs text-muted-foreground">Notify when results are available</p>
                </div>
                <Switch
                  checked={settings.testResults}
                  onCheckedChange={(checked) => setSettings({...settings, testResults: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Weekly Digest</Label>
                  <p className="text-xs text-muted-foreground">Send weekly summary emails</p>
                </div>
                <Switch
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => setSettings({...settings, weeklyDigest: checked})}
                />
              </div>

              <div className="pt-2 border-t">
                <Label className="font-medium">Reminder Days Before</Label>
                <p className="text-xs text-muted-foreground mb-2">Days before test to send reminder</p>
                <Select
                  value={settings.reminderDays.toString()}
                  onValueChange={(v) => setSettings({...settings, reminderDays: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">7 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full mt-4" variant="outline" onClick={() => toast.success("Settings saved")}>
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Create Notification
            </DialogTitle>
            <DialogDescription>Send a notification to members</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newNotification.title}
                onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                placeholder="Notification title"
              />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                placeholder="Write your message..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(v: Notification["type"]) => setNewNotification({...newNotification, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Channel</Label>
                <Select
                  value={newNotification.channel}
                  onValueChange={(v: Notification["channel"]) => setNewNotification({...newNotification, channel: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="all">All Channels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Recipients</Label>
              <Select
                value={newNotification.recipients}
                onValueChange={(v: Notification["recipients"]) => setNewNotification({...newNotification, recipients: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="individual">Individual Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newNotification.recipients === "individual" && (
              <div>
                <Label>Select Member</Label>
                <Select
                  value={newNotification.memberId}
                  onValueChange={(v) => setNewNotification({...newNotification, memberId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Schedule Date (optional)</Label>
                <Input
                  type="date"
                  value={newNotification.scheduleDate}
                  onChange={(e) => setNewNotification({...newNotification, scheduleDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Schedule Time</Label>
                <Input
                  type="time"
                  value={newNotification.scheduleTime}
                  onChange={(e) => setNewNotification({...newNotification, scheduleTime: e.target.value})}
                  disabled={!newNotification.scheduleDate}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Leave schedule empty to send immediately
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateNotification}>
              {newNotification.scheduleDate ? "Schedule" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
