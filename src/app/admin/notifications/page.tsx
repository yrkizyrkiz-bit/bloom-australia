"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Calendar,
  Phone,
  Server,
} from "lucide-react";

interface SMSNotification {
  id: string;
  recipientId: string;
  recipientPhone: string;
  message: string;
  status: "PENDING" | "SENT" | "FAILED" | "DELIVERED";
  provider: string | null;
  externalId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  recipient?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EmailLog {
  id: string;
  userId: string;
  to: string;
  subject: string;
  status: "SENT" | "FAILED" | "PENDING";
  messageId: string | null;
  error: string | null;
  sentAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface NotificationStats {
  sms: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    delivered: number;
  };
  email: {
    total: number;
    sent: number;
    failed: number;
  };
  providerInfo: {
    provider: string;
    configured: boolean;
    senderId: string;
  };
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"sms" | "email">("sms");
  const [smsNotifications, setSmsNotifications] = useState<SMSNotification[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<SMSNotification | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter, page]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch SMS notifications
      const smsParams = new URLSearchParams({
        limit: "100",
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const smsRes = await fetch(`/api/sms?${smsParams}`);
      if (smsRes.ok) {
        const data = await smsRes.json();
        setSmsNotifications(data.notifications || []);
      }

      // Fetch stats
      const statsRes = await fetch("/api/admin/notifications/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Delivered
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPhone = (phone: string) => {
    // Format as 04XX XXX XXX for Australian mobiles
    if (phone.startsWith("61") && phone.length === 11) {
      const local = "0" + phone.substring(2);
      return `${local.substring(0, 4)} ${local.substring(4, 7)} ${local.substring(7)}`;
    }
    return phone;
  };

  const filteredSMS = smsNotifications.filter((n) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      n.recipientPhone.includes(query) ||
      n.message.toLowerCase().includes(query) ||
      n.recipient?.firstName?.toLowerCase().includes(query) ||
      n.recipient?.lastName?.toLowerCase().includes(query)
    );
  });

  const paginatedSMS = filteredSMS.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredSMS.length / pageSize);

  const retrySMS = async (notificationId: string) => {
    try {
      const res = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, type: "sms" }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to retry:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">View and manage sent emails and SMS messages</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SMS Sent</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats?.sms.sent || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SMS Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats?.sms.pending || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SMS Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.sms.failed || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SMS Provider</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {stats?.providerInfo?.provider || "Mock"}
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.providerInfo?.configured ? (
                    <span className="text-emerald-600">✓ Configured</span>
                  ) : (
                    <span className="text-amber-600">⚠ Not configured</span>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sms" | "email")}>
              <TabsList>
                <TabsTrigger value="sms" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS Messages
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Emails
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "sms" && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedSMS.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
                        <p className="text-sm text-gray-500 mt-2">No SMS messages found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSMS.map((notification) => (
                      <TableRow key={notification.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Phone className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {formatPhone(notification.recipientPhone)}
                              </p>
                              {notification.recipient && (
                                <p className="text-xs text-gray-500">
                                  {notification.recipient.firstName} {notification.recipient.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-700 truncate max-w-xs">
                            {notification.message}
                          </p>
                        </TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 capitalize">
                            {notification.provider || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDate(notification.sentAt || notification.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedNotification(notification)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {notification.status === "FAILED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retrySMS(notification.id)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredSMS.length)} of {filteredSMS.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "email" && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Email Logs Coming Soon</h3>
              <p className="text-sm text-gray-500 mt-2">
                Email tracking via Resend webhooks will be added in a future update.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              SMS Details
            </DialogTitle>
            <DialogDescription>
              Full details for this SMS notification
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                {getStatusBadge(selectedNotification.status)}
              </div>

              <div className="space-y-1">
                <span className="text-sm text-gray-500">Recipient</span>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {formatPhone(selectedNotification.recipientPhone)}
                  </span>
                </div>
                {selectedNotification.recipient && (
                  <p className="text-sm text-gray-500 ml-6">
                    {selectedNotification.recipient.firstName} {selectedNotification.recipient.lastName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-sm text-gray-500">Message</span>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  {selectedNotification.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Provider</span>
                  <p className="font-medium capitalize">
                    {selectedNotification.provider || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">External ID</span>
                  <p className="font-mono text-xs">
                    {selectedNotification.externalId || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="text-sm">
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Sent</span>
                  <p className="text-sm">
                    {formatDate(selectedNotification.sentAt)}
                  </p>
                </div>
              </div>

              {selectedNotification.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">Error</span>
                  </div>
                  <p className="text-sm text-red-600">
                    {selectedNotification.errorMessage}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedNotification.status === "FAILED" && (
                  <Button
                    onClick={() => {
                      retrySMS(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Send
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
