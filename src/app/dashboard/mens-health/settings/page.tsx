"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Settings, Bell, Shield, User, Clock,
  Moon, Sparkles, Heart, Zap, Pill, ChevronRight,
  Lock, Download, Trash2, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    medicationReminders: true,
    dailyCheckIn: true,
    weeklyReport: true,
    refillAlerts: true,
    promotions: false,
  });

  const [privacy, setPrivacy] = useState({
    discreteNotifications: true,
    hideFromHealthApps: true,
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-600" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      {/* Program Status */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            Active Programs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <div>
                <p className="font-medium">Hair Restoration</p>
                <p className="text-xs text-muted-foreground">Day 45 of treatment</p>
              </div>
            </div>
            <Badge className="bg-green-500">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-600" />
              <div>
                <p className="font-medium">Sexual Wellness</p>
                <p className="text-xs text-muted-foreground">On-demand treatment</p>
              </div>
            </div>
            <Badge className="bg-green-500">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium">Daily Vitality</p>
                <p className="text-xs text-muted-foreground">14 day streak</p>
              </div>
            </div>
            <Badge className="bg-green-500">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pill className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="med-reminders">Medication Reminders</Label>
            </div>
            <Switch
              id="med-reminders"
              checked={notifications.medicationReminders}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, medicationReminders: checked });
                toast.success(checked ? "Reminders enabled" : "Reminders disabled");
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="daily-checkin">Daily Check-in Reminder</Label>
            </div>
            <Switch
              id="daily-checkin"
              checked={notifications.dailyCheckIn}
              onCheckedChange={(checked) => setNotifications({ ...notifications, dailyCheckIn: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="weekly-report">Weekly Progress Report</Label>
            </div>
            <Switch
              id="weekly-report"
              checked={notifications.weeklyReport}
              onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="refill-alerts">Refill Alerts</Label>
            </div>
            <Switch
              id="refill-alerts"
              checked={notifications.refillAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, refillAlerts: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="discrete-notif">Discreet Notifications</Label>
              <p className="text-xs text-muted-foreground">Hide medication names in notifications</p>
            </div>
            <Switch
              id="discrete-notif"
              checked={privacy.discreteNotifications}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, discreteNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hide-health">Hide from Health Apps</Label>
              <p className="text-xs text-muted-foreground">Don&apos;t share data with Apple Health / Google Fit</p>
            </div>
            <Switch
              id="hide-health"
              checked={privacy.hideFromHealthApps}
              onCheckedChange={(checked) => setPrivacy({ ...privacy, hideFromHealthApps: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Download My Data
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between text-red-600 hover:text-red-700 hover:bg-red-50">
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <Link href="/dashboard/mens-health/support">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium">Need Help?</p>
                  <p className="text-xs text-muted-foreground">Contact our support team</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
