"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp,
  Clock,
  Target
} from "lucide-react";

interface Recommendation {
  id: string;
  category: "diet" | "exercise" | "supplement" | "lifestyle";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  timeframe: string;
  actionItems: string[];
  relatedBiomarkers: string[];
}

const liverRecommendations: Recommendation[] = [
  {
    id: "rec_1",
    category: "diet",
    priority: "high",
    title: "Mediterranean Diet for Liver Health",
    description: "Your lipid profile shows elevated triglycerides. A Mediterranean-style diet rich in olive oil, fatty fish, and vegetables can significantly improve liver fat metabolism.",
    impact: "Could reduce triglycerides by 15-25% and improve liver enzyme levels",
    timeframe: "4-8 weeks",
    actionItems: [
      "Replace refined carbs with whole grains and legumes",
      "Add 2-3 servings of fatty fish per week (salmon, sardines, mackerel)",
      "Use extra virgin olive oil as your primary cooking fat",
      "Increase daily vegetable intake to 5+ servings",
      "Limit red meat to 1-2 times per week"
    ],
    relatedBiomarkers: ["triglycerides", "ldl_cholesterol", "alt", "ggt"]
  },
  {
    id: "rec_2",
    category: "exercise",
    priority: "high",
    title: "Combination Training for Metabolic Health",
    description: "Your metabolic markers (insulin, glucose) indicate room for improvement. A combination of resistance training and cardio is optimal for liver health and insulin sensitivity.",
    impact: "Can improve insulin sensitivity by 20-40% and reduce liver fat",
    timeframe: "6-12 weeks",
    actionItems: [
      "Aim for 150+ minutes of moderate cardio weekly",
      "Add 2-3 strength training sessions per week",
      "Include high-intensity intervals 1-2x weekly",
      "Take 10-minute walks after meals to aid glucose metabolism",
      "Avoid prolonged sitting - stand or move every 30 minutes"
    ],
    relatedBiomarkers: ["glucose", "insulin", "hba1c", "triglycerides"]
  },
  {
    id: "rec_3",
    category: "supplement",
    priority: "medium",
    title: "Liver Support Stack",
    description: "Based on your biomarker profile, specific supplements may support liver function and reduce inflammation markers.",
    impact: "May improve liver enzymes and reduce CRP by 10-20%",
    timeframe: "8-12 weeks",
    actionItems: [
      "Milk Thistle (Silymarin): 200-400mg daily for liver protection",
      "Omega-3 Fish Oil: 2-3g EPA/DHA daily for inflammation and lipids",
      "NAC (N-Acetyl Cysteine): 600-1200mg for glutathione support",
      "Vitamin E (mixed tocopherols): 400IU for antioxidant support",
      "Always consult your doctor before starting new supplements"
    ],
    relatedBiomarkers: ["alt", "ast", "ggt", "crp", "triglycerides"]
  },
  {
    id: "rec_4",
    category: "lifestyle",
    priority: "medium",
    title: "Optimize Sleep for Liver Regeneration",
    description: "The liver performs critical regeneration and detoxification processes during sleep. Poor sleep quality can elevate liver enzymes and increase inflammation.",
    impact: "Better sleep can reduce CRP by 15-30% and support GGT levels",
    timeframe: "2-4 weeks",
    actionItems: [
      "Aim for 7-8 hours of quality sleep nightly",
      "Maintain consistent sleep/wake times, even on weekends",
      "Avoid eating 2-3 hours before bedtime",
      "Limit alcohol (disrupts sleep architecture and liver)",
      "Keep bedroom cool (18-20°C) and completely dark"
    ],
    relatedBiomarkers: ["ggt", "alt", "crp", "cortisol"]
  },
  {
    id: "rec_5",
    category: "diet",
    priority: "medium",
    title: "Targeted HDL Improvement Strategy",
    description: "Your HDL cholesterol is at the lower end of normal. Specific dietary strategies can help raise your 'good' cholesterol for better cardiovascular and liver protection.",
    impact: "Can increase HDL by 5-15% over time",
    timeframe: "8-12 weeks",
    actionItems: [
      "Add 1-2 tablespoons of coconut oil daily",
      "Include avocados regularly (healthy monounsaturated fats)",
      "Eat eggs (dietary cholesterol helps raise HDL)",
      "Add purple/red foods (anthocyanins boost HDL)",
      "Consider moderate red wine (1 glass, if you drink)"
    ],
    relatedBiomarkers: ["hdl_cholesterol", "total_cholesterol", "triglycerides"]
  }
];

const getCategoryIcon = (category: Recommendation["category"]) => {
  switch (category) {
    case "diet": return Utensils;
    case "exercise": return Dumbbell;
    case "supplement": return Pill;
    case "lifestyle": return Moon;
  }
};

const getCategoryColor = (category: Recommendation["category"]) => {
  switch (category) {
    case "diet": return "text-green-600 bg-green-500/10";
    case "exercise": return "text-blue-600 bg-blue-500/10";
    case "supplement": return "text-purple-600 bg-purple-500/10";
    case "lifestyle": return "text-amber-600 bg-amber-500/10";
  }
};

const getPriorityBadge = (priority: Recommendation["priority"]) => {
  switch (priority) {
    case "high": return "bg-red-500/10 text-red-600 border-red-200";
    case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    case "low": return "bg-green-500/10 text-green-600 border-green-200";
  }
};

export function LiverAIRecommendations() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  const filteredRecs = activeTab === "all"
    ? liverRecommendations
    : liverRecommendations.filter(r => r.category === activeTab);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI-Powered Recommendations
        </CardTitle>
        <CardDescription>
          Personalized insights to optimize your liver health based on your biomarker patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="diet" className="text-xs sm:text-sm gap-1">
              <Utensils className="w-3 h-3 hidden sm:inline" />
              Diet
            </TabsTrigger>
            <TabsTrigger value="exercise" className="text-xs sm:text-sm gap-1">
              <Dumbbell className="w-3 h-3 hidden sm:inline" />
              Exercise
            </TabsTrigger>
            <TabsTrigger value="supplement" className="text-xs sm:text-sm gap-1">
              <Pill className="w-3 h-3 hidden sm:inline" />
              Supplements
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="text-xs sm:text-sm gap-1">
              <Moon className="w-3 h-3 hidden sm:inline" />
              Lifestyle
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {filteredRecs.map((rec) => {
              const Icon = getCategoryIcon(rec.category);
              const isExpanded = expandedRec === rec.id;

              return (
                <div
                  key={rec.id}
                  className="border border-border rounded-lg overflow-hidden transition-all"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(rec.category)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-medium text-foreground">{rec.title}</h4>
                          <Badge variant="outline" className={`text-xs ${getPriorityBadge(rec.priority)}`}>
                            {rec.priority === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>

                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span>{rec.impact.split(' ').slice(0, 5).join(' ')}...</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{rec.timeframe}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Expected Impact
                          </h5>
                          <p className="text-sm text-muted-foreground">{rec.impact}</p>

                          <div className="mt-3 flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground mr-1">Affects:</span>
                            {rec.relatedBiomarkers.map(b => (
                              <Badge key={b} variant="secondary" className="text-xs">
                                {b.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Action Items
                          </h5>
                          <ul className="space-y-1.5">
                            {rec.actionItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
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
      </CardContent>
    </Card>
  );
}
