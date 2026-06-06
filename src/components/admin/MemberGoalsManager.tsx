"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Target, Plus, Search, User, Edit, Trash2, TrendingUp, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface MemberGoal {
  id: string;
  memberId: string;
  memberName: string;
  biomarkerId: string;
  biomarkerName: string;
  targetValue: number;
  startValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: "in_progress" | "achieved" | "at_risk" | "missed";
  progress: number;
  createdBy: string;
}

const mockGoals: MemberGoal[] = [
  { id: "g1", memberId: "user_1", memberName: "Sarah Johnson", biomarkerId: "triglycerides", biomarkerName: "Triglycerides", targetValue: 100, startValue: 180, currentValue: 145, unit: "mg/dL", startDate: "2023-06-01", targetDate: "2024-06-01", status: "in_progress", progress: 44, createdBy: "Self" },
  { id: "g2", memberId: "user_1", memberName: "Sarah Johnson", biomarkerId: "hdl_cholesterol", biomarkerName: "HDL Cholesterol", targetValue: 65, startValue: 48, currentValue: 58, unit: "mg/dL", startDate: "2023-06-01", targetDate: "2024-06-01", status: "in_progress", progress: 59, createdBy: "Admin" },
  { id: "g3", memberId: "user_1", memberName: "Sarah Johnson", biomarkerId: "ggt", biomarkerName: "GGT", targetValue: 25, startValue: 45, currentValue: 28, unit: "U/L", startDate: "2023-06-01", targetDate: "2024-03-01", status: "achieved", progress: 100, createdBy: "Self" },
  { id: "g4", memberId: "user_2", memberName: "Michael Chen", biomarkerId: "alt", biomarkerName: "ALT", targetValue: 25, startValue: 48, currentValue: 35, unit: "U/L", startDate: "2023-09-01", targetDate: "2024-03-01", status: "in_progress", progress: 57, createdBy: "Admin" },
  { id: "g5", memberId: "user_3", memberName: "Emma Wilson", biomarkerId: "hba1c", biomarkerName: "HbA1c", targetValue: 5.2, startValue: 6.1, currentValue: 5.8, unit: "%", startDate: "2023-10-01", targetDate: "2024-04-01", status: "at_risk", progress: 33, createdBy: "Self" },
];

const mockMembers = [
  { id: "user_1", name: "Sarah Johnson" },
  { id: "user_2", name: "Michael Chen" },
  { id: "user_3", name: "Emma Wilson" },
  { id: "user_4", name: "James Brown" },
];

const biomarkers = [
  { id: "alt", name: "ALT", unit: "U/L", optimalTarget: 25 },
  { id: "ast", name: "AST", unit: "U/L", optimalTarget: 25 },
  { id: "ggt", name: "GGT", unit: "U/L", optimalTarget: 25 },
  { id: "triglycerides", name: "Triglycerides", unit: "mg/dL", optimalTarget: 100 },
  { id: "hdl_cholesterol", name: "HDL Cholesterol", unit: "mg/dL", optimalTarget: 65 },
  { id: "ldl_cholesterol", name: "LDL Cholesterol", unit: "mg/dL", optimalTarget: 100 },
  { id: "glucose", name: "Fasting Glucose", unit: "mg/dL", optimalTarget: 90 },
  { id: "hba1c", name: "HbA1c", unit: "%", optimalTarget: 5.2 },
  { id: "crp", name: "CRP", unit: "mg/L", optimalTarget: 1.0 },
];

export function MemberGoalsManager() {
  const [goals, setGoals] = useState<MemberGoal[]>(mockGoals);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newGoal, setNewGoal] = useState({ memberId: "", biomarkerId: "", targetValue: "", currentValue: "", targetDate: "" });

  const filteredGoals = goals.filter(g => {
    const matchesSearch = g.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: MemberGoal["status"]) => {
    switch (status) {
      case "achieved": return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Achieved</Badge>;
      case "in_progress": return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "at_risk": return <Badge variant="outline" className="border-orange-500 text-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />At Risk</Badge>;
      case "missed": return <Badge variant="outline" className="border-red-500 text-red-600">Missed</Badge>;
    }
  };

  const handleCreateGoal = () => {
    if (!newGoal.memberId || !newGoal.biomarkerId || !newGoal.targetValue || !newGoal.targetDate) {
      toast.error("Please fill all required fields");
      return;
    }
    const member = mockMembers.find(m => m.id === newGoal.memberId);
    const biomarker = biomarkers.find(b => b.id === newGoal.biomarkerId);
    if (!member || !biomarker) return;

    const goal: MemberGoal = {
      id: `g_${Date.now()}`,
      memberId: newGoal.memberId,
      memberName: member.name,
      biomarkerId: newGoal.biomarkerId,
      biomarkerName: biomarker.name,
      targetValue: parseFloat(newGoal.targetValue),
      startValue: parseFloat(newGoal.currentValue) || parseFloat(newGoal.targetValue) * 1.5,
      currentValue: parseFloat(newGoal.currentValue) || parseFloat(newGoal.targetValue) * 1.5,
      unit: biomarker.unit,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: newGoal.targetDate,
      status: "in_progress",
      progress: 0,
      createdBy: "Admin"
    };

    setGoals([goal, ...goals]);
    setIsCreateDialogOpen(false);
    setNewGoal({ memberId: "", biomarkerId: "", targetValue: "", currentValue: "", targetDate: "" });
    toast.success(`Goal created for ${member.name}`);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    toast.success("Goal deleted");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-center"><p className="text-2xl font-bold text-green-600">{goals.filter(g => g.status === "achieved").length}</p><p className="text-xs text-muted-foreground">Achieved</p></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-center"><p className="text-2xl font-bold text-blue-600">{goals.filter(g => g.status === "in_progress").length}</p><p className="text-xs text-muted-foreground">In Progress</p></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-center"><p className="text-2xl font-bold text-orange-600">{goals.filter(g => g.status === "at_risk").length}</p><p className="text-xs text-muted-foreground">At Risk</p></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-center"><p className="text-2xl font-bold">{goals.length}</p><p className="text-xs text-muted-foreground">Total Goals</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Member Goals</CardTitle><CardDescription>Create and manage biomarker goals for members</CardDescription></div>
            <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Create Goal</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search by member..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="achieved">Achieved</SelectItem><SelectItem value="at_risk">At Risk</SelectItem></SelectContent></Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Biomarker</TableHead><TableHead>Progress</TableHead><TableHead>Current</TableHead><TableHead>Target</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Created By</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredGoals.map(goal => (
                  <TableRow key={goal.id}>
                    <TableCell><div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{goal.memberName}</div></TableCell>
                    <TableCell>{goal.biomarkerName}</TableCell>
                    <TableCell><div className="w-24"><Progress value={goal.progress} className="h-2" /><span className="text-xs text-muted-foreground">{goal.progress}%</span></div></TableCell>
                    <TableCell className="font-mono">{goal.currentValue} {goal.unit}</TableCell>
                    <TableCell className="font-mono">{goal.targetValue} {goal.unit}</TableCell>
                    <TableCell>{goal.targetDate}</TableCell>
                    <TableCell>{getStatusBadge(goal.status)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{goal.createdBy}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Create Goal for Member</DialogTitle><DialogDescription>Set a biomarker improvement target</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Member *</Label><Select value={newGoal.memberId} onValueChange={(v) => setNewGoal({...newGoal, memberId: v})}><SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger><SelectContent>{mockMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Biomarker *</Label><Select value={newGoal.biomarkerId} onValueChange={(v) => { const b = biomarkers.find(x => x.id === v); setNewGoal({...newGoal, biomarkerId: v, targetValue: b?.optimalTarget.toString() || ""}); }}><SelectTrigger><SelectValue placeholder="Select biomarker" /></SelectTrigger><SelectContent>{biomarkers.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.unit})</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Current Value</Label><Input type="number" step="0.1" value={newGoal.currentValue} onChange={(e) => setNewGoal({...newGoal, currentValue: e.target.value})} placeholder="Member's current value" /></div>
              <div><Label>Target Value *</Label><Input type="number" step="0.1" value={newGoal.targetValue} onChange={(e) => setNewGoal({...newGoal, targetValue: e.target.value})} /></div>
            </div>
            <div><Label>Target Date *</Label><Input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})} min={new Date().toISOString().split('T')[0]} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateGoal}>Create Goal</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
