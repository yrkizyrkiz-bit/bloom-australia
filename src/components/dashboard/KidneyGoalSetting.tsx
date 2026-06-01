"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, TrendingUp, CheckCircle, Clock, AlertTriangle, Sparkles, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { BiomarkerResult } from "@/types";

interface KidneyGoal {
  id: string;
  biomarkerId: string;
  biomarkerName: string;
  currentValue: number;
  targetValue: number;
  startValue: number;
  unit: string;
  targetDate: string;
  progress: number;
  status: "in_progress" | "achieved" | "at_risk";
  aiSuggested: boolean;
}

interface KidneyGoalSettingProps {
  currentResults: BiomarkerResult[];
}

const mockGoals: KidneyGoal[] = [
  { id: "kg1", biomarkerId: "egfr", biomarkerName: "eGFR", currentValue: 98, targetValue: 100, startValue: 88, unit: "mL/min", targetDate: "2024-09-01", progress: 83, status: "in_progress", aiSuggested: true },
  { id: "kg2", biomarkerId: "uacr", biomarkerName: "UACR", currentValue: 18, targetValue: 15, startValue: 35, unit: "mg/g", targetDate: "2024-06-01", progress: 85, status: "in_progress", aiSuggested: true },
  { id: "kg3", biomarkerId: "creatinine", biomarkerName: "Creatinine", currentValue: 0.8, targetValue: 0.75, startValue: 0.95, unit: "mg/dL", targetDate: "2024-06-01", progress: 75, status: "in_progress", aiSuggested: false },
];

const suggestedGoals = [
  { biomarkerId: "potassium", name: "Potassium", currentValue: 4.2, suggestedTarget: 4.0, unit: "mEq/L", reason: "Optimize to mid-range for kidney protection" },
  { biomarkerId: "phosphorus", name: "Phosphorus", currentValue: 3.5, suggestedTarget: 3.2, unit: "mg/dL", reason: "Lower phosphorus reduces kidney stress" },
];

const kidneyBiomarkers = [
  { id: "egfr", name: "eGFR", unit: "mL/min", optimalTarget: 100 },
  { id: "creatinine", name: "Creatinine", unit: "mg/dL", optimalTarget: 0.7 },
  { id: "bun", name: "BUN", unit: "mg/dL", optimalTarget: 12 },
  { id: "uacr", name: "UACR", unit: "mg/g", optimalTarget: 10 },
  { id: "cystatin_c", name: "Cystatin C", unit: "mg/L", optimalTarget: 0.7 },
  { id: "potassium", name: "Potassium", unit: "mEq/L", optimalTarget: 4.2 },
  { id: "phosphorus", name: "Phosphorus", unit: "mg/dL", optimalTarget: 3.2 },
];

export function KidneyGoalSetting({ currentResults }: KidneyGoalSettingProps) {
  const [goals, setGoals] = useState<KidneyGoal[]>(mockGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ biomarkerId: "", targetValue: "", targetDate: "" });

  const achievedGoals = goals.filter(g => g.status === "achieved");
  const activeGoals = goals.filter(g => g.status !== "achieved");

  const getStatusBadge = (status: KidneyGoal["status"]) => {
    switch (status) {
      case "achieved": return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Achieved</Badge>;
      case "in_progress": return <Badge variant="outline" className="border-cyan-500 text-cyan-600"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "at_risk": return <Badge variant="outline" className="border-orange-500 text-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />At Risk</Badge>;
    }
  };

  const handleCreateGoal = () => {
    if (!newGoal.biomarkerId || !newGoal.targetValue || !newGoal.targetDate) {
      toast.error("Please fill in all fields");
      return;
    }
    const biomarker = kidneyBiomarkers.find(b => b.id === newGoal.biomarkerId);
    const currentResult = currentResults.find(r => r.biomarkerId === newGoal.biomarkerId);
    const goal: KidneyGoal = {
      id: `kg_${Date.now()}`,
      biomarkerId: newGoal.biomarkerId,
      biomarkerName: biomarker?.name || "",
      currentValue: currentResult?.value || 0,
      targetValue: parseFloat(newGoal.targetValue),
      startValue: currentResult?.value || 0,
      unit: biomarker?.unit || "",
      targetDate: newGoal.targetDate,
      progress: 0,
      status: "in_progress",
      aiSuggested: false,
    };
    setGoals([goal, ...goals]);
    setIsDialogOpen(false);
    setNewGoal({ biomarkerId: "", targetValue: "", targetDate: "" });
    toast.success("Goal created! Track your progress over time.");
  };

  const handleAddSuggestedGoal = (suggestion: typeof suggestedGoals[0]) => {
    const goal: KidneyGoal = {
      id: `kg_${Date.now()}`,
      biomarkerId: suggestion.biomarkerId,
      biomarkerName: suggestion.name,
      currentValue: suggestion.currentValue,
      targetValue: suggestion.suggestedTarget,
      startValue: suggestion.currentValue,
      unit: suggestion.unit,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      status: "in_progress",
      aiSuggested: true,
    };
    setGoals([goal, ...goals]);
    toast.success(`${suggestion.name} goal added!`);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-600">{activeGoals.length}</p>
                <p className="text-sm text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{achievedGoals.length}</p>
                <p className="text-sm text-muted-foreground">Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / (activeGoals.length || 1))}%</p>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {suggestedGoals.length > 0 && (
        <Card className="border-cyan-200/50 bg-cyan-50/30 dark:bg-cyan-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              AI-Suggested Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {suggestedGoals.map((suggestion) => (
                <div key={suggestion.biomarkerId} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900/50 border">
                  <div>
                    <p className="font-medium text-sm">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.currentValue} → {suggestion.suggestedTarget} {suggestion.unit}</p>
                    <p className="text-xs text-cyan-600 mt-1">{suggestion.reason}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAddSuggestedGoal(suggestion)}>
                    <Plus className="w-3 h-3 mr-1" />Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Kidney Health Goals
              </CardTitle>
              <CardDescription>Track progress toward optimal kidney function</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="p-4 rounded-lg border bg-muted/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{goal.biomarkerName}</h4>
                      {goal.aiSuggested && <Badge variant="secondary" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />AI</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current: {goal.currentValue} {goal.unit} → Target: {goal.targetValue} {goal.unit}
                    </p>
                  </div>
                  {getStatusBadge(goal.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Started: {goal.startValue} {goal.unit}</span>
                    <span>Target date: {goal.targetDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Kidney Health Goal</DialogTitle>
            <DialogDescription>Set a target for improving your kidney biomarkers</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Biomarker</Label>
              <Select value={newGoal.biomarkerId} onValueChange={(v) => {
                const bio = kidneyBiomarkers.find(b => b.id === v);
                setNewGoal({ ...newGoal, biomarkerId: v, targetValue: bio?.optimalTarget.toString() || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select biomarker" /></SelectTrigger>
                <SelectContent>
                  {kidneyBiomarkers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Value</Label>
              <Input type="number" step="0.1" value={newGoal.targetValue} onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })} placeholder="Enter target value" />
            </div>
            <div>
              <Label>Target Date</Label>
              <Input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
