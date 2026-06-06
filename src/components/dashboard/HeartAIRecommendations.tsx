"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, ChevronDown, ChevronUp, Lightbulb, Heart, Dumbbell, Apple, Pill } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  category: "diet" | "exercise" | "lifestyle" | "supplement";
  priority: "high" | "medium" | "low";
  description: string;
  actionItems: string[];
  relatedBiomarkers: string[];
  icon: typeof Heart;
}

const heartRecommendations: Recommendation[] = [
  {
    id: "r1", title: "Optimize Your Lipid Profile", category: "diet", priority: "high",
    description: "Your LDL cholesterol is optimal, but triglycerides could be improved. Focus on reducing refined carbohydrates and increasing omega-3 intake.",
    actionItems: ["Reduce sugar and refined carbs", "Eat fatty fish 2-3x per week (salmon, mackerel)", "Add walnuts and flaxseed to your diet", "Limit alcohol consumption", "Consider fish oil supplement (2-3g EPA/DHA daily)"],
    relatedBiomarkers: ["triglycerides", "hdl_cholesterol", "ldl_cholesterol"], icon: Apple
  },
  {
    id: "r2", title: "Cardiovascular Exercise Protocol", category: "exercise", priority: "high",
    description: "Regular aerobic exercise is one of the most effective ways to improve HDL cholesterol and overall heart health.",
    actionItems: ["Aim for 150+ minutes moderate cardio weekly", "Include brisk walking, cycling, or swimming", "Add interval training 1-2x per week", "Monitor heart rate during exercise", "Stay consistent - frequency matters more than intensity"],
    relatedBiomarkers: ["hdl_cholesterol", "triglycerides", "crp"], icon: Dumbbell
  },
  {
    id: "r3", title: "Anti-Inflammatory Lifestyle", category: "lifestyle", priority: "medium",
    description: "Your CRP is optimal, indicating low inflammation. Maintain this with continued anti-inflammatory practices.",
    actionItems: ["Follow Mediterranean-style eating pattern", "Prioritize sleep (7-9 hours nightly)", "Practice stress management daily", "Limit processed and fried foods", "Stay physically active"],
    relatedBiomarkers: ["crp", "homocysteine"], icon: Heart
  },
  {
    id: "r4", title: "Heart-Healthy Supplements", category: "supplement", priority: "medium",
    description: "Targeted supplements can support cardiovascular health alongside a healthy lifestyle.",
    actionItems: ["Omega-3 fish oil (if not eating fatty fish regularly)", "CoQ10 (100-200mg daily) for heart energy", "Magnesium for blood pressure support", "Consider plant sterols for cholesterol", "B-vitamins to support homocysteine levels"],
    relatedBiomarkers: ["total_cholesterol", "ldl_cholesterol", "homocysteine"], icon: Pill
  },
];

const getCategoryColor = (category: Recommendation["category"]) => {
  switch (category) {
    case "diet": return "bg-green-500/10 text-green-700 border-green-200";
    case "exercise": return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "lifestyle": return "bg-purple-500/10 text-purple-700 border-purple-200";
    case "supplement": return "bg-amber-500/10 text-amber-700 border-amber-200";
  }
};

const getPriorityBadge = (priority: Recommendation["priority"]) => {
  switch (priority) {
    case "high": return <Badge className="bg-red-500">High Priority</Badge>;
    case "medium": return <Badge variant="outline" className="border-amber-500 text-amber-600">Medium</Badge>;
    case "low": return <Badge variant="secondary">Low</Badge>;
  }
};

export function HeartAIRecommendations() {
  const [expandedId, setExpandedId] = useState<string | null>("r1");

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-red-600" />AI-Powered Heart Health Recommendations</CardTitle>
          <CardDescription>Personalized insights based on your cardiovascular biomarkers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
            <Lightbulb className="w-8 h-8 text-red-600" />
            <div>
              <p className="font-medium">Your Heart Health Focus Areas</p>
              <p className="text-sm text-muted-foreground">Focus on reducing triglycerides through diet and exercise while maintaining your excellent cholesterol ratios.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {heartRecommendations.map((rec) => (
          <Card key={rec.id} className="overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(rec.category)}`}>
                  <rec.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{rec.title}</h3>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.relatedBiomarkers.map((b) => <Badge key={b} variant="secondary" className="text-xs">{b.replace("_", " ").toUpperCase()}</Badge>)}
                  </div>
                </div>
                <Button variant="ghost" size="sm">{expandedId === rec.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</Button>
              </div>
            </div>
            {expandedId === rec.id && (
              <div className="px-4 pb-4 pt-0 border-t bg-muted/20">
                <div className="pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-red-600" />Action Items</h4>
                  <ul className="space-y-2">
                    {rec.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">{i + 1}</span>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
