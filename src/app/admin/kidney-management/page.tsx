"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
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
import { TestSchedulingManager } from "@/components/admin/TestSchedulingManager";
import { MemberGoalsManager } from "@/components/admin/MemberGoalsManager";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { AIRecommendationsManager } from "@/components/admin/AIRecommendationsManager";
import { MemberAnalyticsDashboard } from "@/components/admin/MemberAnalyticsDashboard";
import { DataExport, memberExportFields, goalExportFields, testExportFields } from "@/components/admin/DataExport";
import { AuditLog } from "@/components/admin/AuditLog";

export default function KidneyManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    totalMembers: 142,
    activeGoals: 76,
    scheduledTests: 28,
    pendingNotifications: 8,
    avgKidneyScore: 82
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-cyan-600/10 flex items-center justify-center">
          <Droplets className="w-6 h-6 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-foreground">
            Kidney Test Management
          </h1>
          <p className="text-muted-foreground">
            Manage kidney function tests, scheduling, goals, and notifications
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
              <Target className="w-8 h-8 text-cyan-500" />
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
              <BarChart3 className="w-8 h-8 text-cyan-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgKidneyScore}</p>
                <p className="text-xs text-muted-foreground">Avg Kidney Score</p>
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
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-sm">Michael Chen achieved eGFR goal</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">New kidney test scheduled for Emma Wilson</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm">UACR reference data updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm">8 kidney test reminders sent</span>
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
                <button onClick={() => setActiveTab("scheduling")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">Schedule Kidney Test</p>
                      <p className="text-xs text-muted-foreground">Book blood or urine tests</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("goals")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="font-medium text-sm">Set Kidney Goals</p>
                      <p className="text-xs text-muted-foreground">eGFR, UACR, creatinine targets</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("notifications")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">Send Notification</p>
                      <p className="text-xs text-muted-foreground">Alert members about kidney health</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("analytics")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">View Kidney Analytics</p>
                      <p className="text-xs text-muted-foreground">CKD staging distribution</p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* CKD Stage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member CKD Stage Distribution</CardTitle>
              <CardDescription>Based on eGFR values across all members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">98</p>
                  <p className="text-xs text-muted-foreground">Normal (G1)</p>
                  <p className="text-xs text-muted-foreground">eGFR ≥90</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-lime-500/10">
                  <p className="text-2xl font-bold text-lime-600">28</p>
                  <p className="text-xs text-muted-foreground">Mild (G2)</p>
                  <p className="text-xs text-muted-foreground">eGFR 60-89</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">10</p>
                  <p className="text-xs text-muted-foreground">Moderate (G3)</p>
                  <p className="text-xs text-muted-foreground">eGFR 30-59</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-500/10">
                  <p className="text-2xl font-bold text-orange-600">4</p>
                  <p className="text-xs text-muted-foreground">Severe (G4)</p>
                  <p className="text-xs text-muted-foreground">eGFR 15-29</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">2</p>
                  <p className="text-xs text-muted-foreground">Failure (G5)</p>
                  <p className="text-xs text-muted-foreground">eGFR &lt;15</p>
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
