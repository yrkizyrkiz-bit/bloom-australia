"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Eye,
  MousePointer,
  AlertTriangle,
  TrendingUp,
  Loader2,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Analytics {
  overview: {
    totalCampaigns: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    rates: {
      delivery: number;
      open: number;
      click: number;
      bounce: number;
    };
  };
  campaigns: {
    id: string;
    subject: string;
    status: string;
    sentAt: string;
    recipientCount: number;
    openedCount: number;
    clickedCount: number;
    openRate: number;
  }[];
  eventsByType: {
    type: string;
    count: number;
  }[];
  recentEvents: {
    id: string;
    type: string;
    email: string;
    campaignSubject: string | null;
    createdAt: string;
  }[];
}

export default function EmailAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/email/analytics?days=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          throw new Error("Failed to fetch analytics");
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load email analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/email/analytics?days=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load email analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "SENT":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "OPENED":
        return <Eye className="w-4 h-4 text-purple-500" />;
      case "CLICKED":
        return <MousePointer className="w-4 h-4 text-orange-500" />;
      case "BOUNCED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventBadge = (type: string) => {
    const styles: Record<string, string> = {
      SENT: "bg-blue-500/10 text-blue-600",
      DELIVERED: "bg-green-500/10 text-green-600",
      OPENED: "bg-purple-500/10 text-purple-600",
      CLICKED: "bg-orange-500/10 text-orange-600",
      BOUNCED: "bg-red-500/10 text-red-600",
      SPAM_REPORT: "bg-red-500/10 text-red-600",
      UNSUBSCRIBED: "bg-gray-500/10 text-gray-600",
    };
    return styles[type] || "bg-gray-500/10 text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading email analytics...</p>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {
    totalCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    rates: { delivery: 0, open: 0, click: 0, bounce: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Email Analytics</h1>
          <p className="text-muted-foreground mt-1">Track email delivery, opens, and clicks</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  {overview.totalSent}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalCampaigns} campaigns
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-3xl font-serif font-bold text-purple-600 mt-1">
                  {overview.rates.open}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalOpened} opens
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-3xl font-serif font-bold text-orange-600 mt-1">
                  {overview.rates.click}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalClicked} clicks
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="text-3xl font-serif font-bold text-red-600 mt-1">
                  {overview.rates.bounce}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalBounced} bounced
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Campaign Performance
            </CardTitle>
            <CardDescription>Recent email campaigns and their metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.campaigns && analytics.campaigns.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {analytics.campaigns.map(campaign => (
                    <div key={campaign.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{campaign.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.sentAt
                              ? new Date(campaign.sentAt).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Not sent"}
                          </p>
                        </div>
                        <Badge
                          className={
                            campaign.status === "SENT"
                              ? "bg-green-500/10 text-green-600"
                              : campaign.status === "SENDING"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-gray-500/10 text-gray-600"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Recipients</p>
                          <p className="font-medium">{campaign.recipientCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Opens</p>
                          <p className="font-medium text-purple-600">
                            {campaign.openedCount} ({campaign.openRate}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-medium text-orange-600">{campaign.clickedCount}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Open rate</span>
                          <span>{campaign.openRate}%</span>
                        </div>
                        <Progress value={campaign.openRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No campaigns yet</p>
                <p className="text-sm">Send your first email to see analytics</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest email events and interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.recentEvents && analytics.recentEvents.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {analytics.recentEvents.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventBadge(
                          event.type
                        )}`}
                      >
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {event.email}
                          {event.campaignSubject && (
                            <span className="ml-1">- {event.campaignSubject}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleTimeString("en-AU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No activity yet</p>
                <p className="text-sm">Events will appear here as emails are sent</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Breakdown */}
      {analytics?.eventsByType && analytics.eventsByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Breakdown</CardTitle>
            <CardDescription>Distribution of email events in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-4">
              {analytics.eventsByType.map(event => (
                <div
                  key={event.type}
                  className={`p-4 rounded-lg text-center ${getEventBadge(event.type)}`}
                >
                  <div className="flex justify-center mb-2">{getEventIcon(event.type)}</div>
                  <p className="text-2xl font-bold">{event.count}</p>
                  <p className="text-xs">{event.type.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
