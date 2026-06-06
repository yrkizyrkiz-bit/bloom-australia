"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Bell, CheckCircle, Plus, Droplets, TestTube, Beaker } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ScheduledTest {
  id: string;
  testType: string;
  testCategory: "blood" | "urine" | "both";
  date: string;
  time: string;
  location: string;
  status: "scheduled" | "confirmed" | "completed";
  reminderSet: boolean;
  prepInstructions: string[];
}

const mockScheduledTests: ScheduledTest[] = [
  {
    id: "kt1",
    testType: "Comprehensive Kidney Panel",
    testCategory: "both",
    date: "2024-06-15",
    time: "08:00",
    location: "Laverty Pathology - Bondi Junction",
    status: "scheduled",
    reminderSet: true,
    prepInstructions: [
      "Fast for 8-12 hours before blood test",
      "Bring first morning urine sample",
      "Stay hydrated (water only during fast)",
      "Avoid strenuous exercise 24 hours before"
    ]
  },
  {
    id: "kt2",
    testType: "Kidney Function Panel (Blood)",
    testCategory: "blood",
    date: "2024-03-01",
    time: "09:00",
    location: "Laverty Pathology - Sydney CBD",
    status: "completed",
    reminderSet: false,
    prepInstructions: ["Fast for 8-12 hours", "Continue regular medications"]
  },
];

const testTypes = [
  { id: "comprehensive", name: "Comprehensive Kidney Panel", category: "both", description: "Blood + Urine: eGFR, Creatinine, BUN, UACR, Electrolytes" },
  { id: "blood", name: "Kidney Function Panel (Blood)", category: "blood", description: "eGFR, Creatinine, BUN, Cystatin C, Electrolytes" },
  { id: "urine", name: "Urine Albumin Test", category: "urine", description: "UACR, Microalbumin, Urine Protein" },
  { id: "electrolytes", name: "Electrolyte Panel", category: "blood", description: "Sodium, Potassium, Bicarbonate, Calcium, Phosphorus" },
];

const locations = [
  "Laverty Pathology - Bondi Junction",
  "Laverty Pathology - Sydney CBD",
  "QML Pathology - Brisbane",
  "Melbourne Pathology - Collins St",
  "Home Collection Service",
];

export function KidneyTestScheduler() {
  const [tests, setTests] = useState<ScheduledTest[]>(mockScheduledTests);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({ testType: "", date: "", time: "08:00", location: "" });

  const upcomingTests = tests.filter(t => t.status !== "completed");
  const completedTests = tests.filter(t => t.status === "completed");

  const handleScheduleTest = () => {
    if (!newTest.testType || !newTest.date || !newTest.location) {
      toast.error("Please fill in all fields");
      return;
    }
    const testInfo = testTypes.find(t => t.id === newTest.testType);
    const test: ScheduledTest = {
      id: `kt_${Date.now()}`,
      testType: testInfo?.name || "",
      testCategory: (testInfo?.category || "blood") as "blood" | "urine" | "both",
      date: newTest.date,
      time: newTest.time,
      location: newTest.location,
      status: "scheduled",
      reminderSet: true,
      prepInstructions: testInfo?.category === "both"
        ? ["Fast for 8-12 hours", "Bring first morning urine sample", "Stay hydrated with water"]
        : testInfo?.category === "urine"
        ? ["Collect first morning urine sample", "Use clean container provided"]
        : ["Fast for 8-12 hours before test", "Continue regular medications"]
    };
    setTests([test, ...tests]);
    setIsDialogOpen(false);
    setNewTest({ testType: "", date: "", time: "08:00", location: "" });
    toast.success("Kidney test scheduled! Reminder set for 3 days before.");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "blood": return <Droplets className="w-4 h-4 text-red-500" />;
      case "urine": return <TestTube className="w-4 h-4 text-amber-500" />;
      case "both": return <Beaker className="w-4 h-4 text-purple-500" />;
      default: return <Droplets className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Kidney Test Scheduling
              </CardTitle>
              <CardDescription>Schedule and manage your kidney function tests</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Schedule Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingTests.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Upcoming Tests</h3>
              {upcomingTests.map((test) => (
                <div key={test.id} className="p-4 rounded-lg border bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(test.testCategory)}
                      <h4 className="font-medium">{test.testType}</h4>
                    </div>
                    <Badge variant="outline" className="border-cyan-500 text-cyan-600">{test.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{test.date}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{test.time}</div>
                    <div className="flex items-center gap-2 col-span-2"><MapPin className="w-4 h-4 text-muted-foreground" />{test.location}</div>
                  </div>
                  {test.reminderSet && (
                    <div className="flex items-center gap-1 text-xs text-cyan-600 mb-3">
                      <Bell className="w-3 h-3" />
                      <span>Reminder set</span>
                    </div>
                  )}
                  <div className="p-3 rounded bg-white/50 dark:bg-slate-900/50">
                    <h5 className="text-xs font-medium mb-2">Preparation Instructions:</h5>
                    <ul className="space-y-1">
                      {test.prepInstructions.map((inst, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-cyan-600 flex-shrink-0" />
                          {inst}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming tests scheduled</p>
              <Button variant="outline" className="mt-3" onClick={() => setIsDialogOpen(true)}>Schedule Your First Test</Button>
            </div>
          )}

          {completedTests.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Recent Tests</h3>
              {completedTests.slice(0, 3).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 mb-2">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(test.testCategory)}
                    <div>
                      <p className="font-medium text-sm">{test.testType}</p>
                      <p className="text-xs text-muted-foreground">{test.date} at {test.location}</p>
                    </div>
                  </div>
                  <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Kidney Function Test</DialogTitle>
            <DialogDescription>Book your next kidney health assessment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Test Type</Label>
              <Select value={newTest.testType} onValueChange={(v) => setNewTest({ ...newTest, testType: v })}>
                <SelectTrigger><SelectValue placeholder="Select test type" /></SelectTrigger>
                <SelectContent>
                  {testTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={newTest.date} onChange={(e) => setNewTest({ ...newTest, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={newTest.time} onChange={(e) => setNewTest({ ...newTest, time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={newTest.location} onValueChange={(v) => setNewTest({ ...newTest, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleTest}>Schedule Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
