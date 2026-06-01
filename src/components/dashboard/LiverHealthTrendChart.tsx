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
  Area,
  ComposedChart,
  ReferenceLine
} from "recharts";

interface LiverHealthTrendData {
  date: string;
  fullDate: string;
  overall: number;
  liverEnzymes: number;
  metabolicPanel: number;
  lipidProfile: number;
  inflammation: number;
}

// Mock historical liver health scores (would come from backend in production)
const mockLiverHealthHistory: LiverHealthTrendData[] = [
  {
    date: "Jun '23",
    fullDate: "June 2023",
    overall: 62,
    liverEnzymes: 68,
    metabolicPanel: 70,
    lipidProfile: 55,
    inflammation: 58
  },
  {
    date: "Sep '23",
    fullDate: "September 2023",
    overall: 71,
    liverEnzymes: 78,
    metabolicPanel: 75,
    lipidProfile: 62,
    inflammation: 70
  },
  {
    date: "Dec '23",
    fullDate: "December 2023",
    overall: 78,
    liverEnzymes: 85,
    metabolicPanel: 82,
    lipidProfile: 70,
    inflammation: 78
  },
  {
    date: "Mar '24",
    fullDate: "March 2024",
    overall: 85,
    liverEnzymes: 100,
    metabolicPanel: 88,
    lipidProfile: 72,
    inflammation: 92
  }
];

interface LiverHealthTrendChartProps {
  height?: number;
  showCategories?: boolean;
}

export function LiverHealthTrendChart({
  height = 280,
  showCategories = false
}: LiverHealthTrendChartProps) {
  const chartData = mockLiverHealthHistory;

  const improvement = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].overall;
    const last = chartData[chartData.length - 1].overall;
    return last - first;
  }, [chartData]);

  const CustomTooltip = ({
    active,
    payload
  }: {
    active?: boolean;
    payload?: Array<{
      payload: LiverHealthTrendData;
      dataKey: string;
      value: number;
      color: string;
    }>
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-border p-3 min-w-[160px]">
          <p className="text-xs text-muted-foreground mb-2 font-medium">{data.fullDate}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall</span>
              <span className="text-lg font-bold text-green-600">{data.overall}</span>
            </div>
            {showCategories && (
              <>
                <div className="pt-1 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Liver Enzymes</span>
                    <span className="font-medium">{data.liverEnzymes}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Metabolic</span>
                    <span className="font-medium">{data.metabolicPanel}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Lipid Profile</span>
                    <span className="font-medium">{data.lipidProfile}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Inflammation</span>
                    <span className="font-medium">{data.inflammation}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Score Trend</h3>
          <p className="text-2xl font-bold text-foreground">
            {chartData[chartData.length - 1]?.overall || 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">current</span>
          </p>
        </div>
        {improvement !== 0 && (
          <div className={`text-right ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <p className="text-sm font-medium">
              {improvement > 0 ? '+' : ''}{improvement} pts
            </p>
            <p className="text-xs text-muted-foreground">since Jun '23</p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="overallGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
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
            domain={[40, 100]}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            ticks={[40, 60, 80, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Good score threshold */}
          <ReferenceLine
            y={80}
            stroke="#22c55e"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
            label={{
              value: 'Good',
              position: 'right',
              fontSize: 10,
              fill: '#22c55e'
            }}
          />

          {/* Category lines (subtle) */}
          {showCategories && (
            <>
              <Line
                type="monotone"
                dataKey="liverEnzymes"
                stroke="#16a34a"
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="metabolicPanel"
                stroke="#f97316"
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="lipidProfile"
                stroke="#ef4444"
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="inflammation"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
              />
            </>
          )}

          {/* Area under overall line */}
          <Area
            type="monotone"
            dataKey="overall"
            stroke="none"
            fill="url(#overallGradient)"
          />

          {/* Main overall line */}
          <Line
            type="monotone"
            dataKey="overall"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ fill: '#16a34a', strokeWidth: 2, r: 5, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>Overall Score</span>
        </div>
        {showCategories && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-green-600/30" />
              <span>Categories</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
