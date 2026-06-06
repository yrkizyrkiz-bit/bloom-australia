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
  ReferenceLine,
} from "recharts";

interface BiologicalAgeChartProps {
  data: Array<{
    date: string;
    biologicalAge: number;
    chronologicalAge: number;
  }>;
  height?: number;
}

export function BiologicalAgeChart({ data, height = 300 }: BiologicalAgeChartProps) {
  const { minAge, maxAge } = useMemo(() => {
    if (data.length === 0) return { minAge: 20, maxAge: 60 };

    const allAges = data.flatMap(d => [d.biologicalAge, d.chronologicalAge]);
    const min = Math.min(...allAges);
    const max = Math.max(...allAges);

    return {
      minAge: Math.floor(min - 5),
      maxAge: Math.ceil(max + 5),
    };
  }, [data]);

  const latestDiff = useMemo(() => {
    if (data.length === 0) return 0;
    const latest = data[data.length - 1];
    return latest.biologicalAge - latest.chronologicalAge;
  }, [data]);

  const improvement = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0];
    const last = data[data.length - 1];
    const firstDiff = first.biologicalAge - first.chronologicalAge;
    const lastDiff = last.biologicalAge - last.chronologicalAge;
    return firstDiff - lastDiff;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {improvement !== null && (
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            improvement > 0 ? "bg-green-500/10 text-green-600" :
            improvement < 0 ? "bg-orange-500/10 text-orange-600" : "bg-gray-500/10 text-gray-600"
          }`}>
            <span className="font-medium">
              {improvement > 0 ? `↓ ${improvement.toFixed(1)} years improved` :
               improvement < 0 ? `↑ ${Math.abs(improvement).toFixed(1)} years older` :
               "No change"}
            </span>
          </div>
          <span className="text-muted-foreground">
            Current: {latestDiff > 0 ? `+${latestDiff.toFixed(1)}` : latestDiff.toFixed(1)} years vs chronological
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[minAge, maxAge]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `${value}y`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const bioAge = payload.find(p => p.dataKey === "biologicalAge")?.value as number;
                const chronAge = payload.find(p => p.dataKey === "chronologicalAge")?.value as number;
                const diff = bioAge - chronAge;

                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-medium mb-2">{label}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span>Biological: {bioAge.toFixed(1)} years</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>Chronological: {chronAge.toFixed(1)} years</span>
                      </div>
                      <div className={`pt-1 mt-1 border-t ${
                        diff < 0 ? "text-green-600" : diff > 0 ? "text-orange-600" : ""
                      }`}>
                        Difference: {diff > 0 ? "+" : ""}{diff.toFixed(1)} years
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="chronologicalAge"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Chronological Age"
          />
          <Line
            type="monotone"
            dataKey="biologicalAge"
            stroke="#a855f7"
            strokeWidth={3}
            dot={{ r: 5, fill: "#a855f7" }}
            name="Biological Age"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
