"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bean,
  Users,
  Calendar,
  Target,
  Bell,
  BarChart3,
  Sparkles,
  Settings,
  Download,
  History,
  Activity
} from "lucide-react";
import { PopulationDataManager } from "@/components/admin/PopulationDataManager";
import { TestSchedulingManager } from "@/components/admin/TestSchedulingManager";
import { MemberGoalsManager } from "@/components/admin/MemberGoalsManager";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { AIRecommendationsManager } from "@/components/admin/AIRecommendationsManager";
import { MemberAnalyticsDashboard } from "@/components/admin/MemberAnalyticsDashboard";
import { DataExport, memberExportFields, goalExportFields, testExportFields, analyticsExportFields } from "@/components/admin/DataExport";
import { AuditLog } from "@/components/admin/AuditLog";

export default function LiverManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock stats
  const stats = {
    totalMembers: 156,
    activeGoals: 89,
    scheduledTests: 34,
    pendingNotifications: 12,
    avgLiverScore: 76
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center">
          <Bean className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-foreground">
            Liver Test Management
          </h1>
          <p className="text-muted-foreground">
            Manage population data, scheduling, goals, and notifications
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
              <Target className="w-8 h-8 text-green-500" />
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
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.avgLiverScore}</p>
                <p className="text-xs text-muted-foreground">Avg Liver Score</p>
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
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">Sarah Johnson achieved GGT goal</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">New test scheduled for Michael Chen</span>
                  </div>
                  <span className="text-xs text-muted-foreground">4h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm">Population data updated for Q1 2024</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm">12 reminder notifications sent</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setActiveTab("scheduling")}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">Schedule Test for Member</p>
                      <p className="text-xs text-muted-foreground">Book appointments manually</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("goals")}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Set Member Goals</p>
                      <p className="text-xs text-muted-foreground">Create biomarker targets</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">Send Notification</p>
                      <p className="text-xs text-muted-foreground">Alert members manually</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">View Member Analytics</p>
                      <p className="text-xs text-muted-foreground">Engagement and health metrics</p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Liver Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Liver Health Distribution</CardTitle>
              <CardDescription>Overview of liver health scores across all members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">8</p>
                  <p className="text-xs text-muted-foreground">Critical (&lt;50)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-500/10">
                  <p className="text-2xl font-bold text-orange-600">23</p>
                  <p className="text-xs text-muted-foreground">Needs Work (50-64)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">45</p>
                  <p className="text-xs text-muted-foreground">Fair (65-74)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">52</p>
                  <p className="text-xs text-muted-foreground">Good (75-84)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                  <p className="text-2xl font-bold text-emerald-600">28</p>
                  <p className="text-xs text-muted-foreground">Excellent (85+)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <MemberAnalyticsDashboard />
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="mt-6">
          <TestSchedulingManager />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-6">
          <MemberGoalsManager />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <NotificationManager />
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="ai" className="mt-6">
          <AIRecommendationsManager />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-6">
          <div className="space-y-6">
            <DataExport dataType="members" availableFields={memberExportFields} />
            <div className="grid md:grid-cols-2 gap-6">
              <DataExport dataType="goals" availableFields={goalExportFields} />
              <DataExport dataType="tests" availableFields={testExportFields} />
            </div>
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-6">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
