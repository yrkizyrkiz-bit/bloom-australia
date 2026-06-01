"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, AlertTriangle, TrendingUp, Droplets, Zap, FlaskConical, ChevronDown, ChevronUp, Lightbulb, Apple, Dumbbell, Pill } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  category: "hydration" | "diet" | "lifestyle" | "supplement" | "monitoring";
  priority: "high" | "medium" | "low";
  description: string;
  actionItems: string[];
  relatedBiomarkers: string[];
  icon: typeof Droplets;
}

const kidneyRecommendations: Recommendation[] = [
  {
    id: "r1",
    title: "Optimize Hydration for Kidney Health",
    category: "hydration",
    priority: "high",
    description: "Proper hydration is crucial for kidney function. Your kidneys filter about 120-150 quarts of blood daily to produce 1-2 quarts of urine. Staying well-hydrated helps kidneys clear toxins efficiently.",
    actionItems: [
      "Drink 8-10 glasses (2-2.5L) of water daily",
      "Monitor urine color - pale yellow indicates good hydration",
      "Increase intake during exercise or hot weather",
      "Limit caffeine and alcohol which can dehydrate",
      "Consider electrolyte drinks if exercising intensely"
    ],
    relatedBiomarkers: ["creatinine", "bun", "egfr"],
    icon: Droplets,
  },
  {
    id: "r2",
    title: "Kidney-Protective Diet Strategy",
    category: "diet",
    priority: "high",
    description: "A kidney-friendly diet can help maintain optimal kidney function and prevent further stress on the kidneys. Focus on reducing sodium and balancing protein intake.",
    actionItems: [
      "Limit sodium to <2,300mg daily (ideally <1,500mg)",
      "Choose fresh foods over processed options",
      "Moderate protein intake (0.8g/kg body weight)",
      "Increase fruits and vegetables for antioxidants",
      "Limit phosphorus-rich foods (dark colas, processed meats)",
      "Include omega-3 fatty acids from fish"
    ],
    relatedBiomarkers: ["uacr", "potassium", "phosphorus", "sodium"],
    icon: Apple,
  },
  {
    id: "r3",
    title: "Blood Pressure Management",
    category: "lifestyle",
    priority: "high",
    description: "High blood pressure is the second leading cause of kidney disease. Controlling blood pressure protects the delicate blood vessels in your kidneys.",
    actionItems: [
      "Monitor blood pressure regularly (target <130/80 mmHg)",
      "Reduce sodium intake significantly",
      "Maintain healthy weight (BMI 18.5-24.9)",
      "Exercise regularly (150 min/week moderate activity)",
      "Manage stress through meditation or yoga",
      "Take prescribed medications consistently"
    ],
    relatedBiomarkers: ["egfr", "uacr", "creatinine"],
    icon: Dumbbell,
  },
  {
    id: "r4",
    title: "Electrolyte Balance Optimization",
    category: "monitoring",
    priority: "medium",
    description: "Your kidneys maintain electrolyte balance. Monitoring and optimizing potassium, sodium, and bicarbonate levels helps prevent complications.",
    actionItems: [
      "Monitor potassium-rich food intake",
      "Balance sodium consumption",
      "Include alkaline-forming foods (fruits, vegetables)",
      "Avoid excessive protein which increases acid load",
      "Stay hydrated to maintain proper balance",
      "Regular blood tests to monitor levels"
    ],
    relatedBiomarkers: ["potassium", "sodium", "bicarbonate"],
    icon: Zap,
  },
  {
    id: "r5",
    title: "Bone Health Support",
    category: "supplement",
    priority: "medium",
    description: "Kidney function affects calcium, phosphorus, and vitamin D metabolism. Supporting bone health is important for overall kidney wellness.",
    actionItems: [
      "Ensure adequate vitamin D (check levels, supplement if needed)",
      "Get calcium from food sources when possible",
      "Limit phosphorus additives in processed foods",
      "Weight-bearing exercise for bone strength",
      "Discuss PTH levels with your doctor if elevated",
      "Consider vitamin D3 supplements (1000-2000 IU daily)"
    ],
    relatedBiomarkers: ["calcium", "phosphorus", "pth"],
    icon: FlaskConical,
  },
  {
    id: "r6",
    title: "Nephrotoxin Avoidance Protocol",
    category: "lifestyle",
    priority: "medium",
    description: "Certain substances can damage kidneys. Avoiding nephrotoxins helps preserve kidney function long-term.",
    actionItems: [
      "Limit NSAIDs (ibuprofen, naproxen) use",
      "Avoid contrast dyes when possible (inform radiologists)",
      "Be cautious with herbal supplements",
      "Limit alcohol consumption",
      "Quit smoking (damages kidney blood vessels)",
      "Review all medications with your doctor"
    ],
    relatedBiomarkers: ["creatinine", "egfr", "cystatin_c"],
    icon: Pill,
  },
];

const getCategoryColor = (category: Recommendation["category"]) => {
  switch (category) {
    case "hydration": return "bg-cyan-500/10 text-cyan-700 border-cyan-200";
    case "diet": return "bg-green-500/10 text-green-700 border-green-200";
    case "lifestyle": return "bg-purple-500/10 text-purple-700 border-purple-200";
    case "supplement": return "bg-amber-500/10 text-amber-700 border-amber-200";
    case "monitoring": return "bg-blue-500/10 text-blue-700 border-blue-200";
  }
};

const getPriorityBadge = (priority: Recommendation["priority"]) => {
  switch (priority) {
    case "high": return <Badge className="bg-red-500">High Priority</Badge>;
    case "medium": return <Badge variant="outline" className="border-amber-500 text-amber-600">Medium</Badge>;
    case "low": return <Badge variant="secondary">Low</Badge>;
  }
};

export function KidneyAIRecommendations() {
  const [expandedId, setExpandedId] = useState<string | null>("r1");

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            AI-Powered Kidney Health Recommendations
          </CardTitle>
          <CardDescription>Personalized insights based on your kidney biomarker results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
            <Lightbulb className="w-8 h-8 text-cyan-600" />
            <div>
              <p className="font-medium">Your Kidney Health Focus Areas</p>
              <p className="text-sm text-muted-foreground">
                Based on your results, we recommend focusing on hydration optimization, blood pressure management, and maintaining your excellent electrolyte balance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {kidneyRecommendations.map((rec) => (
          <Card key={rec.id} className="overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            >
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
                    {rec.relatedBiomarkers.map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs">{b.toUpperCase()}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {expandedId === rec.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {expandedId === rec.id && (
              <div className="px-4 pb-4 pt-0 border-t bg-muted/20">
                <div className="pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-600" />
                    Action Items
                  </h4>
                  <ul className="space-y-2">
                    {rec.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-cyan-700 dark:text-cyan-400">{i + 1}</span>
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
