"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiomarkerTrendChart } from "@/components/dashboard/BiomarkerTrendChart";
import {
  LineChart,
  Heart,
  Activity,
  Droplets,
  Bean,
  Flame,
  Sparkles,
  BarChart3
} from "lucide-react";

const categories = [
  { id: "all", name: "All Biomarkers", icon: BarChart3, color: "#6366f1" },
  { id: "heart", name: "Heart Health", icon: Heart, color: "#ef4444" },
  { id: "kidney", name: "Kidney Function", icon: Droplets, color: "#06b6d4" },
  { id: "liver", name: "Liver Function", icon: Bean, color: "#84cc16" },
  { id: "thyroid", name: "Thyroid Function", icon: Activity, color: "#3b82f6" },
  { id: "hormones", name: "Hormones", icon: Sparkles, color: "#a855f7" },
  { id: "metabolic", name: "Metabolic", icon: Flame, color: "#f97316" },
];

export default function TrendsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Historical Trends
            </h1>
            <p className="text-muted-foreground text-sm">
              Track how your biomarkers change over time
            </p>
          </div>
        </div>
      </div>

      {/* Introduction Card */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200/50">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
              <LineChart className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Understanding Your Health Trends</h3>
              <p className="text-sm text-slate-600">
                This page shows how your biomarker values have changed across multiple test dates.
                Use this information to identify improvements, track the effectiveness of lifestyle changes,
                and spot potential areas of concern before they become serious.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-slate-100/80">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
              <span className="hidden sm:inline">{cat.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Categories */}
        <TabsContent value="all" className="mt-6">
          <BiomarkerTrendChart />
        </TabsContent>

        {/* Heart */}
        <TabsContent value="heart" className="mt-6">
          <BiomarkerTrendChart category="HEART" />
        </TabsContent>

        {/* Kidney */}
        <TabsContent value="kidney" className="mt-6">
          <BiomarkerTrendChart category="KIDNEY" />
        </TabsContent>

        {/* Liver */}
        <TabsContent value="liver" className="mt-6">
          <BiomarkerTrendChart category="LIVER" />
        </TabsContent>

        {/* Thyroid */}
        <TabsContent value="thyroid" className="mt-6">
          <BiomarkerTrendChart category="THYROID" />
        </TabsContent>

        {/* Hormones */}
        <TabsContent value="hormones" className="mt-6">
          <BiomarkerTrendChart category="HORMONES" />
        </TabsContent>

        {/* Metabolic */}
        <TabsContent value="metabolic" className="mt-6">
          <BiomarkerTrendChart category="METABOLIC" />
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tips for Tracking Your Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-3">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <span>Get tested regularly (every 3-6 months) to build a meaningful trend history.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <span>Focus on biomarkers showing "worsening" trends and discuss with your doctor.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <span>Celebrate "improving" trends - they show your lifestyle changes are working!</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
              <span>Use the AI Health Report for personalized recommendations based on your trends.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
