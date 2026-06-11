"use client";

import { useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import type { OrganTrendCategory, OrganTrendPoint } from "@/lib/organ-trend-data";

const CATEGORY_COLORS = ["#16a34a", "#f97316", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

interface OrganHealthTrendChartProps {
  data: OrganTrendPoint[];
  categories: OrganTrendCategory[];
  primaryColor: string;
  height?: number;
  showCategories?: boolean;
}

export function OrganHealthTrendChart({
  data,
  categories,
  primaryColor,
  height = 280,
  showCategories = false,
}: OrganHealthTrendChartProps) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        ...point.categories,
      })),
    [data]
  );

  const improvement = useMemo(() => {
    if (data.length < 2) return 0;
    return data[data.length - 1].overall - data[0].overall;
  }, [data]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: OrganTrendPoint & Record<string, number>;
    }>;
  }) => {
    if (!active || !payload?.length) return null;

    const point = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-border p-3 min-w-[160px]">
        <p className="text-xs text-muted-foreground mb-2 font-medium">{point.fullDate}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall</span>
            <span className="text-lg font-bold" style={{ color: primaryColor }}>
              {point.overall}
            </span>
          </div>
          {showCategories && (
            <div className="pt-1 border-t border-border space-y-1">
              {categories.map((category) =>
                point.categories[category.key] !== undefined ? (
                  <div key={category.key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{category.name}</span>
                    <span className="font-medium">{point.categories[category.key]}</span>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const yMin = Math.max(0, Math.min(...data.map((p) => p.overall)) - 15);
  const yMax = Math.min(100, Math.max(...data.map((p) => p.overall)) + 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Score Trend</h3>
          <p className="text-2xl font-bold text-foreground">
            {data[data.length - 1]?.overall ?? 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">current</span>
          </p>
        </div>
        {data.length >= 2 && improvement !== 0 && (
          <div className={`text-right ${improvement > 0 ? "text-green-600" : "text-red-600"}`}>
            <p className="text-sm font-medium">
              {improvement > 0 ? "+" : ""}
              {improvement} pts
            </p>
            <p className="text-xs text-muted-foreground">since {data[0].date}</p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`overallGradient-${primaryColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />

          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine
            y={80}
            stroke="#22c55e"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
            label={{
              value: "Good",
              position: "right",
              fontSize: 10,
              fill: "#22c55e",
            }}
          />

          {showCategories &&
            categories.map((category, index) => (
              <Line
                key={category.key}
                type="monotone"
                dataKey={category.key}
                stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
              />
            ))}

          <Area
            type="monotone"
            dataKey="overall"
            stroke="none"
            fill={`url(#overallGradient-${primaryColor})`}
          />

          <Line
            type="monotone"
            dataKey="overall"
            stroke={primaryColor}
            strokeWidth={3}
            dot={{ fill: primaryColor, strokeWidth: 2, r: 5, stroke: "#fff" }}
            activeDot={{ r: 7, fill: primaryColor, stroke: "#fff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span>Overall Score</span>
        </div>
        {showCategories && categories.length > 1 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-muted-foreground/30" />
            <span>Categories</span>
          </div>
        )}
      </div>
    </div>
  );
}
