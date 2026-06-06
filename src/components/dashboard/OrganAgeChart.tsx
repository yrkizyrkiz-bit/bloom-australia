"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface OrganAgeChartProps {
  organAges: {
    metabolic?: number;
    cardiovascular?: number;
    liver?: number;
    kidney?: number;
    immune?: number;
    blood?: number;
    inflammatory?: number;
    thyroid?: number;
    hormonal?: number;
  };
  chronologicalAge: number;
  height?: number;
}

const ORGAN_LABELS: Record<string, string> = {
  metabolic: "Metabolic",
  cardiovascular: "Cardio",
  liver: "Liver",
  kidney: "Kidney",
  immune: "Immune",
  blood: "Blood",
  inflammatory: "Inflam.",
  thyroid: "Thyroid",
  hormonal: "Hormonal",
};

export function OrganAgeChart({ organAges, chronologicalAge, height = 250 }: OrganAgeChartProps) {
  const data = useMemo(() => {
    return Object.entries(organAges)
      .filter(([_, age]) => age != null)
      .map(([organ, age]) => ({
        organ,
        label: ORGAN_LABELS[organ] || organ,
        age: age!,
        diff: age! - chronologicalAge,
      }))
      .sort((a, b) => a.age - b.age);
  }, [organAges, chronologicalAge]);

  const { minAge, maxAge } = useMemo(() => {
    if (data.length === 0) return { minAge: chronologicalAge - 10, maxAge: chronologicalAge + 10 };

    const ages = data.map(d => d.age);
    const min = Math.min(...ages, chronologicalAge);
    const max = Math.max(...ages, chronologicalAge);

    return {
      minAge: Math.floor(min - 3),
      maxAge: Math.ceil(max + 3),
    };
  }, [data, chronologicalAge]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No organ age data available
      </div>
    );
  }

  const getBarColor = (diff: number) => {
    if (diff <= -3) return "#22c55e"; // Green - much younger
    if (diff < 0) return "#4ade80"; // Light green - younger
    if (diff === 0) return "#9ca3af"; // Gray - same
    if (diff <= 3) return "#fb923c"; // Orange - slightly older
    return "#ef4444"; // Red - much older
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
        <XAxis
          type="number"
          domain={[minAge, maxAge]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value}y`}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                  <p className="font-medium mb-1">{ORGAN_LABELS[data.organ] || data.organ}</p>
                  <div className="space-y-1 text-sm">
                    <p>Age: <span className="font-medium">{data.age.toFixed(1)} years</span></p>
                    <p className={data.diff < 0 ? "text-green-600" : data.diff > 0 ? "text-orange-600" : ""}>
                      {data.diff > 0 ? "+" : ""}{data.diff.toFixed(1)} vs chronological
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <ReferenceLine
          x={chronologicalAge}
          stroke="#6b7280"
          strokeWidth={2}
          strokeDasharray="5 5"
          label={{
            value: `Chronological: ${chronologicalAge}`,
            position: "top",
            fontSize: 11,
            fill: "#6b7280"
          }}
        />
        <Bar dataKey="age" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.diff)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
