"use client";

import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";

interface WeeklyData {
  week: string;
  avgWeight: number;
}

interface ProgressChartProps {
  data: WeeklyData[];
  startingWeight?: number;
  targetWeight?: number;
  showFullStats?: boolean;
}

export function ProgressChart({ data, startingWeight, targetWeight, showFullStats = false }: ProgressChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const weights = data.map(d => d.avgWeight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 5;
    const padding = range * 0.15;

    // Generate average progress line (expected steady decline)
    const actualStart = startingWeight || weights[0];
    const expectedWeeklyLoss = 0.5; // 0.5kg per week average
    const averageProgress = data.map((_, i) => {
      return actualStart - (expectedWeeklyLoss * i);
    });

    return {
      points: data.map((d, i) => ({
        x: (i / (data.length - 1 || 1)) * 100,
        y: 100 - ((d.avgWeight - (minWeight - padding)) / (range + padding * 2)) * 100,
        weight: d.avgWeight,
        week: d.week,
      })),
      averagePoints: averageProgress.map((weight, i) => ({
        x: (i / (data.length - 1 || 1)) * 100,
        y: 100 - ((weight - (minWeight - padding)) / (range + padding * 2)) * 100,
        weight,
      })),
      minWeight: minWeight - padding,
      maxWeight: maxWeight + padding,
      range: range + padding * 2,
    };
  }, [data, startingWeight]);

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-6">
        <div className="h-48 flex flex-col items-center justify-center text-emerald-200/60">
          <Scale className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm text-center">No weight data yet.<br />Start tracking to see your progress!</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const firstWeight = chartData.points[0].weight;
  const currentWeight = chartData.points[chartData.points.length - 1].weight;
  const totalChange = currentWeight - firstWeight;
  const isLoss = totalChange <= 0;

  // Create path strings
  const pathD = chartData.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${chartData.points[chartData.points.length - 1].x} 100 L 0 100 Z`;

  // Average progress path (dashed line)
  const avgPathD = chartData.averagePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Y-axis labels
  const yLabels = [
    Math.round(chartData.maxWeight),
    Math.round(chartData.minWeight + (chartData.range * 0.66)),
    Math.round(chartData.minWeight + (chartData.range * 0.33)),
    Math.round(chartData.minWeight),
  ];

  // X-axis labels (first and last dates)
  const firstDate = new Date(chartData.points[0].week);
  const lastDate = new Date(chartData.points[chartData.points.length - 1].week);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
  };

  const handlePointHover = (index: number, event: React.MouseEvent) => {
    setHoveredPoint(index);
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
    if (parentRect) {
      setTooltipPosition({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top,
      });
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-900 to-teal-900 p-5 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/3" />
      </div>

      {/* Stats Header */}
      {showFullStats && (
        <div className="relative z-10 flex items-start justify-between mb-4">
          <div>
            <p className="text-emerald-300/70 text-xs uppercase tracking-wider mb-1">Weight change to date</p>
            <div className="flex items-center gap-2">
              {isLoss ? (
                <TrendingDown className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-amber-400" />
              )}
              <span className={`text-2xl font-bold ${isLoss ? 'text-emerald-300' : 'text-amber-300'}`}>
                {Math.abs(totalChange).toFixed(1)} kg
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-emerald-300/70 text-xs">Starting: <span className="text-emerald-200 font-medium">{firstWeight.toFixed(1)} kg</span></div>
            <div className="text-emerald-300/70 text-xs">Current: <span className="text-emerald-100 font-semibold">{currentWeight.toFixed(1)} kg</span></div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative z-10">
        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute z-20 px-3 py-1.5 bg-white rounded-lg shadow-lg text-xs font-medium text-gray-800 whitespace-nowrap transform -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{
              left: `${(chartData.points[hoveredPoint].x / 100) * 100}%`,
              top: `${(chartData.points[hoveredPoint].y / 100) * 100}%`,
              marginTop: '-12px',
            }}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-3 h-3 text-violet-500" />
              <span className="text-violet-600 font-bold">{chartData.points[hoveredPoint].weight.toFixed(1)} kg</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                {new Date(chartData.points[hoveredPoint].week).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}

        <div className="flex">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-[10px] text-emerald-400/60 pr-2 py-1 h-44">
            {yLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          {/* Chart area */}
          <div className="flex-1 h-44 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.3"
                />
              ))}

              {/* Gradient fill under the line */}
              <defs>
                <linearGradient id="juniperGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#0d9488" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#115e59" stopOpacity="0.05" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path d={areaD} fill="url(#juniperGradient)" />

              {/* Average progress dashed line */}
              <path
                d={avgPathD}
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Main progress line - violet/purple */}
              <path
                d={pathD}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter="url(#glow)"
              />

              {/* Data points */}
              {chartData.points.map((point, i) => (
                <g key={i}>
                  {/* Outer ring for hovered point */}
                  {hoveredPoint === i && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      className="animate-pulse"
                    />
                  )}
                  {/* Main point */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredPoint === i ? "2.5" : "2"}
                    fill="#a78bfa"
                    stroke={hoveredPoint === i ? "#fff" : "#a78bfa"}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={(e) => handlePointHover(i, e)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              ))}

              {/* Latest point highlight - larger with glow */}
              <circle
                cx={chartData.points[chartData.points.length - 1].x}
                cy={chartData.points[chartData.points.length - 1].y}
                r="3.5"
                fill="#c4b5fd"
                stroke="#fff"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                filter="url(#glow)"
              />

              {/* Vertical line from latest point to bottom */}
              <line
                x1={chartData.points[chartData.points.length - 1].x}
                y1={chartData.points[chartData.points.length - 1].y}
                x2={chartData.points[chartData.points.length - 1].x}
                y2="100"
                stroke="rgba(196, 181, 253, 0.3)"
                strokeWidth="1"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-emerald-400/60 mt-1 pl-8">
          <span>{formatDate(firstDate)}</span>
          <span>{formatDate(lastDate)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="relative z-10 flex items-center gap-4 mt-4 text-xs text-emerald-300/70">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-white/30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, #fff 3px, #fff 6px)' }} />
          <span>Average progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-violet-400 rounded-full" />
          <span>Your progress</span>
        </div>
      </div>

      {/* Compact stats for non-full view */}
      {!showFullStats && (
        <div className="relative z-10 flex items-center justify-between mt-3 pt-3 border-t border-emerald-700/30">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoss ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-xs text-emerald-300/70">
              {chartData.points.length} weeks tracked
            </span>
          </div>
          <div className={`flex items-center gap-1 text-sm font-semibold ${isLoss ? 'text-emerald-300' : 'text-amber-300'}`}>
            {isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {Math.abs(totalChange).toFixed(1)} kg
          </div>
        </div>
      )}
    </div>
  );
}

// View Tracking History Button - Juniper Style
export function ViewTrackingHistoryButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-4 py-3 px-4 rounded-xl bg-emerald-800/50 hover:bg-emerald-800/70 border border-emerald-700/50 text-emerald-100 font-medium text-sm transition-all flex items-center justify-center gap-2 group"
    >
      <Scale className="w-4 h-4 group-hover:scale-110 transition-transform" />
      View tracking history
    </button>
  );
}

// Full-page Progress Chart Component for the Progress page
export function FullProgressChart({ data, startingWeight, targetWeight }: ProgressChartProps) {
  return (
    <ProgressChart
      data={data}
      startingWeight={startingWeight}
      targetWeight={targetWeight}
      showFullStats={true}
    />
  );
}
