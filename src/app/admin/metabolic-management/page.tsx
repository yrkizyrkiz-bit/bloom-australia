"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Users,
  Calendar,
  Target,
  Bell,
  BarChart3,
  Sparkles,
  Settings,
  Download,
  History,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Droplets,
  Zap
} from "lucide-react";
import { TestSchedulingManager } from "@/components/admin/TestSchedulingManager";
import { MemberGoalsManager } from "@/components/admin/MemberGoalsManager";
import { NotificationManager } from "@/components/admin/NotificationManager";
import { AIRecommendationsManager } from "@/components/admin/AIRecommendationsManager";
import { MemberAnalyticsDashboard } from "@/components/admin/MemberAnalyticsDashboard";
import { DataExport, memberExportFields, goalExportFields, testExportFields } from "@/components/admin/DataExport";
import { AuditLog } from "@/components/admin/AuditLog";

export default function MetabolicManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    totalMembers: 168,
    activeGoals: 95,
    scheduledTests: 42,
    pendingNotifications: 14,
    avgMetabolicScore: 81
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-foreground">
            Metabolic Panel Management
          </h1>
          <p className="text-muted-foreground">
            Manage metabolic tests, glucose monitoring, electrolytes, and kidney function
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
              <Target className="w-8 h-8 text-orange-500" />
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
              <BarChart3 className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgMetabolicScore}</p>
                <p className="text-xs text-muted-foreground">Avg Metabolic Score</p>
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
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm">John Smith HbA1c improved to 5.4%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">18 comprehensive panels completed</span>
                  </div>
                  <span className="text-xs text-muted-foreground">4h ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-sm">eGFR reference data updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm">8 prediabetes alerts sent</span>
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
                      <p className="font-medium text-sm">Schedule CMP</p>
                      <p className="text-xs text-muted-foreground">Book comprehensive metabolic panel</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("goals")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-sm">Set Metabolic Goals</p>
                      <p className="text-xs text-muted-foreground">Glucose, HbA1c, kidney targets</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("notifications")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">Send Alert</p>
                      <p className="text-xs text-muted-foreground">Notify about metabolic concerns</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setActiveTab("analytics")} className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">View Metabolic Analytics</p>
                      <p className="text-xs text-muted-foreground">Diabetes risk distribution</p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Blood Sugar Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Blood Sugar Status Distribution
              </CardTitle>
              <CardDescription>Based on fasting glucose and HbA1c values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">112</p>
                  <p className="text-xs text-muted-foreground">Normal</p>
                  <p className="text-xs text-muted-foreground">Glucose &lt;100, HbA1c &lt;5.7%</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">38</p>
                  <p className="text-xs text-muted-foreground">Prediabetic</p>
                  <p className="text-xs text-muted-foreground">Glucose 100-125, HbA1c 5.7-6.4%</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">18</p>
                  <p className="text-xs text-muted-foreground">Diabetic Range</p>
                  <p className="text-xs text-muted-foreground">Glucose ≥126, HbA1c ≥6.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi-category Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Blood Sugar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Fasting Glucose</span>
                    <span className="font-medium">94 mg/dL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg HbA1c</span>
                    <span className="font-medium">5.4%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Improved (6mo)</span>
                    <span className="font-medium text-green-600">68%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  Kidney Function
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg eGFR</span>
                    <span className="font-medium">95 mL/min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Creatinine</span>
                    <span className="font-medium">0.92 mg/dL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>eGFR &gt;90</span>
                    <span className="font-medium text-green-600">82%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Electrolytes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Sodium</span>
                    <span className="font-medium">140 mEq/L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Potassium</span>
                    <span className="font-medium">4.2 mEq/L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Balanced</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Population Metabolic Improvements</CardTitle>
              <CardDescription>Average member changes over 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Fasting Glucose</span>
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">-8%</p>
                  <p className="text-xs text-muted-foreground">Avg reduction</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">HbA1c</span>
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">-0.3%</p>
                  <p className="text-xs text-muted-foreground">Avg reduction</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Insulin Sensitivity</span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">+15%</p>
                  <p className="text-xs text-muted-foreground">Avg improvement</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Kidney Function</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">Stable</p>
                  <p className="text-xs text-muted-foreground">eGFR maintained</p>
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
