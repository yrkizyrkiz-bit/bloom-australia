"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Bell, CheckCircle, Plus, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ScheduledTest {
  id: string;
  testType: string;
  date: string;
  time: string;
  location: string;
  status: "scheduled" | "confirmed" | "completed";
  reminderSet: boolean;
  prepInstructions: string[];
}

const mockScheduledTests: ScheduledTest[] = [
  { id: "ht1", testType: "Complete Lipid Panel", date: "2024-06-20", time: "07:30", location: "Laverty Pathology - Sydney CBD", status: "scheduled", reminderSet: true, prepInstructions: ["Fast for 9-12 hours before test", "Water is allowed during fasting", "Avoid alcohol for 24 hours before", "Continue regular medications"] },
  { id: "ht2", testType: "Cardiovascular Risk Panel", date: "2024-03-01", time: "08:00", location: "Laverty Pathology - Bondi Junction", status: "completed", reminderSet: false, prepInstructions: ["Fasting required"] },
];

const testTypes = [
  { id: "lipid", name: "Complete Lipid Panel", description: "Total, LDL, HDL Cholesterol, Triglycerides" },
  { id: "cardiac", name: "Cardiac Risk Panel", description: "Lipids + CRP, Homocysteine, Lp(a)" },
  { id: "full", name: "Full Cardiovascular Assessment", description: "Comprehensive heart health markers" },
];

const locations = ["Laverty Pathology - Bondi Junction", "Laverty Pathology - Sydney CBD", "QML Pathology - Brisbane", "Melbourne Pathology - Collins St", "Home Collection Service"];

export function HeartTestScheduler() {
  const [tests, setTests] = useState<ScheduledTest[]>(mockScheduledTests);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({ testType: "", date: "", time: "07:30", location: "" });

  const upcomingTests = tests.filter(t => t.status !== "completed");
  const completedTests = tests.filter(t => t.status === "completed");

  const handleScheduleTest = () => {
    if (!newTest.testType || !newTest.date || !newTest.location) { toast.error("Please fill in all fields"); return; }
    const testInfo = testTypes.find(t => t.id === newTest.testType);
    const test: ScheduledTest = {
      id: `ht_${Date.now()}`, testType: testInfo?.name || "", date: newTest.date, time: newTest.time, location: newTest.location, status: "scheduled", reminderSet: true,
      prepInstructions: ["Fast for 9-12 hours before test", "Water is allowed during fasting", "Avoid alcohol for 24 hours", "Take medications as usual unless advised otherwise"]
    };
    setTests([test, ...tests]);
    setIsDialogOpen(false);
    setNewTest({ testType: "", date: "", time: "07:30", location: "" });
    toast.success("Cardiovascular test scheduled!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Cardiovascular Test Scheduling</CardTitle>
              <CardDescription>Schedule and manage your heart health tests</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Schedule Test</Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingTests.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Upcoming Tests</h3>
              {upcomingTests.map((test) => (
                <div key={test.id} className="p-4 rounded-lg border bg-red-50/50 dark:bg-red-950/20 border-red-200/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /><h4 className="font-medium">{test.testType}</h4></div>
                    <Badge variant="outline" className="border-red-500 text-red-600">{test.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />{test.date}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{test.time}</div>
                    <div className="flex items-center gap-2 col-span-2"><MapPin className="w-4 h-4 text-muted-foreground" />{test.location}</div>
                  </div>
                  {test.reminderSet && <div className="flex items-center gap-1 text-xs text-red-600 mb-3"><Bell className="w-3 h-3" /><span>Reminder set</span></div>}
                  <div className="p-3 rounded bg-white/50 dark:bg-slate-900/50">
                    <h5 className="text-xs font-medium mb-2">Preparation Instructions:</h5>
                    <ul className="space-y-1">
                      {test.prepInstructions.map((inst, i) => <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><CheckCircle className="w-3 h-3 mt-0.5 text-red-600 flex-shrink-0" />{inst}</li>)}
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
                  <div className="flex items-center gap-3"><Heart className="w-4 h-4 text-red-500" /><div><p className="font-medium text-sm">{test.testType}</p><p className="text-xs text-muted-foreground">{test.date}</p></div></div>
                  <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Cardiovascular Test</DialogTitle><DialogDescription>Book your next heart health assessment</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Test Type</Label><Select value={newTest.testType} onValueChange={(v) => setNewTest({ ...newTest, testType: v })}><SelectTrigger><SelectValue placeholder="Select test type" /></SelectTrigger><SelectContent>{testTypes.map((t) => <SelectItem key={t.id} value={t.id}><div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.description}</p></div></SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" value={newTest.date} onChange={(e) => setNewTest({ ...newTest, date: e.target.value })} min={new Date().toISOString().split('T')[0]} /></div>
              <div><Label>Time</Label><Input type="time" value={newTest.time} onChange={(e) => setNewTest({ ...newTest, time: e.target.value })} /></div>
            </div>
            <div><Label>Location</Label><Select value={newTest.location} onValueChange={(v) => setNewTest({ ...newTest, location: v })}><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger><SelectContent>{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleScheduleTest}>Schedule Test</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
