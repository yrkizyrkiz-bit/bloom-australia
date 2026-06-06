"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SparklineData {
  value: number;
  date?: string;
}

interface HealthTrendSparklineProps {
  data: SparklineData[];
  color?: string;
  height?: number;
  showTrend?: boolean;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { date?: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-lg border border-border text-xs">
        <p className="font-medium">{payload[0].value}</p>
        {payload[0].payload.date && (
          <p className="text-muted-foreground">{payload[0].payload.date}</p>
        )}
      </div>
    );
  }
  return null;
};

export function HealthTrendSparkline({
  data,
  color = "#10b981",
  height = 40,
  showTrend = true,
}: HealthTrendSparklineProps) {
  const trend = useMemo(() => {
    if (data.length < 2) return "stable";
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = ((last - first) / first) * 100;
    if (change > 5) return "up";
    if (change < -5) return "down";
    return "stable";
  }, [data]);

  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500";

  return (
    <div className="flex items-center gap-2">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showTrend && (
        <div className={`flex-shrink-0 ${trendColor}`}>
          {trend === "up" && <TrendingUp className="w-4 h-4" />}
          {trend === "down" && <TrendingDown className="w-4 h-4" />}
          {trend === "stable" && <Minus className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
}

interface MultiSparklineProps {
  series: {
    name: string;
    data: SparklineData[];
    color: string;
  }[];
  height?: number;
}

export function MultiHealthSparkline({ series, height = 60 }: MultiSparklineProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-lg border border-border text-xs">
                    {payload.map((entry, idx) => (
                      <p key={idx} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          {series.map((s, idx) => (
            <Line
              key={idx}
              type="monotone"
              data={s.data}
              dataKey="value"
              name={s.name}
              stroke={s.color}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
