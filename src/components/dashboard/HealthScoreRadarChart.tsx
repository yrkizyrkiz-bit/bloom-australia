"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface HealthScoreRadarChartProps {
  scores: {
    category: string;
    score: number;
    fullMark?: number;
  }[];
  height?: number;
  showLegend?: boolean;
  color?: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { category: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-border">
        <p className="font-medium text-sm">{payload[0].payload.category}</p>
        <p className="text-sm text-muted-foreground">
          Score: <span className="font-bold text-primary">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function HealthScoreRadarChart({
  scores,
  height = 300,
  showLegend = false,
  color = "#10b981"
}: HealthScoreRadarChartProps) {
  const chartData = useMemo(() => {
    return scores.map(item => ({
      ...item,
      fullMark: item.fullMark || 100,
    }));
  }, [scores]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <Radar
            name="Health Score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
