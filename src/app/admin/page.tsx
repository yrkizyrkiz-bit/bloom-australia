"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Upload,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useAdminStats } from "@/hooks/useApi";

export default function AdminDashboardPage() {
  const { data: adminData, isLoading, error } = useAdminStats();

  // Use API data or fallback values
  const stats = {
    totalMembers: adminData?.overview?.totalUsers || 0,
    activeMembers: adminData?.overview?.activeUsers || 0,
    pendingReports: adminData?.overview?.pendingLabReports || 0,
    processedThisMonth: adminData?.overview?.processedThisMonth || 0,
    newUsersThisMonth: adminData?.overview?.newUsersThisMonth || 0,
    userGrowth: adminData?.overview?.userGrowth || 0,
  };

  // Map recent activity from API or use placeholder
  const recentActivity = adminData?.recentActivity?.slice(0, 5).map((a: any) => ({
    type: a.action?.includes("UPLOAD") ? "upload" : a.action?.includes("USER") ? "member" : "alert",
    message: `${a.userName || "System"}: ${a.action?.replace(/_/g, " ").toLowerCase()}`,
    time: new Date(a.createdAt).toLocaleDateString(),
    status: a.action?.includes("CREATED") || a.action?.includes("UPLOADED") ? "success" :
            a.action?.includes("CRITICAL") ? "warning" : "info",
  })) || [];

  // Users with critical biomarkers
  const criticalUsers = adminData?.usersWithCritical || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage members and upload biomarker results
          {error && <span className="text-yellow-600 text-xs ml-2">(Using cached data)</span>}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  {stats.totalMembers}
                </p>
                {stats.newUsersThisMonth > 0 && (
                  <p className="text-xs text-green-600 mt-1">+{stats.newUsersThisMonth} this month</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-3xl font-serif font-bold text-green-600 mt-1">
                  {stats.activeMembers}
                </p>
                {stats.userGrowth !== 0 && (
                  <p className={`text-xs mt-1 ${stats.userGrowth > 0 ? "text-green-600" : "text-red-600"}`}>
                    {stats.userGrowth > 0 ? "+" : ""}{stats.userGrowth}% growth
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Uploads</p>
                <p className="text-3xl font-serif font-bold text-yellow-600 mt-1">
                  {stats.pendingReports}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed This Month</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  {stats.processedThisMonth}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Biomarkers Alert */}
      {criticalUsers.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Critical Results Requiring Review ({criticalUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalUsers.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-red-500/5">
                  <div>
                    <p className="font-medium text-sm">{item.userName}</p>
                    <p className="text-xs text-muted-foreground">{item.biomarker}: {item.value}</p>
                  </div>
                  <Link href={`/admin/members?search=${item.userEmail}`}>
                    <Button variant="outline" size="sm">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-dashed hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Upload Results</h3>
                <p className="text-sm text-muted-foreground">
                  Upload new biomarker results for members
                </p>
              </div>
              <Link href="/admin/upload">
                <Button>
                  Upload
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Manage Members</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage member accounts
                </p>
              </div>
              <Link href="/admin/members">
                <Button variant="outline">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.status === "success" ? "bg-green-500/10" :
                      activity.status === "warning" ? "bg-yellow-500/10" :
                      "bg-blue-500/10"
                    }`}>
                      {activity.status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {activity.status === "warning" && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                      {activity.status === "info" && <Users className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      activity.status === "success" ? "bg-green-500/10 text-green-600" :
                      activity.status === "warning" ? "bg-yellow-500/10 text-yellow-600" :
                      "bg-blue-500/10 text-blue-600"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
