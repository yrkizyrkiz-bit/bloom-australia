"use client";

import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Activity } from "lucide-react";

interface CategoryCardProps {
  name: string;
  color: string;
  icon?: LucideIcon;
  score: number;
  optimal: number;
  normal: number;
  outOfRange: number;
  onClick?: () => void;
  isActive?: boolean;
}

export function CategoryCard({
  name,
  color,
  icon: Icon = Activity,
  score,
  optimal,
  normal,
  outOfRange,
  onClick,
  isActive,
}: CategoryCardProps) {
  const total = optimal + normal + outOfRange;

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    if (value >= 40) return "text-orange-500";
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
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium text-foreground truncate">{name}</h4>
          <p className="text-xs text-muted-foreground">{total} markers</p>
        </div>
        <div className={`ml-auto text-2xl font-serif font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>

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
