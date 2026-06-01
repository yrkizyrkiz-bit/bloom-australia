"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BiomarkerChart } from "@/components/dashboard/BiomarkerChart";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  LineChart,
  List
} from "lucide-react";

interface BiomarkerHistoryDialogProps {
  biomarker: BiomarkerDefinition | null;
  history: BiomarkerResult[];
  gender: "male" | "female";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BiomarkerHistoryDialog({
  biomarker,
  history,
  gender,
  open,
  onOpenChange
}: BiomarkerHistoryDialogProps) {
  if (!biomarker || history.length === 0) return null;

  const range = biomarker.ranges[gender];
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime()
  );

  const getStatusColor = (value: number) => {
    if (value >= range.optimal_low && value <= range.optimal_high) {
      return "text-green-600 bg-green-500/10";
    }
    if (value >= range.low && value <= range.high) {
      return "text-yellow-600 bg-yellow-500/10";
    }
    return "text-orange-600 bg-orange-500/10";
  };

  const getStatusLabel = (value: number) => {
    if (value >= range.optimal_low && value <= range.optimal_high) return "Optimal";
    if (value >= range.low && value <= range.high) return "Normal";
    return "Out of Range";
  };

  const calculateChange = (current: number, previous: number) => {
    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);
    return {
      diff: diff.toFixed(2),
      percent: Math.abs(Number(percentChange)),
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable"
    };
  };

  const isImproved = (current: number, previous: number) => {
    const currOptimal = current >= range.optimal_low && current <= range.optimal_high;
    const prevOptimal = previous >= range.optimal_low && previous <= range.optimal_high;
    if (currOptimal && !prevOptimal) return true;
    if (!currOptimal && prevOptimal) return false;
    const currDist = Math.min(Math.abs(current - range.optimal_low), Math.abs(current - range.optimal_high));
    const prevDist = Math.min(Math.abs(previous - range.optimal_low), Math.abs(previous - range.optimal_high));
    return currDist < prevDist;
  };

  const latestResult = sortedHistory[sortedHistory.length - 1];
  const firstResult = sortedHistory[0];
  const overallChange = sortedHistory.length > 1 ? calculateChange(latestResult.value, firstResult.value) : null;
  const overallImproved = sortedHistory.length > 1 ? isImproved(latestResult.value, firstResult.value) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl font-serif">{biomarker.name}</span>
            <Badge variant="outline" className="text-xs">
              {sortedHistory.length} tests
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Overall Progress Summary */}
            {sortedHistory.length > 1 && (
              <div className={`p-4 rounded-xl border ${overallImproved ? 'border-green-200 bg-green-50' : overallImproved === false ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-serif font-bold">
                        {firstResult.value} <ArrowRight className="inline w-5 h-5" /> {latestResult.value}
                      </span>
                      <span className="text-sm text-muted-foreground">{range.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {overallChange && (
                      <Badge className={`${overallImproved ? 'bg-green-500/10 text-green-600' : overallImproved === false ? 'bg-orange-500/10 text-orange-600' : 'bg-gray-500/10 text-gray-600'}`}>
                        {overallChange.direction === "up" ? <TrendingUp className="w-3 h-3 mr-1 inline" /> :
                         overallChange.direction === "down" ? <TrendingDown className="w-3 h-3 mr-1 inline" /> :
                         <Minus className="w-3 h-3 mr-1 inline" />}
                        {overallChange.percent}% {overallImproved ? "improved" : overallImproved === false ? "declined" : "stable"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chart View */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-primary" />
                    Trend Chart
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500" />
                      <span>Optimal Range</span>
                    </div>
                  </div>
                </div>
                <BiomarkerChart
                  biomarker={biomarker}
                  history={sortedHistory}
                  gender={gender}
                  height={220}
                  showOptimalRange={true}
                />
              </CardContent>
            </Card>

            {/* Timeline View */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Test History Timeline
              </h4>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

                <div className="space-y-4">
                  {sortedHistory.map((result, index) => {
                    const prevResult = index > 0 ? sortedHistory[index - 1] : null;
                    const change = prevResult ? calculateChange(result.value, prevResult.value) : null;
                    const improved = prevResult ? isImproved(result.value, prevResult.value) : null;

                    return (
                      <div key={result.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStatusColor(result.value)}`}>
                          {result.value >= range.optimal_low && result.value <= range.optimal_high ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(result.testedAt).toLocaleDateString('en-AU', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-serif font-bold">{result.value}</span>
                                <span className="text-sm text-muted-foreground">{range.unit}</span>
                              </div>
                              <Badge variant="outline" className={`mt-2 ${getStatusColor(result.value)}`}>
                                {getStatusLabel(result.value)}
                              </Badge>
                            </div>

                            {/* Change from previous */}
                            {change && (
                              <div className="text-right">
                                <div className={`flex items-center gap-1 text-sm ${
                                  improved ? 'text-green-600' : improved === false ? 'text-red-600' : 'text-muted-foreground'
                                }`}>
                                  {change.direction === "up" ? <TrendingUp className="w-4 h-4" /> :
                                   change.direction === "down" ? <TrendingDown className="w-4 h-4" /> :
                                   <Minus className="w-4 h-4" />}
                                  <span>{change.direction === "up" ? "+" : change.direction === "down" ? "-" : ""}{Math.abs(Number(change.diff))}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {change.percent}% from previous
                                </p>
                              </div>
                            )}

                            {index === sortedHistory.length - 1 && (
                              <Badge className="bg-primary/10 text-primary">Latest</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Reference Range */}
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium mb-3">Reference Range</h4>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Low</p>
                  <p className="font-medium">&lt; {range.optimal_low} {range.unit}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-2">
                  <p className="text-green-600">Optimal</p>
                  <p className="font-medium text-green-700">{range.optimal_low} - {range.optimal_high} {range.unit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">High</p>
                  <p className="font-medium">&gt; {range.optimal_high} {range.unit}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
