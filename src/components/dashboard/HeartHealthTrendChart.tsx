"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HeartHealthTrendChartProps {
  height?: number;
  showCategories?: boolean;
}

const mockHeartHealthHistory = [
  { month: "Jun 2023", overall: 72, lipidPanel: 65, inflammation: 70, metabolic: 80 },
  { month: "Sep 2023", overall: 78, lipidPanel: 72, inflammation: 78, metabolic: 85 },
  { month: "Dec 2023", overall: 83, lipidPanel: 80, inflammation: 82, metabolic: 88 },
  { month: "Mar 2024", overall: 87, lipidPanel: 85, inflammation: 88, metabolic: 90 },
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

export function HeartHealthTrendChart({ height = 300, showCategories = false }: HeartHealthTrendChartProps) {
  const chartData = useMemo(() => mockHeartHealthHistory, []);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="overall" name="Overall Score" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          {showCategories && (
            <>
              <Line type="monotone" dataKey="lipidPanel" name="Lipid Panel" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="inflammation" name="Inflammation" stroke="#eab308" strokeWidth={2} dot={{ fill: "#eab308", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="metabolic" name="Metabolic" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }} strokeDasharray="5 5" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
