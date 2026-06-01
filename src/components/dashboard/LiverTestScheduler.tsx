"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle,
  AlertCircle,
  CalendarPlus,
  MapPin,
  Repeat,
  Mail,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

interface ScheduledTest {
  id: string;
  testType: string;
  date: string;
  time: string;
  location: string;
  reminderDays: number;
  status: "scheduled" | "completed" | "overdue";
  notes?: string;
}

// Mock scheduled tests
const mockScheduledTests: ScheduledTest[] = [
  {
    id: "test_1",
    testType: "Liver Function Panel",
    date: "2024-06-15",
    time: "08:30",
    location: "Laverty Pathology - Bondi Junction",
    reminderDays: 3,
    status: "scheduled",
    notes: "Fasting required - no food 12 hours before"
  }
];

// Recommended test frequencies based on risk factors
const testFrequencyRecommendations = [
  { condition: "Normal results, low risk", frequency: "Every 12 months", nextDue: "12 months" },
  { condition: "Some markers out of range", frequency: "Every 6 months", nextDue: "6 months" },
  { condition: "Fatty liver disease", frequency: "Every 3-6 months", nextDue: "3 months" },
  { condition: "Active liver condition", frequency: "As directed by GP", nextDue: "Consult GP" },
];

export function LiverTestScheduler() {
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>(mockScheduledTests);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    testType: "Liver Function Panel",
    date: "",
    time: "08:00",
    location: "",
    reminderDays: 3,
    notes: ""
  });

  const handleScheduleTest = () => {
    if (!newTest.date || !newTest.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const test: ScheduledTest = {
      id: `test_${Date.now()}`,
      ...newTest,
      status: "scheduled"
    };

    setScheduledTests([...scheduledTests, test]);
    setIsDialogOpen(false);
    setNewTest({
      testType: "Liver Function Panel",
      date: "",
      time: "08:00",
      location: "",
      reminderDays: 3,
      notes: ""
    });
    toast.success("Test scheduled successfully! Reminder will be sent " + newTest.reminderDays + " days before.");
  };

  const handleCancelTest = (testId: string) => {
    setScheduledTests(scheduledTests.filter(t => t.id !== testId));
    toast.success("Test cancelled");
  };

  const getStatusColor = (status: ScheduledTest["status"]) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "completed": return "bg-green-500/10 text-green-600 border-green-200";
      case "overdue": return "bg-red-500/10 text-red-600 border-red-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const daysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Test Scheduling
            </CardTitle>
            <CardDescription>Schedule your next liver function test and set reminders</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <CalendarPlus className="w-4 h-4" />
                Schedule Test
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule Liver Function Test</DialogTitle>
                <DialogDescription>
                  Book your next test and we'll send you reminders
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <Select
                    value={newTest.testType}
                    onValueChange={(value) => setNewTest({ ...newTest, testType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Liver Function Panel">Liver Function Panel (13 markers)</SelectItem>
                      <SelectItem value="Basic Liver Enzymes">Basic Liver Enzymes (ALT, AST, GGT)</SelectItem>
                      <SelectItem value="Lipid Profile">Lipid Profile Only</SelectItem>
                      <SelectItem value="Full Metabolic Panel">Full Metabolic Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTest.date}
                      onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTest.time}
                      onChange={(e) => setNewTest({ ...newTest, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Pathology Location *</Label>
                  <Select
                    value={newTest.location}
                    onValueChange={(value) => setNewTest({ ...newTest, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laverty Pathology - Bondi Junction">Laverty Pathology - Bondi Junction</SelectItem>
                      <SelectItem value="Laverty Pathology - Sydney CBD">Laverty Pathology - Sydney CBD</SelectItem>
                      <SelectItem value="QML Pathology - Brisbane">QML Pathology - Brisbane</SelectItem>
                      <SelectItem value="Melbourne Pathology - Collins St">Melbourne Pathology - Collins St</SelectItem>
                      <SelectItem value="Other / Home Collection">Other / Home Collection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reminder">Reminder</Label>
                  <Select
                    value={newTest.reminderDays.toString()}
                    onValueChange={(value) => setNewTest({ ...newTest, reminderDays: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                      <SelectItem value="14">2 weeks before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g., Fasting required"
                    value={newTest.notes}
                    onChange={(e) => setNewTest({ ...newTest, notes: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-400">Reminder notifications</p>
                    <p className="text-xs text-muted-foreground">We'll send email and SMS reminders</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleScheduleTest}>Schedule Test</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upcoming Tests */}
        {scheduledTests.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Upcoming Tests</h4>
            {scheduledTests.map((test) => {
              const days = daysUntil(test.date);
              return (
                <div key={test.id} className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{test.testType}</h5>
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {days > 0 ? `In ${days} days` : days === 0 ? 'Today' : 'Overdue'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(test.date)} at {test.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{test.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span>Reminder {test.reminderDays} days before</span>
                        </div>
                        {test.notes && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{test.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancelTest(test.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No tests scheduled</p>
            <p className="text-sm">Click "Schedule Test" to book your next appointment</p>
          </div>
        )}

        {/* Recommended Frequency */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recommended Testing Frequency</h4>
          <div className="grid gap-2">
            {testFrequencyRecommendations.map((rec, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                <span className="text-muted-foreground">{rec.condition}</span>
                <div className="flex items-center gap-2">
                  <Repeat className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{rec.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <h4 className="text-sm font-medium mb-3">Notification Preferences</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">SMS</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Push</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
