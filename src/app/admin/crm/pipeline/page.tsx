"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deals, getPipelineStats, customerAccounts } from "@/data/crm-data";
import { mockUsers } from "@/data/mock-data";
import type { Deal, DealStage } from "@/types/crm";
import { toast } from "sonner";
import {
  Plus,
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Trophy,
  XCircle,
  Clock,
  Percent
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const stageConfig: Record<DealStage, { label: string; color: string; bgColor: string }> = {
  lead: { label: "Lead", color: "text-gray-600", bgColor: "bg-gray-100" },
  qualified: { label: "Qualified", color: "text-blue-600", bgColor: "bg-blue-50" },
  proposal: { label: "Proposal", color: "text-purple-600", bgColor: "bg-purple-50" },
  negotiation: { label: "Negotiation", color: "text-orange-600", bgColor: "bg-orange-50" },
  closed_won: { label: "Closed Won", color: "text-green-600", bgColor: "bg-green-50" },
  closed_lost: { label: "Closed Lost", color: "text-red-600", bgColor: "bg-red-50" }
};

const stages: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
const openStages: DealStage[] = ["lead", "qualified", "proposal", "negotiation"];

export default function PipelinePage() {
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  // New deal form state
  const [newDeal, setNewDeal] = useState({
    customerId: "",
    title: "",
    value: "",
    stage: "lead" as DealStage,
    probability: "25",
    expectedCloseDate: "",
    notes: ""
  });

  const stats = useMemo(() => {
    const openDeals = localDeals.filter(d => openStages.includes(d.stage));
    const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedValue = openDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
    const wonDeals = localDeals.filter(d => d.stage === "closed_won");
    const lostDeals = localDeals.filter(d => d.stage === "closed_lost");

    return {
      openDeals: openDeals.length,
      pipelineValue,
      weightedValue: Math.round(weightedValue),
      wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
      winRate: Math.round((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100)
    };
  }, [localDeals]);

  const getCustomerName = (customerId: string) => {
    const customer = customerAccounts.find(c => c.id === customerId);
    if (!customer) return "Unknown";
    const user = mockUsers.find(u => u.id === customer.userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  const getDealsForStage = (stage: DealStage) => {
    return localDeals.filter(d => d.stage === stage);
  };

  const getStageValue = (stage: DealStage) => {
    return localDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0);
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStage: DealStage) => {
    if (!draggedDeal || draggedDeal.stage === targetStage) {
      setDraggedDeal(null);
      return;
    }

    setLocalDeals(prev => prev.map(d => {
      if (d.id === draggedDeal.id) {
        const newProbability = targetStage === "closed_won" ? 100 :
                               targetStage === "closed_lost" ? 0 :
                               targetStage === "negotiation" ? 80 :
                               targetStage === "proposal" ? 60 :
                               targetStage === "qualified" ? 40 : 25;
        return { ...d, stage: targetStage, probability: newProbability, updatedAt: new Date().toISOString() };
      }
      return d;
    }));

    toast.success(`Deal moved to ${stageConfig[targetStage].label}`);
    setDraggedDeal(null);
  };

  const handleAddDeal = () => {
    if (!newDeal.customerId || !newDeal.title || !newDeal.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    const deal: Deal = {
      id: `deal_${Date.now()}`,
      customerId: newDeal.customerId,
      title: newDeal.title,
      value: parseFloat(newDeal.value),
      stage: newDeal.stage,
      probability: parseInt(newDeal.probability),
      expectedCloseDate: newDeal.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: "admin_1",
      notes: newDeal.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLocalDeals(prev => [...prev, deal]);
    setShowAddDeal(false);
    setNewDeal({
      customerId: "",
      title: "",
      value: "",
      stage: "lead",
      probability: "25",
      expectedCloseDate: "",
      notes: ""
    });
    toast.success("Deal created successfully!");
  };

  const DealCard = ({ deal }: { deal: Deal }) => {
    const isOverdue = new Date(deal.expectedCloseDate) < new Date() && openStages.includes(deal.stage);

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(deal)}
        className={`p-3 rounded-lg bg-white border shadow-sm cursor-move hover:shadow-md transition-shadow ${
          isOverdue ? "border-red-300" : "border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{deal.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedDeal(deal)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/admin/crm/customers/${deal.customerId}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
          <User className="w-3 h-3" />
          {getCustomerName(deal.customerId)}
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-green-600">${deal.value.toLocaleString()}</span>
          <Badge variant="outline" className="text-xs">
            <Percent className="w-3 h-3 mr-1" />
            {deal.probability}%
          </Badge>
        </div>

        <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
          <Clock className="w-3 h-3" />
          {isOverdue ? "Overdue: " : "Close: "}
          {new Date(deal.expectedCloseDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1">Manage deals and track your sales pipeline</p>
        </div>
        <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Customer *</Label>
                <Select value={newDeal.customerId} onValueChange={v => setNewDeal(prev => ({ ...prev, customerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customerAccounts.map(c => {
                      const user = mockUsers.find(u => u.id === c.userId);
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          {user?.firstName} {user?.lastName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deal Title *</Label>
                <Input
                  value={newDeal.title}
                  onChange={e => setNewDeal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Premium Upgrade"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Value ($) *</Label>
                  <Input
                    type="number"
                    value={newDeal.value}
                    onChange={e => setNewDeal(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={newDeal.stage} onValueChange={v => setNewDeal(prev => ({ ...prev, stage: v as DealStage }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {openStages.map(stage => (
                        <SelectItem key={stage} value={stage}>{stageConfig[stage].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Probability (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newDeal.probability}
                    onChange={e => setNewDeal(prev => ({ ...prev, probability: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Expected Close</Label>
                  <Input
                    type="date"
                    value={newDeal.expectedCloseDate}
                    onChange={e => setNewDeal(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newDeal.notes}
                  onChange={e => setNewDeal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes..."
                />
              </div>
              <Button onClick={handleAddDeal} className="w-full">Create Deal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.openDeals}</p>
                <p className="text-xs text-muted-foreground">Open Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.pipelineValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.weightedValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Weighted Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.wonValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Won Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map(stage => {
            const stageDeals = getDealsForStage(stage);
            const stageValue = getStageValue(stage);
            const config = stageConfig[stage];

            return (
              <div
                key={stage}
                className={`w-72 flex-shrink-0 rounded-lg ${config.bgColor}`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
              >
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                      <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                    </div>
                    {stage === "closed_won" && <Trophy className="w-4 h-4 text-green-500" />}
                    {stage === "closed_lost" && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">${stageValue.toLocaleString()}</p>
                </div>

                <ScrollArea className="h-[500px] p-3">
                  <div className="space-y-3">
                    {stageDeals.map(deal => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No deals</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.title}</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Deal Value</p>
                  <p className="text-3xl font-bold text-green-600">${selectedDeal.value.toLocaleString()}</p>
                </div>
                <Badge className={stageConfig[selectedDeal.stage].bgColor + " " + stageConfig[selectedDeal.stage].color}>
                  {stageConfig[selectedDeal.stage].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <Link href={`/admin/crm/customers/${selectedDeal.customerId}`} className="font-medium text-primary hover:underline">
                    {getCustomerName(selectedDeal.customerId)}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Probability</p>
                  <p className="font-medium">{selectedDeal.probability}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Close</p>
                  <p className="font-medium">{new Date(selectedDeal.expectedCloseDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedDeal.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {selectedDeal.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedDeal.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedDeal(null)}>Close</Button>
                <Button className="flex-1">Edit Deal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
