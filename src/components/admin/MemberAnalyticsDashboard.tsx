"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Flame
} from "lucide-react";

interface EngagementMetrics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  churnRate: number;
  avgLoginsPerWeek: number;
  avgSessionDuration: string;
  goalCompletionRate: number;
  testComplianceRate: number;
  notificationOpenRate: number;
  avgHealthScore: number;
  healthScoreTrend: number;
}

interface MemberSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
  trend: "up" | "down" | "stable";
}

interface TopPerformer {
  id: string;
  name: string;
  healthScore: number;
  goalsCompleted: number;
  streak: number;
  improvement: number;
}

const mockMetrics: EngagementMetrics = {
  totalMembers: 156,
  activeMembers: 134,
  newMembersThisMonth: 12,
  churnRate: 2.3,
  avgLoginsPerWeek: 3.2,
  avgSessionDuration: "4m 32s",
  goalCompletionRate: 68,
  testComplianceRate: 85,
  notificationOpenRate: 72,
  avgHealthScore: 76,
  healthScoreTrend: 4.2
};

const mockSegments: MemberSegment[] = [
  { name: "Highly Engaged", count: 45, percentage: 29, color: "bg-green-500", trend: "up" },
  { name: "Moderately Engaged", count: 67, percentage: 43, color: "bg-blue-500", trend: "stable" },
  { name: "Low Engagement", count: 32, percentage: 21, color: "bg-yellow-500", trend: "down" },
  { name: "At Risk", count: 12, percentage: 7, color: "bg-red-500", trend: "down" },
];

const mockTopPerformers: TopPerformer[] = [
  { id: "1", name: "Sarah Johnson", healthScore: 92, goalsCompleted: 8, streak: 45, improvement: 18 },
  { id: "2", name: "Michael Chen", healthScore: 89, goalsCompleted: 6, streak: 32, improvement: 15 },
  { id: "3", name: "Emma Wilson", healthScore: 87, goalsCompleted: 7, streak: 28, improvement: 12 },
  { id: "4", name: "James Brown", healthScore: 85, goalsCompleted: 5, streak: 21, improvement: 10 },
  { id: "5", name: "Lisa Anderson", healthScore: 84, goalsCompleted: 4, streak: 18, improvement: 8 },
];

const weeklyActivity = [
  { day: "Mon", logins: 78, tests: 12, goals: 5 },
  { day: "Tue", logins: 92, tests: 8, goals: 7 },
  { day: "Wed", logins: 85, tests: 15, goals: 4 },
  { day: "Thu", logins: 88, tests: 10, goals: 6 },
  { day: "Fri", logins: 95, tests: 18, goals: 8 },
  { day: "Sat", logins: 45, tests: 5, goals: 2 },
  { day: "Sun", logins: 38, tests: 3, goals: 1 },
];

export function MemberAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [metrics] = useState<EngagementMetrics>(mockMetrics);

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const maxLogins = Math.max(...weeklyActivity.map(d => d.logins));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Member Analytics</h2>
          <p className="text-sm text-muted-foreground">Track engagement and health outcomes</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{metrics.newMembersThisMonth} this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
              <Activity className="w-8 h-8 text-green-500/20" />
            </div>
            <div className="mt-2">
              <Progress value={(metrics.activeMembers / metrics.totalMembers) * 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((metrics.activeMembers / metrics.totalMembers) * 100)}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.avgHealthScore}</p>
                <p className="text-xs text-muted-foreground">Avg Health Score</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500/20" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.healthScoreTrend}% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.goalCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Goal Completion</p>
              </div>
              <Target className="w-8 h-8 text-purple-500/20" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.goalCompletionRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement & Compliance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Avg Logins/Week</p>
                  <p className="text-xs text-muted-foreground">Per active member</p>
                </div>
              </div>
              <p className="text-xl font-bold">{metrics.avgLoginsPerWeek}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Avg Session Duration</p>
                  <p className="text-xs text-muted-foreground">Time spent per visit</p>
                </div>
              </div>
              <p className="text-xl font-bold">{metrics.avgSessionDuration}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Notification Open Rate</p>
                  <p className="text-xs text-muted-foreground">Email & push combined</p>
                </div>
              </div>
              <p className="text-xl font-bold">{metrics.notificationOpenRate}%</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Churn Rate</p>
                  <p className="text-xs text-muted-foreground">Monthly average</p>
                </div>
              </div>
              <p className="text-xl font-bold text-red-600">{metrics.churnRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Member Segments
            </CardTitle>
            <CardDescription>Engagement level distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSegments.map((segment) => (
              <div key={segment.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                    <span className="text-sm font-medium">{segment.name}</span>
                    {getTrendIcon(segment.trend)}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">{segment.count}</span>
                    <span className="text-muted-foreground ml-1">({segment.percentage}%)</span>
                  </div>
                </div>
                <Progress value={segment.percentage} className={`h-2 ${segment.color}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity & Top Performers */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Login activity by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/20 rounded-t relative group cursor-pointer hover:bg-primary/30 transition-colors"
                    style={{ height: `${(day.logins / maxLogins) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.logins} logins
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                <span>Logins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Members with best health outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTopPerformers.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500 text-yellow-950" :
                    index === 1 ? "bg-gray-300 text-gray-700" :
                    index === 2 ? "bg-amber-600 text-amber-50" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{member.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {member.streak}d streak
                      </span>
                      <span>|</span>
                      <span>{member.goalsCompleted} goals</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{member.healthScore}</p>
                    <p className="text-xs text-green-600">+{member.improvement}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Test Compliance Overview
          </CardTitle>
          <CardDescription>Member adherence to scheduled testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <p className="text-3xl font-bold text-green-600">{metrics.testComplianceRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Overall Compliance</p>
              <Badge className="mt-2 bg-green-600">Excellent</Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">132</p>
              <p className="text-sm text-muted-foreground mt-1">Tests Completed</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">24</p>
              <p className="text-sm text-muted-foreground mt-1">Tests Scheduled</p>
              <p className="text-xs text-muted-foreground">Next 30 days</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-500/10">
              <p className="text-3xl font-bold text-orange-600">8</p>
              <p className="text-sm text-muted-foreground mt-1">Overdue Tests</p>
              <Badge variant="outline" className="mt-2 border-orange-500 text-orange-600">Needs Attention</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
