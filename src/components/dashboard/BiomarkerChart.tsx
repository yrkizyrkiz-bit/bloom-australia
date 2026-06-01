"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart
} from "recharts";
import type { BiomarkerResult, BiomarkerDefinition } from "@/types";
import { categoryInfo } from "@/data/biomarkers";

interface BiomarkerChartProps {
  biomarker: BiomarkerDefinition;
  history: BiomarkerResult[];
  gender: "male" | "female";
  height?: number;
  showOptimalRange?: boolean;
}

export function BiomarkerChart({
  biomarker,
  history,
  gender,
  height = 250,
  showOptimalRange = true
}: BiomarkerChartProps) {
  const range = biomarker.ranges[gender];
  const color = categoryInfo[biomarker.category].color;

  const chartData = useMemo(() => {
    return history.map(h => ({
      date: new Date(h.testedAt).toLocaleDateString('en-AU', {
        month: 'short',
        year: '2-digit'
      }),
      value: h.value,
      fullDate: new Date(h.testedAt).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      isOptimal: h.value >= range.optimal_low && h.value <= range.optimal_high,
      status: h.status
    }));
  }, [history, range]);

  // Calculate Y-axis domain with some padding
  const yDomain = useMemo(() => {
    const values = history.map(h => h.value);
    const min = Math.min(...values, range.optimal_low);
    const max = Math.max(...values, range.optimal_high);
    const padding = (max - min) * 0.15;
    return [Math.max(0, min - padding), max + padding];
  }, [history, range]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullDate: string; value: number; isOptimal: boolean } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground mb-1">{data.fullDate}</p>
          <p className="text-lg font-serif font-bold" style={{ color }}>
            {data.value} <span className="text-sm font-normal text-muted-foreground">{range.unit}</span>
          </p>
          <p className={`text-xs mt-1 ${data.isOptimal ? 'text-green-600' : 'text-orange-600'}`}>
            {data.isOptimal ? 'Optimal' : 'Out of Range'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No historical data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${biomarker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />

        <YAxis
          domain={yDomain}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toFixed(0)}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Optimal range highlight */}
        {showOptimalRange && (
          <ReferenceArea
            y1={range.optimal_low}
            y2={range.optimal_high}
            fill="#22c55e"
            fillOpacity={0.1}
            stroke="#22c55e"
            strokeOpacity={0.3}
            strokeDasharray="3 3"
          />
        )}

        {/* Reference lines for optimal range boundaries */}
        <ReferenceLine
          y={range.optimal_low}
          stroke="#22c55e"
          strokeDasharray="5 5"
          strokeOpacity={0.5}
        />
        <ReferenceLine
          y={range.optimal_high}
          stroke="#22c55e"
          strokeDasharray="5 5"
          strokeOpacity={0.5}
        />

        {/* Area under the line */}
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill={`url(#gradient-${biomarker.id})`}
        />

        {/* Main line */}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, strokeWidth: 2, r: 5, stroke: '#fff' }}
          activeDot={{ r: 7, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Mini chart for compact display
interface MiniChartProps {
  history: BiomarkerResult[];
  color?: string;
  height?: number;
}

export function MiniChart({ history, color = "#22c55e", height = 40 }: MiniChartProps) {
  const chartData = useMemo(() => {
    return history.slice(-6).map(h => ({
      value: h.value
    }));
  }, [history]);

  if (history.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Category score chart
interface CategoryChartProps {
  categories: Array<{
    category: string;
    score: number;
    optimal: number;
    normal: number;
    outOfRange: number;
  }>;
}

export function CategoryScoreChart({ categories }: CategoryChartProps) {
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      score: cat.score,
      fill: categoryInfo[cat.category as keyof typeof categoryInfo]?.color || '#888'
    }));
  }, [categories]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 12 }}
          width={70}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Score']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        {chartData.map((entry, index) => (
          <ReferenceLine
            key={index}
            x={80}
            stroke="#22c55e"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
        ))}
        <Line
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={0}
          dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: '#fff' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
