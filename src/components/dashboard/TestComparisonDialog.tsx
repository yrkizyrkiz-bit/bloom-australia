"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BiomarkerResult, BiomarkerDefinition } from "@/types";
import { getBiomarkerById, categoryInfo } from "@/data/biomarkers";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowLeftRight
} from "lucide-react";

interface TestComparisonDialogProps {
  allResults: BiomarkerResult[];
  testDates: string[];
  gender: "male" | "female";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestComparisonDialog({
  allResults,
  testDates,
  gender,
  open,
  onOpenChange
}: TestComparisonDialogProps) {
  const [date1, setDate1] = useState<string>(testDates[1] || testDates[0] || "");
  const [date2, setDate2] = useState<string>(testDates[0] || "");

  const results1 = useMemo(() => allResults.filter(r => r.testedAt.startsWith(date1)), [date1, allResults]);
  const results2 = useMemo(() => allResults.filter(r => r.testedAt.startsWith(date2)), [date2, allResults]);

  // Get all unique biomarker IDs from both dates
  const allBiomarkerIds = useMemo(() => {
    const ids = new Set<string>();
    results1.forEach(r => ids.add(r.biomarkerId));
    results2.forEach(r => ids.add(r.biomarkerId));
    return Array.from(ids);
  }, [results1, results2]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": return "text-green-600 bg-green-500/10";
      case "normal": return "text-yellow-600 bg-yellow-500/10";
      case "out_of_range": return "text-orange-600 bg-orange-500/10";
      case "critical": return "text-red-600 bg-red-500/10";
      default: return "text-gray-600 bg-gray-500/10";
    }
  };

  const calculateChange = (val1: number | undefined, val2: number | undefined) => {
    if (val1 === undefined || val2 === undefined) return null;
    const diff = val2 - val1;
    const percentChange = ((diff / val1) * 100).toFixed(1);
    return {
      diff: diff.toFixed(2),
      percent: Math.abs(Number(percentChange)),
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable"
    };
  };

  const isImproved = (biomarkerId: string, val1: number | undefined, val2: number | undefined) => {
    if (val1 === undefined || val2 === undefined) return null;
    const biomarker = getBiomarkerById(biomarkerId);
    if (!biomarker) return null;
    const range = biomarker.ranges[gender];

    const val1Optimal = val1 >= range.optimal_low && val1 <= range.optimal_high;
    const val2Optimal = val2 >= range.optimal_low && val2 <= range.optimal_high;

    if (val2Optimal && !val1Optimal) return true;
    if (!val2Optimal && val1Optimal) return false;

    const dist1 = Math.min(Math.abs(val1 - range.optimal_low), Math.abs(val1 - range.optimal_high));
    const dist2 = Math.min(Math.abs(val2 - range.optimal_low), Math.abs(val2 - range.optimal_high));

    return dist2 < dist1;
  };

  // Count improvements and declines
  const stats = useMemo(() => {
    let improved = 0;
    let declined = 0;
    let stable = 0;

    allBiomarkerIds.forEach(id => {
      const r1 = results1.find(r => r.biomarkerId === id);
      const r2 = results2.find(r => r.biomarkerId === id);
      if (r1 && r2) {
        const imp = isImproved(id, r1.value, r2.value);
        if (imp === true) improved++;
        else if (imp === false) declined++;
        else stable++;
      }
    });

    return { improved, declined, stable };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBiomarkerIds, results1, results2, gender]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Compare Test Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Earlier Test</label>
              <Select value={date1} onValueChange={setDate1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {testDates.map(date => (
                    <SelectItem key={date} value={date} disabled={date === date2}>
                      {new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Later Test</label>
              <Select value={date2} onValueChange={setDate2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {testDates.map(date => (
                    <SelectItem key={date} value={date} disabled={date === date1}>
                      {new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-serif font-bold text-green-600">{stats.improved}</p>
              <p className="text-xs text-green-600/80">Improved</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20 text-center">
              <Minus className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-2xl font-serif font-bold text-gray-600">{stats.stable}</p>
              <p className="text-xs text-gray-600/80">Stable</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
              <TrendingDown className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-serif font-bold text-orange-600">{stats.declined}</p>
              <p className="text-xs text-orange-600/80">Declined</p>
            </div>
          </div>

          <Separator />

          {/* Comparison Table */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted rounded-lg text-sm font-medium sticky top-0 z-10">
                <div className="col-span-4">Biomarker</div>
                <div className="col-span-3 text-center">
                  {new Date(date1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                </div>
                <div className="col-span-2 text-center">Change</div>
                <div className="col-span-3 text-center">
                  {new Date(date2).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Rows */}
              {allBiomarkerIds.map(biomarkerId => {
                const biomarker = getBiomarkerById(biomarkerId);
                if (!biomarker) return null;

                const r1 = results1.find(r => r.biomarkerId === biomarkerId);
                const r2 = results2.find(r => r.biomarkerId === biomarkerId);
                const change = calculateChange(r1?.value, r2?.value);
                const improved = isImproved(biomarkerId, r1?.value, r2?.value);
                const range = biomarker.ranges[gender];

                return (
                  <div key={biomarkerId} className="grid grid-cols-12 gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors items-center">
                    {/* Biomarker Name */}
                    <div className="col-span-4 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: `${categoryInfo[biomarker.category].color}20`,
                          color: categoryInfo[biomarker.category].color
                        }}
                      >
                        {biomarker.shortName.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{biomarker.shortName}</p>
                        <p className="text-xs text-muted-foreground">{range.unit}</p>
                      </div>
                    </div>

                    {/* Earlier Value */}
                    <div className="col-span-3 text-center">
                      {r1 ? (
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{r1.value}</span>
                          <Badge variant="outline" className={`text-xs mt-1 ${getStatusColor(r1.status)}`}>
                            {r1.status === "optimal" ? <CheckCircle className="w-3 h-3 mr-1" /> :
                             r1.status === "out_of_range" ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                            {r1.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>

                    {/* Change */}
                    <div className="col-span-2 text-center">
                      {change ? (
                        <div className={`flex flex-col items-center ${
                          improved ? 'text-green-600' : improved === false ? 'text-orange-600' : 'text-muted-foreground'
                        }`}>
                          <div className="flex items-center gap-1">
                            {change.direction === "up" ? <TrendingUp className="w-4 h-4" /> :
                             change.direction === "down" ? <TrendingDown className="w-4 h-4" /> :
                             <Minus className="w-4 h-4" />}
                          </div>
                          <span className="text-xs font-medium">
                            {change.direction === "up" ? "+" : change.direction === "down" ? "" : ""}{change.diff}
                          </span>
                          <span className="text-xs opacity-70">{change.percent}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>

                    {/* Later Value */}
                    <div className="col-span-3 text-center">
                      {r2 ? (
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{r2.value}</span>
                          <Badge variant="outline" className={`text-xs mt-1 ${getStatusColor(r2.status)}`}>
                            {r2.status === "optimal" ? <CheckCircle className="w-3 h-3 mr-1" /> :
                             r2.status === "out_of_range" ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                            {r2.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
