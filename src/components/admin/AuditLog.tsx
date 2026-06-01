"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  Clock,
  Target,
  Bell,
  FileText,
  Settings,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  Send,
  RefreshCw
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: "create" | "update" | "delete" | "view" | "export" | "send" | "schedule";
  resource: "member" | "goal" | "test" | "notification" | "recommendation" | "settings";
  resourceId: string;
  resourceName: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

const mockAuditLog: AuditLogEntry[] = [
  {
    id: "al1",
    timestamp: "2024-01-15 14:32:15",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "create",
    resource: "goal",
    resourceId: "g_123",
    resourceName: "HDL Goal for Sarah Johnson",
    details: "Created HDL cholesterol improvement goal with target 65 mg/dL",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
  {
    id: "al2",
    timestamp: "2024-01-15 14:28:45",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "send",
    resource: "notification",
    resourceId: "n_456",
    resourceName: "Test Reminder",
    details: "Sent test reminder notification to Michael Chen",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
  {
    id: "al3",
    timestamp: "2024-01-15 13:45:22",
    adminId: "admin_2",
    adminName: "Sarah Admin",
    action: "schedule",
    resource: "test",
    resourceId: "t_789",
    resourceName: "Liver Function Test",
    details: "Scheduled liver function test for Emma Wilson on 2024-02-01",
    ipAddress: "192.168.1.5",
    userAgent: "Firefox/121.0"
  },
  {
    id: "al4",
    timestamp: "2024-01-15 12:15:33",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "update",
    resource: "recommendation",
    resourceId: "rt_101",
    resourceName: "High ALT - Reduce Alcohol",
    details: "Updated recommendation threshold from 45 to 40 U/L",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
  {
    id: "al5",
    timestamp: "2024-01-15 11:30:18",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "export",
    resource: "member",
    resourceId: "export_001",
    resourceName: "Members Export",
    details: "Exported 156 member records as CSV",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
  {
    id: "al6",
    timestamp: "2024-01-15 10:22:45",
    adminId: "admin_2",
    adminName: "Sarah Admin",
    action: "delete",
    resource: "goal",
    resourceId: "g_098",
    resourceName: "Outdated Triglycerides Goal",
    details: "Deleted expired goal for James Brown",
    ipAddress: "192.168.1.5",
    userAgent: "Firefox/121.0"
  },
  {
    id: "al7",
    timestamp: "2024-01-15 09:15:12",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "view",
    resource: "member",
    resourceId: "user_1",
    resourceName: "Sarah Johnson",
    details: "Viewed member profile and health history",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
  {
    id: "al8",
    timestamp: "2024-01-14 16:45:33",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "update",
    resource: "settings",
    resourceId: "settings_notifications",
    resourceName: "Notification Settings",
    details: "Updated reminder days from 2 to 3 days before test",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
  {
    id: "al9",
    timestamp: "2024-01-14 15:20:18",
    adminId: "admin_2",
    adminName: "Sarah Admin",
    action: "create",
    resource: "notification",
    resourceId: "n_555",
    resourceName: "Monthly Health Report",
    details: "Scheduled monthly health report for all 156 members",
    ipAddress: "192.168.1.5",
    userAgent: "Firefox/121.0"
  },
  {
    id: "al10",
    timestamp: "2024-01-14 14:10:22",
    adminId: "admin_1",
    adminName: "Admin User",
    action: "create",
    resource: "recommendation",
    resourceId: "rt_202",
    resourceName: "High Uric Acid - Purine Reduction",
    details: "Created new recommendation template for elevated uric acid",
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0"
  },
];

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredLog = mockAuditLog.filter(entry => {
    const matchesSearch =
      entry.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    const matchesResource = resourceFilter === "all" || entry.resource === resourceFilter;
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionIcon = (action: AuditLogEntry["action"]) => {
    switch (action) {
      case "create": return <Plus className="w-4 h-4 text-green-600" />;
      case "update": return <Edit className="w-4 h-4 text-blue-600" />;
      case "delete": return <Trash2 className="w-4 h-4 text-red-600" />;
      case "view": return <Eye className="w-4 h-4 text-gray-600" />;
      case "export": return <Download className="w-4 h-4 text-purple-600" />;
      case "send": return <Send className="w-4 h-4 text-amber-600" />;
      case "schedule": return <Calendar className="w-4 h-4 text-teal-600" />;
    }
  };

  const getActionBadge = (action: AuditLogEntry["action"]) => {
    const colors: Record<AuditLogEntry["action"], string> = {
      create: "bg-green-100 text-green-700 border-green-200",
      update: "bg-blue-100 text-blue-700 border-blue-200",
      delete: "bg-red-100 text-red-700 border-red-200",
      view: "bg-gray-100 text-gray-700 border-gray-200",
      export: "bg-purple-100 text-purple-700 border-purple-200",
      send: "bg-amber-100 text-amber-700 border-amber-200",
      schedule: "bg-teal-100 text-teal-700 border-teal-200",
    };
    return (
      <Badge variant="outline" className={`${colors[action]} capitalize`}>
        {action}
      </Badge>
    );
  };

  const getResourceIcon = (resource: AuditLogEntry["resource"]) => {
    switch (resource) {
      case "member": return <User className="w-4 h-4" />;
      case "goal": return <Target className="w-4 h-4" />;
      case "test": return <FileText className="w-4 h-4" />;
      case "notification": return <Bell className="w-4 h-4" />;
      case "recommendation": return <RefreshCw className="w-4 h-4" />;
      case "settings": return <Settings className="w-4 h-4" />;
    }
  };

  const stats = {
    total: mockAuditLog.length,
    today: mockAuditLog.filter(e => e.timestamp.startsWith("2024-01-15")).length,
    creates: mockAuditLog.filter(e => e.action === "create").length,
    updates: mockAuditLog.filter(e => e.action === "update").length,
    deletes: mockAuditLog.filter(e => e.action === "delete").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Actions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.today}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.creates}</p>
              <p className="text-xs text-muted-foreground">Creates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.updates}</p>
              <p className="text-xs text-muted-foreground">Updates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.deletes}</p>
              <p className="text-xs text-muted-foreground">Deletes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Audit Log
              </CardTitle>
              <CardDescription>Track all admin actions on member data</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search actions, resources, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="recommendation">Recommendation</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                  <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLog.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {entry.timestamp}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{entry.adminName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(entry.action)}
                        {getActionBadge(entry.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground">
                          {getResourceIcon(entry.resource)}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{entry.resource}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {entry.resourceName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
                        {entry.details}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {entry.ipAddress}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination hint */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLog.length} of {mockAuditLog.length} entries
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
