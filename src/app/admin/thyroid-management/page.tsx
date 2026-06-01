"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Users,
  Calendar,
  Target,
  Bell,
  BarChart3,
  Sparkles,
  Settings,
  Download,
  History,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { TestSchedulingManager } from "@/components/admin/TestSchedulingManager";
import { MemberGoalsManager } from "@/components/admin/MemberGoalsManager";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { AIRecommendationsManager } from "@/components/admin/AIRecommendationsManager";
import { MemberAnalyticsDashboard } from "@/components/admin/MemberAnalyticsDashboard";
import { DataExport, memberExportFields, goalExportFields, testExportFields } from "@/components/admin/DataExport";
import { AuditLog } from "@/components/admin/AuditLog";

export default function ThyroidManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    totalMembers: 128,
    activeGoals: 42,
    scheduledTests: 18,
    pendingNotifications: 5,
    avgThyroidScore: 88
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-foreground">
            Thyroid Function Management
          </h1>
          <p className="text-muted-foreground">
            Manage thyroid tests, TSH/T4 monitoring, scheduling, and member goals
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeGoals}</p>
                <p className="text-xs text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.scheduledTests}</p>
                <p className="text-xs text-muted-foreground">Scheduled Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingNotifications}</p>
                <p className="text-xs text-muted-foreground">Pending Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgThyroidScore}</p>
                <p className="text-xs text-muted-foreground">Avg Thyroid Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Scheduling</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Emma Wilson TSH normalized</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">5 thyroid panels completed today</span>
                  </div>
                  <span className="text-xs text-muted-foreground">6h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm">Free T4 reference ranges updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm">3 hypothyroid alerts sent</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2d ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button onClick={() => setActiveTab("scheduling")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">Schedule Thyroid Panel</p>
                      <p className="text-xs text-muted-foreground">Book TSH, Free T4, T3 tests</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("goals")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Set Thyroid Goals</p>
                      <p className="text-xs text-muted-foreground">TSH, T4 optimization targets</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("notifications")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">Send Alert</p>
                      <p className="text-xs text-muted-foreground">Notify about thyroid concerns</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("analytics")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">View Thyroid Analytics</p>
                      <p className="text-xs text-muted-foreground">Hypo/Hyperthyroid distribution</p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Thyroid Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Thyroid Status Distribution</CardTitle>
              <CardDescription>Based on TSH and Free T4 values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">98</p>
                  <p className="text-xs text-muted-foreground">Normal</p>
                  <p className="text-xs text-muted-foreground">TSH 0.5-4.0</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-600">15</p>
                  <p className="text-xs text-muted-foreground">Subclinical Hypo</p>
                  <p className="text-xs text-muted-foreground">TSH 4.0-10.0</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-500/10">
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-xs text-muted-foreground">Hypothyroid</p>
                  <p className="text-xs text-muted-foreground">TSH &gt;10.0</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-600">7</p>
                  <p className="text-xs text-muted-foreground">Hyperthyroid</p>
                  <p className="text-xs text-muted-foreground">TSH &lt;0.5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thyroid Improvement Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Treatment Outcomes</CardTitle>
              <CardDescription>Members with thyroid normalization over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">TSH Normalized</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">78%</p>
                  <p className="text-xs text-muted-foreground">Of treated members (6 months)</p>
                </div>
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">On Medication</span>
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">23</p>
                  <p className="text-xs text-muted-foreground">Members with thyroid Rx</p>
                </div>
                <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Lifestyle Managed</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">45</p>
                  <p className="text-xs text-muted-foreground">Optimized without Rx</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6"><MemberAnalyticsDashboard /></TabsContent>
        <TabsContent value="scheduling" className="mt-6"><TestSchedulingManager /></TabsContent>
        <TabsContent value="goals" className="mt-6"><MemberGoalsManager /></TabsContent>
        <TabsContent value="notifications" className="mt-6"><NotificationManager /></TabsContent>
        <TabsContent value="ai" className="mt-6"><AIRecommendationsManager /></TabsContent>
        <TabsContent value="export" className="mt-6">
          <div className="space-y-6">
            <DataExport dataType="members" availableFields={memberExportFields} />
            <div className="grid md:grid-cols-2 gap-6">
              <DataExport dataType="goals" availableFields={goalExportFields} />
              <DataExport dataType="tests" availableFields={testExportFields} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="audit" className="mt-6"><AuditLog /></TabsContent>
      </Tabs>
    </div>
  );
}
