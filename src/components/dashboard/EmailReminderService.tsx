"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Bell,
  Smartphone,
  CheckCircle,
  Send,
  Clock,
  Settings,
  AlertCircle,
  Calendar,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ReminderPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  emailAddress: string;
  phoneNumber: string;
  reminderTiming: string[];
  weeklyDigest: boolean;
  goalUpdates: boolean;
}

interface SentEmail {
  id: string;
  type: "test_reminder" | "goal_update" | "weekly_digest" | "results_ready";
  subject: string;
  sentAt: string;
  status: "sent" | "delivered" | "opened" | "failed";
}

// Mock sent emails
const mockSentEmails: SentEmail[] = [
  {
    id: "email_1",
    type: "test_reminder",
    subject: "Reminder: Liver Function Test in 3 days",
    sentAt: "2024-06-12T09:00:00Z",
    status: "opened"
  },
  {
    id: "email_2",
    type: "goal_update",
    subject: "Great progress on your Triglycerides goal!",
    sentAt: "2024-03-05T10:00:00Z",
    status: "delivered"
  },
  {
    id: "email_3",
    type: "weekly_digest",
    subject: "Your Weekly Liver Health Summary",
    sentAt: "2024-03-04T08:00:00Z",
    status: "opened"
  },
  {
    id: "email_4",
    type: "results_ready",
    subject: "New test results available",
    sentAt: "2024-03-01T14:30:00Z",
    status: "opened"
  }
];

interface EmailReminderServiceProps {
  userEmail?: string;
  userPhone?: string;
}

export function EmailReminderService({
  userEmail = "sarah.johnson@example.com",
  userPhone = "+61 412 345 678"
}: EmailReminderServiceProps) {
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    email: true,
    sms: true,
    push: true,
    emailAddress: userEmail,
    phoneNumber: userPhone,
    reminderTiming: ["3_days", "1_day"],
    weeklyDigest: true,
    goalUpdates: true
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendTestEmail = async () => {
    setIsSending(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSending(false);
    setIsTestEmailOpen(false);
    toast.success("Test email sent to " + preferences.emailAddress);
  };

  const handleSavePreferences = () => {
    toast.success("Notification preferences saved");
    setIsSettingsOpen(false);
  };

  const getStatusColor = (status: SentEmail["status"]) => {
    switch (status) {
      case "opened": return "bg-green-500";
      case "delivered": return "bg-blue-500";
      case "sent": return "bg-yellow-500";
      case "failed": return "bg-red-500";
    }
  };

  const getTypeIcon = (type: SentEmail["type"]) => {
    switch (type) {
      case "test_reminder": return Calendar;
      case "goal_update": return Sparkles;
      case "weekly_digest": return Mail;
      case "results_ready": return Bell;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Email Reminders
            </CardTitle>
            <CardDescription>Manage your test reminders and notification preferences</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsTestEmailOpen(true)}>
              <Send className="w-4 h-4 mr-1" />
              Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Channels */}
        <div>
          <h4 className="text-sm font-medium mb-3">Active Notification Channels</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${preferences.email ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Mail className={`w-4 h-4 ${preferences.email ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">Email</span>
                {preferences.email && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{preferences.emailAddress}</p>
            </div>
            <div className={`p-3 rounded-lg border ${preferences.sms ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className={`w-4 h-4 ${preferences.sms ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">SMS</span>
                {preferences.sms && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground">{preferences.phoneNumber}</p>
            </div>
            <div className={`p-3 rounded-lg border ${preferences.push ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Bell className={`w-4 h-4 ${preferences.push ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">Push</span>
                {preferences.push && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground">Browser & App</p>
            </div>
          </div>
        </div>

        {/* Reminder Timing */}
        <div>
          <h4 className="text-sm font-medium mb-3">Reminder Schedule</h4>
          <div className="flex flex-wrap gap-2">
            {preferences.reminderTiming.includes("7_days") && (
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />1 week before</Badge>
            )}
            {preferences.reminderTiming.includes("3_days") && (
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />3 days before</Badge>
            )}
            {preferences.reminderTiming.includes("1_day") && (
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />1 day before</Badge>
            )}
            {preferences.reminderTiming.includes("same_day") && (
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Morning of test</Badge>
            )}
          </div>
        </div>

        {/* Email Types */}
        <div>
          <h4 className="text-sm font-medium mb-3">Email Types</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Test Reminders</span>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Goal Progress Updates</span>
              </div>
              <Badge className={preferences.goalUpdates ? "bg-green-600" : "bg-gray-400"}>
                {preferences.goalUpdates ? "Active" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600" />
                <span className="text-sm">Weekly Health Digest</span>
              </div>
              <Badge className={preferences.weeklyDigest ? "bg-green-600" : "bg-gray-400"}>
                {preferences.weeklyDigest ? "Active" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span className="text-sm">Results Available</span>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </div>
        </div>

        {/* Recent Emails */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Notifications</h4>
          <div className="space-y-2">
            {mockSentEmails.map(email => {
              const Icon = getTypeIcon(email.type);
              return (
                <div key={email.id} className="flex items-center gap-3 p-2 rounded border border-border">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{email.subject}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(email.sentAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(email.status)}`} />
                    <span className="text-xs text-muted-foreground capitalize">{email.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure how and when you receive reminders
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Channels</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <Label htmlFor="email-toggle">Email Notifications</Label>
                </div>
                <Switch
                  id="email-toggle"
                  checked={preferences.email}
                  onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, email: checked })}
                />
              </div>
              {preferences.email && (
                <Input
                  type="email"
                  value={preferences.emailAddress}
                  onChange={(e) => setPreferences({ ...preferences, emailAddress: e.target.value })}
                  placeholder="your@email.com"
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <Label htmlFor="sms-toggle">SMS Notifications</Label>
                </div>
                <Switch
                  id="sms-toggle"
                  checked={preferences.sms}
                  onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, sms: checked })}
                />
              </div>
              {preferences.sms && (
                <Input
                  type="tel"
                  value={preferences.phoneNumber}
                  onChange={(e) => setPreferences({ ...preferences, phoneNumber: e.target.value })}
                  placeholder="+61 400 000 000"
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <Label htmlFor="push-toggle">Push Notifications</Label>
                </div>
                <Switch
                  id="push-toggle"
                  checked={preferences.push}
                  onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, push: checked })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Reminder Timing</h4>
              <Select
                value={preferences.reminderTiming.join(",")}
                onValueChange={(value) => setPreferences({ ...preferences, reminderTiming: value.split(",") })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_day">1 day before only</SelectItem>
                  <SelectItem value="3_days,1_day">3 days + 1 day before</SelectItem>
                  <SelectItem value="7_days,3_days,1_day">1 week + 3 days + 1 day</SelectItem>
                  <SelectItem value="7_days,3_days,1_day,same_day">All reminders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Additional Emails</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="digest-toggle">Weekly Health Digest</Label>
                <Switch
                  id="digest-toggle"
                  checked={preferences.weeklyDigest}
                  onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, weeklyDigest: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="goals-toggle">Goal Progress Updates</Label>
                <Switch
                  id="goals-toggle"
                  checked={preferences.goalUpdates}
                  onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, goalUpdates: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={isTestEmailOpen} onOpenChange={setIsTestEmailOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test reminder email to verify your settings
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Test Reminder Email</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                This will send a sample reminder email to:
              </p>
              <p className="font-medium">{preferences.emailAddress}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendTestEmail} disabled={isSending}>
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
