"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  CalendarPlus
} from "lucide-react";
import { toast } from "sonner";

interface ScheduledTest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  testType: string;
  date: string;
  time: string;
  location: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  reminderSent: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const mockScheduledTests: ScheduledTest[] = [
  { id: "st_1", memberId: "user_1", memberName: "Sarah Johnson", memberEmail: "sarah.johnson@example.com", testType: "Liver Function Panel", date: "2024-06-15", time: "08:30", location: "Laverty Pathology - Bondi Junction", status: "scheduled", reminderSent: true, createdBy: "System", createdAt: "2024-06-01" },
  { id: "st_2", memberId: "user_2", memberName: "Michael Chen", memberEmail: "michael.chen@example.com", testType: "Liver Function Panel", date: "2024-06-18", time: "09:00", location: "Laverty Pathology - Sydney CBD", status: "confirmed", reminderSent: true, createdBy: "Admin", createdAt: "2024-06-05" },
  { id: "st_3", memberId: "user_3", memberName: "Emma Wilson", memberEmail: "emma.wilson@example.com", testType: "Basic Liver Enzymes", date: "2024-06-20", time: "10:30", location: "QML Pathology - Brisbane", status: "scheduled", reminderSent: false, createdBy: "System", createdAt: "2024-06-08" },
  { id: "st_4", memberId: "user_4", memberName: "James Brown", memberEmail: "james.brown@example.com", testType: "Full Metabolic Panel", date: "2024-06-10", time: "07:45", location: "Melbourne Pathology - Collins St", status: "completed", reminderSent: true, createdBy: "Admin", createdAt: "2024-05-25" },
  { id: "st_5", memberId: "user_5", memberName: "Lisa Anderson", memberEmail: "lisa.anderson@example.com", testType: "Lipid Profile", date: "2024-06-08", time: "08:00", location: "Laverty Pathology - Bondi Junction", status: "no_show", reminderSent: true, notes: "Member did not attend", createdBy: "System", createdAt: "2024-05-20" },
];

const mockMembers = [
  { id: "user_1", name: "Sarah Johnson", email: "sarah.johnson@example.com" },
  { id: "user_2", name: "Michael Chen", email: "michael.chen@example.com" },
  { id: "user_3", name: "Emma Wilson", email: "emma.wilson@example.com" },
  { id: "user_4", name: "James Brown", email: "james.brown@example.com" },
  { id: "user_5", name: "Lisa Anderson", email: "lisa.anderson@example.com" },
  { id: "user_6", name: "David Kim", email: "david.kim@example.com" },
];

const pathologyLocations = [
  "Laverty Pathology - Bondi Junction",
  "Laverty Pathology - Sydney CBD",
  "Laverty Pathology - Parramatta",
  "QML Pathology - Brisbane CBD",
  "QML Pathology - Gold Coast",
  "Melbourne Pathology - Collins St",
  "Melbourne Pathology - South Yarra",
  "Home Collection Service"
];

const testTypes = [
  "Liver Function Panel (13 markers)",
  "Basic Liver Enzymes (ALT, AST, GGT)",
  "Lipid Profile Only",
  "Full Metabolic Panel",
  "Inflammation Markers"
];

export function TestSchedulingManager() {
  const [tests, setTests] = useState<ScheduledTest[]>(mockScheduledTests);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isBatchScheduleDialogOpen, setIsBatchScheduleDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedMembersForBatch, setSelectedMembersForBatch] = useState<string[]>([]);
  const [newTest, setNewTest] = useState({
    memberId: "",
    testType: "",
    date: "",
    time: "08:00",
    location: "",
    notes: ""
  });
  const [batchTest, setBatchTest] = useState({
    testType: "",
    date: "",
    time: "08:00",
    location: "",
    notes: ""
  });

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.memberEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ScheduledTest["status"]) => {
    switch (status) {
      case "scheduled": return <Badge variant="outline" className="border-blue-500 text-blue-600">Scheduled</Badge>;
      case "confirmed": return <Badge className="bg-green-600">Confirmed</Badge>;
      case "completed": return <Badge variant="secondary">Completed</Badge>;
      case "cancelled": return <Badge variant="outline" className="border-red-500 text-red-600">Cancelled</Badge>;
      case "no_show": return <Badge variant="outline" className="border-orange-500 text-orange-600">No Show</Badge>;
    }
  };

  const handleScheduleTest = () => {
    if (!newTest.memberId || !newTest.testType || !newTest.date || !newTest.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const member = mockMembers.find(m => m.id === newTest.memberId);
    if (!member) return;

    const test: ScheduledTest = {
      id: `st_${Date.now()}`,
      memberId: newTest.memberId,
      memberName: member.name,
      memberEmail: member.email,
      testType: newTest.testType,
      date: newTest.date,
      time: newTest.time,
      location: newTest.location,
      status: "scheduled",
      reminderSent: false,
      notes: newTest.notes || undefined,
      createdBy: "Admin",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTests([test, ...tests]);
    setIsScheduleDialogOpen(false);
    setNewTest({ memberId: "", testType: "", date: "", time: "08:00", location: "", notes: "" });
    toast.success(`Test scheduled for ${member.name}. Reminder will be sent automatically.`);
  };

  const handleSendReminder = (testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, reminderSent: true } : t));
    toast.success("Reminder sent successfully");
  };

  const handleCancelTest = (testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "cancelled" as const } : t));
    toast.success("Test cancelled");
  };

  const handleMarkComplete = (testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: "completed" as const } : t));
    toast.success("Test marked as completed");
  };

  // Batch action handlers
  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleAllTests = () => {
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredTests.map(t => t.id));
    }
  };

  const handleBatchSendReminders = () => {
    setTests(prev => prev.map(t =>
      selectedTests.includes(t.id) ? { ...t, reminderSent: true } : t
    ));
    toast.success(`Reminders sent to ${selectedTests.length} members`);
    setSelectedTests([]);
  };

  const handleBatchCancel = () => {
    setTests(prev => prev.map(t =>
      selectedTests.includes(t.id) ? { ...t, status: "cancelled" as const } : t
    ));
    toast.success(`${selectedTests.length} tests cancelled`);
    setSelectedTests([]);
  };

  const toggleMemberForBatch = (memberId: string) => {
    setSelectedMembersForBatch(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAllMembersForBatch = () => {
    if (selectedMembersForBatch.length === mockMembers.length) {
      setSelectedMembersForBatch([]);
    } else {
      setSelectedMembersForBatch(mockMembers.map(m => m.id));
    }
  };

  const handleBatchSchedule = () => {
    if (selectedMembersForBatch.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    if (!batchTest.testType || !batchTest.date || !batchTest.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newTests: ScheduledTest[] = selectedMembersForBatch.map(memberId => {
      const member = mockMembers.find(m => m.id === memberId)!;
      return {
        id: `st_${Date.now()}_${memberId}`,
        memberId,
        memberName: member.name,
        memberEmail: member.email,
        testType: batchTest.testType,
        date: batchTest.date,
        time: batchTest.time,
        location: batchTest.location,
        status: "scheduled" as const,
        reminderSent: false,
        notes: batchTest.notes || undefined,
        createdBy: "Admin (Batch)",
        createdAt: new Date().toISOString().split('T')[0]
      };
    });

    setTests([...newTests, ...tests]);
    setIsBatchScheduleDialogOpen(false);
    setSelectedMembersForBatch([]);
    setBatchTest({ testType: "", date: "", time: "08:00", location: "", notes: "" });
    toast.success(`Tests scheduled for ${newTests.length} members`);
  };

  const upcomingCount = tests.filter(t => t.status === "scheduled" || t.status === "confirmed").length;
  const todayCount = tests.filter(t => t.date === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming Tests</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{tests.filter(t => !t.reminderSent && t.status === "scheduled").length}</p>
                <p className="text-xs text-muted-foreground">Pending Reminders</p>
              </div>
              <Send className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{tests.filter(t => t.status === "no_show").length}</p>
                <p className="text-xs text-muted-foreground">No Shows</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Test Scheduling
              </CardTitle>
              <CardDescription>Schedule and manage liver function tests for members</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBatchScheduleDialogOpen(true)}>
                <Users className="w-4 h-4 mr-1" />
                Batch Schedule
              </Button>
              <Button onClick={() => setIsScheduleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Schedule Test
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch Actions Bar */}
          {selectedTests.length > 0 && (
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium">
                {selectedTests.length} test{selectedTests.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBatchSendReminders}>
                  <Send className="w-3 h-3 mr-1" />
                  Send Reminders
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleBatchCancel}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  Cancel Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTests([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Tests Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                      onCheckedChange={toggleAllTests}
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id} className={selectedTests.includes(test.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={() => toggleTestSelection(test.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{test.memberName}</p>
                        <p className="text-xs text-muted-foreground">{test.memberEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{test.testType}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{test.date}</span>
                        <Clock className="w-3 h-3 text-muted-foreground ml-2" />
                        <span>{test.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{test.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>
                      {test.reminderSent ? (
                        <Badge variant="secondary" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleSendReminder(test.id)}>
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {test.status === "scheduled" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleMarkComplete(test.id)}>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCancelTest(test.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Liver Function Test</DialogTitle>
            <DialogDescription>Book a test appointment for a member</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Select Member *</Label>
              <Select value={newTest.memberId} onValueChange={(v) => setNewTest({ ...newTest, memberId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {mockMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {m.name} - {m.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Type *</Label>
              <Select value={newTest.testType} onValueChange={(v) => setNewTest({ ...newTest, testType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newTest.date}
                  onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={newTest.time}
                  onChange={(e) => setNewTest({ ...newTest, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Pathology Location *</Label>
              <Select value={newTest.location} onValueChange={(v) => setNewTest({ ...newTest, location: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {pathologyLocations.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={newTest.notes}
                onChange={(e) => setNewTest({ ...newTest, notes: e.target.value })}
                placeholder="Any special instructions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleTest}>
              <Calendar className="w-4 h-4 mr-1" />
              Schedule Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Schedule Dialog */}
      <Dialog open={isBatchScheduleDialogOpen} onOpenChange={setIsBatchScheduleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Batch Schedule Tests
            </DialogTitle>
            <DialogDescription>Schedule the same test for multiple members at once</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Select Members *</Label>
                <Button variant="ghost" size="sm" onClick={toggleAllMembersForBatch}>
                  {selectedMembersForBatch.length === mockMembers.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                {mockMembers.map(member => (
                  <label
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedMembersForBatch.includes(member.id) ? "bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedMembersForBatch.includes(member.id)}
                      onCheckedChange={() => toggleMemberForBatch(member.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedMembersForBatch.length} of {mockMembers.length} members selected
              </p>
            </div>

            <div>
              <Label>Test Type *</Label>
              <Select value={batchTest.testType} onValueChange={(v) => setBatchTest({ ...batchTest, testType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={batchTest.date}
                  onChange={(e) => setBatchTest({ ...batchTest, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={batchTest.time}
                  onChange={(e) => setBatchTest({ ...batchTest, time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Pathology Location *</Label>
              <Select value={batchTest.location} onValueChange={(v) => setBatchTest({ ...batchTest, location: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {pathologyLocations.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={batchTest.notes}
                onChange={(e) => setBatchTest({ ...batchTest, notes: e.target.value })}
                placeholder="Any special instructions for all scheduled tests..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsBatchScheduleDialogOpen(false); setSelectedMembersForBatch([]); }}>
              Cancel
            </Button>
            <Button onClick={handleBatchSchedule} disabled={selectedMembersForBatch.length === 0}>
              <CalendarPlus className="w-4 h-4 mr-1" />
              Schedule {selectedMembersForBatch.length} Test{selectedMembersForBatch.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
