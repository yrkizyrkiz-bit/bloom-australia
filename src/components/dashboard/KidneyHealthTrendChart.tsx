"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface KidneyHealthTrendChartProps {
  height?: number;
  showCategories?: boolean;
}

const mockKidneyHealthHistory = [
  { month: "Jun 2023", overall: 78, kidneyFunction: 72, urineMarkers: 65, electrolytes: 85, boneMineral: 80 },
  { month: "Sep 2023", overall: 84, kidneyFunction: 80, urineMarkers: 78, electrolytes: 88, boneMineral: 85 },
  { month: "Dec 2023", overall: 89, kidneyFunction: 88, urineMarkers: 85, electrolytes: 92, boneMineral: 90 },
  { month: "Mar 2024", overall: 93, kidneyFunction: 94, urineMarkers: 92, electrolytes: 95, boneMineral: 92 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-border">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function KidneyHealthTrendChart({ height = 300, showCategories = false }: KidneyHealthTrendChartProps) {
  const chartData = useMemo(() => mockKidneyHealthHistory, []);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="overall" name="Overall Score" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          {showCategories && (
            <>
              <Line type="monotone" dataKey="kidneyFunction" name="Kidney Function" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="urineMarkers" name="Urine Markers" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="electrolytes" name="Electrolytes" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="boneMineral" name="Bone & Mineral" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
