"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Pill, Calendar, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Plus, Package, Truck, RefreshCw, Bell,
  Sparkles, Heart, Zap, Settings, History
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  category: "hair" | "ed" | "vitality";
  pillsRemaining: number;
  totalPills: number;
  lastTaken: string | null;
  nextDose: string;
  refillDate: string;
}

const mockMedications: Medication[] = [
  {
    id: "1",
    name: "Finasteride",
    dosage: "1mg",
    frequency: "Once daily",
    category: "hair",
    pillsRemaining: 22,
    totalPills: 30,
    lastTaken: new Date().toISOString(),
    nextDose: "Tomorrow morning",
    refillDate: "2024-04-15",
  },
  {
    id: "2",
    name: "Minoxidil",
    dosage: "5%",
    frequency: "Twice daily",
    category: "hair",
    pillsRemaining: 45,
    totalPills: 60,
    lastTaken: new Date().toISOString(),
    nextDose: "Tonight",
    refillDate: "2024-04-20",
  },
  {
    id: "3",
    name: "Sildenafil",
    dosage: "50mg",
    frequency: "As needed",
    category: "ed",
    pillsRemaining: 8,
    totalPills: 10,
    lastTaken: null,
    nextDose: "As needed",
    refillDate: "2024-04-25",
  },
  {
    id: "4",
    name: "Vitamin D3 + Zinc",
    dosage: "4000 IU / 30mg",
    frequency: "Once daily",
    category: "vitality",
    pillsRemaining: 55,
    totalPills: 60,
    lastTaken: new Date().toISOString(),
    nextDose: "Tomorrow morning",
    refillDate: "2024-05-01",
  },
];

const categoryConfig = {
  hair: { label: "Hair Loss", icon: Sparkles, color: "violet" },
  ed: { label: "Sexual Health", icon: Heart, color: "rose" },
  vitality: { label: "Vitality", icon: Zap, color: "amber" },
};

export default function TreatmentPage() {
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [showLog, setShowLog] = useState(false);

  const logDose = (medId: string) => {
    setMedications(prev => prev.map(med => {
      if (med.id === medId) {
        return {
          ...med,
          pillsRemaining: Math.max(0, med.pillsRemaining - 1),
          lastTaken: new Date().toISOString(),
        };
      }
      return med;
    }));
    toast.success("Dose logged! Keep up the great work.");
    setShowLog(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDaysUntilRefill = (refillDate: string) => {
    const days = Math.ceil((new Date(refillDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Group medications by category
  const groupedMeds = medications.reduce((acc, med) => {
    if (!acc[med.category]) acc[med.category] = [];
    acc[med.category].push(med);
    return acc;
  }, {} as Record<string, Medication[]>);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" />
            My Treatments
          </h1>
          <p className="text-muted-foreground">Manage medications & refills</p>
        </div>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" /> History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-0 text-white">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xl font-bold">{groupedMeds.hair?.length || 0}</p>
            <p className="text-xs text-white/80">Hair</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0 text-white">
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xl font-bold">{groupedMeds.ed?.length || 0}</p>
            <p className="text-xs text-white/80">Sexual Health</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 text-white">
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xl font-bold">{groupedMeds.vitality?.length || 0}</p>
            <p className="text-xs text-white/80">Vitality</p>
          </CardContent>
        </Card>
      </div>

      {/* Medications by Category */}
      {Object.entries(groupedMeds).map(([category, meds]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        const CategoryIcon = config.icon;

        return (
          <Card key={category} className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CategoryIcon className={`w-5 h-5 text-${config.color}-600`} />
                {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meds.map((med) => {
                const supplyPercent = (med.pillsRemaining / med.totalPills) * 100;
                const daysUntilRefill = getDaysUntilRefill(med.refillDate);
                const needsRefill = daysUntilRefill <= 7 || supplyPercent <= 20;

                return (
                  <div
                    key={med.id}
                    className={`p-4 rounded-xl border ${
                      needsRefill
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{med.name}</p>
                          {needsRefill && (
                            <Badge className="bg-amber-500 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" /> Low Supply
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => {
                          setSelectedMed(med);
                          setShowLog(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Log
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Supply remaining</span>
                        <span className="font-medium">{med.pillsRemaining} / {med.totalPills}</span>
                      </div>
                      <Progress value={supplyPercent} className="h-2" />

                      <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Next: {med.nextDose}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span className={needsRefill ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                            Refill: {formatDate(med.refillDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Refill Reminder */}
      <Card className="bg-gradient-to-r from-teal-500 to-cyan-600 border-0 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Free Shipping</p>
                <p className="text-sm text-teal-100">On all prescription refills</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Order Refill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium">Medication Reminders</p>
                <p className="text-xs text-muted-foreground">Get notified when it&apos;s time</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Dose Dialog */}
      <Dialog open={showLog} onOpenChange={setShowLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              Log Dose
            </DialogTitle>
          </DialogHeader>
          {selectedMed && (
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
                <p className="font-semibold text-lg">{selectedMed.name}</p>
                <p className="text-muted-foreground">{selectedMed.dosage} • {selectedMed.frequency}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                Logging this dose will update your supply count and track your adherence.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={() => logDose(selectedMed.id)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
