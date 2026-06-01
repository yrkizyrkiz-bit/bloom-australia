"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getCRMStats,
  customerAccounts,
  tasks,
  activities,
  communications,
  invoices,
  subscriptionPlans
} from "@/data/crm-data";
import { mockUsers } from "@/data/mock-data";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  UserPlus,
  CreditCard,
  MessageSquare,
  Target,
  Activity,
  FileText,
  Kanban,
  Bell,
  PhoneCall,
  Loader2,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";

interface FollowUp {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  subject: string;
  notes?: string;
  followUpDate: string;
  calledAt: string;
  agentName?: string;
  status: "overdue" | "today" | "upcoming";
}

interface FollowUpsData {
  overdue: FollowUp[];
  dueToday: FollowUp[];
  upcoming: FollowUp[];
  total: number;
}

export default function CRMDashboardPage() {
  const stats = getCRMStats();

  // Follow-ups state
  const [followUps, setFollowUps] = useState<FollowUpsData | null>(null);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);
  const [sendingSMS, setSendingSMS] = useState(false);

  // Fetch follow-ups
  const fetchFollowUps = useCallback(async () => {
    try {
      const res = await fetch("/api/care-comms?followUps=true");
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps);
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setFollowUpsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Send urgent SMS reminders
  const handleSendUrgentReminders = async () => {
    if (!followUps?.overdue.length) return;

    setSendingSMS(true);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendUrgentFollowUpReminders" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sent ${data.sent} SMS reminders`);
      } else {
        toast.error("Failed to send SMS reminders");
      }
    } catch (error) {
      toast.error("Failed to send SMS reminders");
    } finally {
      setSendingSMS(false);
    }
  };

  const recentActivities = useMemo(() => {
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, []);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === "pending" || t.status === "in_progress")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, []);

  const pendingInvoices = useMemo(() => {
    return invoices.filter(i => i.status === "pending");
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payment": return <DollarSign className="w-4 h-4 text-green-500" />;
      case "email": return <Mail className="w-4 h-4 text-blue-500" />;
      case "call": return <Phone className="w-4 h-4 text-purple-500" />;
      case "meeting": return <Calendar className="w-4 h-4 text-orange-500" />;
      case "status_change": return <Activity className="w-4 h-4 text-yellow-500" />;
      case "login": return <Users className="w-4 h-4 text-gray-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "high": return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/30";
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customerAccounts.find(c => c.id === customerId);
    if (!customer) return "Unknown";
    const user = mockUsers.find(u => u.id === customer.userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage customers, billing, and communications</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/crm/customers">
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              Customers
            </Button>
          </Link>
          <Link href="/admin/crm/customers/new">
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">{stats.totalCustomers}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.newCustomersThisMonth} this month
                </p>
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
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-serif font-bold text-green-600 mt-1">${stats.monthlyRecurringRevenue}</p>
                <p className="text-xs text-muted-foreground mt-1">MRR</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">{stats.activeCustomers}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {stats.churnedThisMonth} churned
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. LTV</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">${Math.round(stats.averageLifetimeValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">per customer</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Follow-ups Widget */}
      {followUps && followUps.total > 0 && (
        <Card className="border-orange-200 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                    Pending Follow-ups
                  </CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-400">
                    {followUps.total} member{followUps.total !== 1 ? 's' : ''} require follow-up
                  </CardDescription>
                </div>
              </div>
              {followUps.overdue.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendUrgentReminders}
                  disabled={sendingSMS}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {sendingSMS ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  Send SMS Reminders
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Overdue */}
              <div className={`p-4 rounded-lg ${followUps.overdue.length > 0 ? 'bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50' : 'bg-white/50 dark:bg-slate-900/50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className={`w-4 h-4 ${followUps.overdue.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${followUps.overdue.length > 0 ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>
                    Overdue ({followUps.overdue.length})
                  </span>
                </div>
                {followUps.overdue.length > 0 ? (
                  <div className="space-y-2">
                    {followUps.overdue.slice(0, 3).map(f => (
                      <Link key={f.id} href={`/admin/crm/customers/${f.memberId}`}>
                        <div className="p-2 rounded bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer">
                          <p className="font-medium text-sm text-red-800 dark:text-red-200 truncate">{f.memberName}</p>
                          <p className="text-xs text-red-600 dark:text-red-400 truncate">{f.subject}</p>
                          <p className="text-xs text-red-500 mt-1">
                            Due: {new Date(f.followUpDate).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {followUps.overdue.length > 3 && (
                      <p className="text-xs text-red-600 text-center">+{followUps.overdue.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No overdue follow-ups</p>
                )}
              </div>

              {/* Due Today */}
              <div className={`p-4 rounded-lg ${followUps.dueToday.length > 0 ? 'bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50' : 'bg-white/50 dark:bg-slate-900/50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className={`w-4 h-4 ${followUps.dueToday.length > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${followUps.dueToday.length > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
                    Due Today ({followUps.dueToday.length})
                  </span>
                </div>
                {followUps.dueToday.length > 0 ? (
                  <div className="space-y-2">
                    {followUps.dueToday.slice(0, 3).map(f => (
                      <Link key={f.id} href={`/admin/crm/customers/${f.memberId}`}>
                        <div className="p-2 rounded bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer">
                          <p className="font-medium text-sm text-amber-800 dark:text-amber-200 truncate">{f.memberName}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 truncate">{f.subject}</p>
                        </div>
                      </Link>
                    ))}
                    {followUps.dueToday.length > 3 && (
                      <p className="text-xs text-amber-600 text-center">+{followUps.dueToday.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No follow-ups due today</p>
                )}
              </div>

              {/* Upcoming */}
              <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Upcoming ({followUps.upcoming.length})
                  </span>
                </div>
                {followUps.upcoming.length > 0 ? (
                  <div className="space-y-2">
                    {followUps.upcoming.slice(0, 3).map(f => (
                      <Link key={f.id} href={`/admin/crm/customers/${f.memberId}`}>
                        <div className="p-2 rounded bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer">
                          <p className="font-medium text-sm truncate">{f.memberName}</p>
                          <p className="text-xs text-muted-foreground truncate">{f.subject}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {new Date(f.followUpDate).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {followUps.upcoming.length > 3 && (
                      <p className="text-xs text-blue-600 text-center">+{followUps.upcoming.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming follow-ups</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state for follow-ups */}
      {followUpsLoading && (
        <Card className="border-dashed">
          <CardContent className="py-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading follow-ups...</span>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Link href="/admin/crm/customers">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Customers</p>
                <p className="text-sm text-muted-foreground">Manage accounts</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/crm/communications">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Communications</p>
                <p className="text-sm text-muted-foreground">Send emails</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/crm/analytics">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">Email tracking</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/crm/billing">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Billing</p>
                <p className="text-sm text-muted-foreground">Invoices & PDF</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/crm/pipeline">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Kanban className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Pipeline</p>
                <p className="text-sm text-muted-foreground">Sales tracking</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/crm/tasks">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Tasks</p>
                <p className="text-sm text-muted-foreground">{stats.openTasks} open</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCustomerName(activity.customerId)} • {new Date(activity.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tasks & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map(task => {
                const isOverdue = new Date(task.dueDate) < new Date();
                return (
                  <div key={task.id} className={`p-3 rounded-lg border ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'bg-muted/50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.customerId && (
                          <p className="text-xs text-muted-foreground">{getCustomerName(task.customerId)}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {isOverdue ? 'Overdue: ' : ''}{new Date(task.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {upcomingTasks.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">All caught up!</p>
                </div>
              )}
            </div>

            {/* Pending Invoices Alert */}
            {pendingInvoices.length > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-medium text-orange-600">
                    {pendingInvoices.length} pending invoice{pendingInvoices.length > 1 ? 's' : ''}
                  </p>
                </div>
                <Link href="/admin/crm/billing">
                  <Button variant="link" size="sm" className="px-0 mt-1 text-orange-600">
                    View invoices <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Overview by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionPlans.map(plan => {
              const count = customerAccounts.filter(c => c.tier === plan.tier && c.status === "active").length;
              const revenue = count * plan.price;
              return (
                <div key={plan.id} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{plan.name}</h4>
                    <Badge variant="outline">${plan.price}/mo</Badge>
                  </div>
                  <p className="text-2xl font-serif font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">customers</p>
                  <p className="text-sm text-green-600 mt-2">${revenue}/mo revenue</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
