"use client";

import { Card } from "@/components/ui/card";
import type { BiomarkerCategory } from "@/types";
import { categoryInfo } from "@/data/biomarkers";
import {
  Heart,
  Flame,
  Sparkles,
  Activity,
  Bean,
  Droplets,
  Droplet,
  Sun,
  Diamond,
  Zap,
  Shield
} from "lucide-react";

interface CategoryCardProps {
  category: BiomarkerCategory;
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  onClick?: () => void;
  isActive?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Heart,
  Flame,
  Sparkles,
  Activity,
  Bean,
  Droplets,
  Droplet,
  Sun,
  Diamond,
  Zap,
  Shield,
};

export function CategoryCard({
  category,
  score,
  optimal,
  normal,
  outOfRange,
  onClick,
  isActive
}: CategoryCardProps) {
  const info = categoryInfo[category];
  const Icon = iconMap[info.icon] || Activity;
  const total = optimal + normal + outOfRange;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isActive ? "ring-2 ring-primary border-primary" : "hover:border-primary/30"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${info.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: info.color }} />
        </div>
        <div>
          <h4 className="font-medium text-foreground">{info.name}</h4>
          <p className="text-xs text-muted-foreground">{total} markers</p>
        </div>
        <div className={`ml-auto text-2xl font-serif font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>

      {/* Mini breakdown */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">{optimal}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">{normal}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">{outOfRange}</span>
        </div>
      </div>
    </Card>
  );
}
