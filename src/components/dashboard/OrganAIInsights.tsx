"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Utensils,
  Dumbbell,
  Pill,
  Moon,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  Stethoscope,
  FlaskConical,
} from "lucide-react";
import { useOrganAnalysis } from "@/hooks/useOrganAnalysis";
import { ReportDataDateNotice } from "@/components/dashboard/ReportDataDateNotice";
import {
  ORGAN_CONFIG,
  type NormalizedRecommendation,
  type OrganType,
  type RecommendationCategory,
} from "@/lib/organ-ai-recommendations";

interface OrganAIInsightsProps {
  organ: OrganType;
}

const categoryIcons: Record<RecommendationCategory, React.ComponentType<{ className?: string }>> = {
  diet: Utensils,
  exercise: Dumbbell,
  supplement: Pill,
  lifestyle: Moon,
  medical: Stethoscope,
  nutrition: Utensils,
  testing: FlaskConical,
  general: Lightbulb,
};

const categoryColors: Record<RecommendationCategory, string> = {
  diet: "text-green-600 bg-green-500/10",
  exercise: "text-blue-600 bg-blue-500/10",
  supplement: "text-purple-600 bg-purple-500/10",
  lifestyle: "text-amber-600 bg-amber-500/10",
  medical: "text-red-600 bg-red-500/10",
  nutrition: "text-green-600 bg-green-500/10",
  testing: "text-cyan-600 bg-cyan-500/10",
  general: "text-slate-600 bg-slate-500/10",
};

function priorityBadgeClass(priority: NormalizedRecommendation["priority"]) {
  switch (priority) {
    case "high":
      return "bg-red-500/10 text-red-600 border-red-200";
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    default:
      return "bg-green-500/10 text-green-600 border-green-200";
  }
}

export function OrganAIInsights({ organ }: OrganAIInsightsProps) {
  const { analysis, isLoading, error, dataDate, resultsStale } = useOrganAnalysis(organ);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const config = ORGAN_CONFIG[organ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading AI recommendations from your latest results…</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <p className="font-medium text-orange-800 mb-1">AI recommendations unavailable</p>
          <p className="text-sm text-orange-600">{error || "No analysis data found"}</p>
        </CardContent>
      </Card>
    );
  }

  const recommendations = analysis.recommendations;
  const filteredRecs =
    activeTab === "all"
      ? recommendations
      : recommendations.filter(r => r.category === activeTab || (activeTab === "diet" && r.category === "nutrition"));

  return (
    <div className="space-y-4">
      <ReportDataDateNotice dataDate={dataDate} resultsStale={resultsStale} />

      {analysis.summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}

      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 text-sm">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>
            Personalized {config.label.toLowerCase()} health actions from your Claude AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No specific recommendations in your latest report. Check the Risk Assessment tab for the full analysis.
            </p>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-6">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="diet" className="text-xs gap-1"><Utensils className="w-3 h-3 hidden sm:inline" />Diet</TabsTrigger>
                <TabsTrigger value="exercise" className="text-xs gap-1"><Dumbbell className="w-3 h-3 hidden sm:inline" />Exercise</TabsTrigger>
                <TabsTrigger value="supplement" className="text-xs gap-1"><Pill className="w-3 h-3 hidden sm:inline" />Supplements</TabsTrigger>
                <TabsTrigger value="lifestyle" className="text-xs gap-1"><Moon className="w-3 h-3 hidden sm:inline" />Lifestyle</TabsTrigger>
                <TabsTrigger value="medical" className="text-xs gap-1"><Stethoscope className="w-3 h-3 hidden sm:inline" />Medical</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                {filteredRecs.map(rec => {
                  const Icon = categoryIcons[rec.category] || Lightbulb;
                  const isExpanded = expandedRec === rec.id;

                  return (
                    <div key={rec.id} className="border border-border rounded-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[rec.category]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-medium">{rec.title}</h4>
                              <Badge variant="outline" className={`text-xs ${priorityBadgeClass(rec.priority)}`}>
                                {rec.priority === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                            {rec.timeframe && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{rec.timeframe}</span>
                              </div>
                            )}
                          </div>
                          <ArrowRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              {rec.impact && (
                                <>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    Expected impact
                                  </h5>
                                  <p className="text-sm text-muted-foreground">{rec.impact}</p>
                                </>
                              )}
                              {rec.relatedBiomarkers.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  <span className="text-xs text-muted-foreground mr-1">Related:</span>
                                  {rec.relatedBiomarkers.map(b => (
                                    <Badge key={b} variant="secondary" className="text-xs">
                                      {b.replace(/_/g, " ")}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                Action items
                              </h5>
                              <ul className="space-y-1.5">
                                {rec.actionItems.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
