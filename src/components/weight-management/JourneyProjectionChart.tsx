"use client";

import { useEffect, useId, useState, type MouseEvent } from "react";
import { Scale } from "lucide-react";
import {
  getWeightLossCurveParams,
  monthAxisTicks,
  monthsFromStart,
  programHorizonMonths,
  projectedWeightAt,
  smoothSvgPath,
} from "@/lib/weight-management/journey-projection";
import { parsePlanDate } from "@/lib/weight-management/quiz-goal-defaults";

type WeeklyPoint = { week: string; avgWeight: number };

export type JourneyProjectionChartProps = {
  startWeight: number;
  targetWeight: number;
  startDate?: string | Date | null;
  targetDate?: string | Date | null;
  currentWeight?: number | null;
  weeklyAverages?: WeeklyPoint[];
};

type HoverSummary = {
  months: number;
  goalKg: number;
  actualKg: number | null;
  x: number;
  yGoal: number;
  yActual: number | null;
};

function weekLabel(months: number, totalMonths: number) {
  const totalWeeks = Math.max(1, Math.round((totalMonths * 52) / 12));
  const week = Math.min(totalWeeks, Math.max(1, Math.floor((months * 52) / 12) + 1));
  return `Week ${week} of ${totalWeeks} weeks`;
}

function interpolateActual(
  x: number,
  points: Array<{ x: number; y: number; weight: number }>
): { weight: number; y: number } | null {
  if (points.length === 0) return null;
  if (x <= points[0]!.x) {
    return x >= points[0]!.x - 18 ? { weight: points[0]!.weight, y: points[0]!.y } : null;
  }
  const last = points[points.length - 1]!;
  if (x >= last.x) {
    return x <= last.x + 18 ? { weight: last.weight, y: last.y } : null;
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (x > b.x) continue;
    const t = (x - a.x) / (b.x - a.x || 1);
    return {
      weight: a.weight + (b.weight - a.weight) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }
  return null;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function JourneyProjectionChart({
  startWeight,
  targetWeight,
  startDate,
  targetDate,
  currentWeight,
  weeklyAverages = [],
}: JourneyProjectionChartProps) {
  const uid = useId().replace(/:/g, "");
  const [projectionProgress, setProjectionProgress] = useState(0);
  const [progressProgress, setProgressProgress] = useState(0);
  const [showGoal, setShowGoal] = useState(false);
  const [hover, setHover] = useState<HoverSummary | null>(null);

  const start = parsePlanDate(startDate) ?? new Date();
  const target = parsePlanDate(targetDate);
  const { weightLoss, goalMonths, totalMonths, k } = getWeightLossCurveParams(
    startWeight,
    targetWeight,
    programHorizonMonths(start, target)
  );

  useEffect(() => {
    setProjectionProgress(0);
    setProgressProgress(0);
    setShowGoal(false);

    if (prefersReducedMotion()) {
      setProjectionProgress(1);
      setProgressProgress(1);
      setShowGoal(true);
      return;
    }

    let frame = 0;
    let timeout = 0;
    const duration = 1500;
    const started = performance.now();
    const tick = (now: number) => {
      const prog = Math.min((now - started) / duration, 1);
      setProjectionProgress(prog);
      if (prog < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      timeout = window.setTimeout(() => {
        setShowGoal(true);
        const progressStarted = performance.now();
        const follow = (later: number) => {
          const next = Math.min((later - progressStarted) / 800, 1);
          setProgressProgress(next);
          if (next < 1) frame = requestAnimationFrame(follow);
        };
        frame = requestAnimationFrame(follow);
      }, 180);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [startWeight, targetWeight, totalMonths]);

  if (!Number.isFinite(startWeight) || !Number.isFinite(targetWeight) || startWeight <= 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-2xl bg-white text-[#7e9a72]">
        <Scale className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">Set a target weight to sketch your program.</p>
      </div>
    );
  }

  const W = 1920;
  const H = 560;
  const padL = 28;
  const padR = 28;
  const padT = 24;
  const padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const scaleWeights = [
    startWeight,
    targetWeight,
    currentWeight ?? startWeight,
    ...weeklyAverages.map((row) => row.avgWeight),
  ];
  const minW = Math.min(...scaleWeights) - 3;
  const maxW = Math.max(...scaleWeights) + 4;
  const toY = (w: number) => padT + (1 - (w - minW) / (maxW - minW)) * plotH;
  const toX = (t: number) => padL + (t / totalMonths) * plotW;

  const drawnMonths = totalMonths * projectionProgress;
  const projectionPoints: { x: number; y: number }[] = [];
  const steps = 360;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * drawnMonths;
    projectionPoints.push({
      x: toX(t),
      y: toY(projectedWeightAt(startWeight, targetWeight, t, k)),
    });
  }

  const actualPoints = weeklyAverages
    .map((row) => {
      const at = parsePlanDate(row.week);
      if (!at) return null;
      return {
        x: toX(monthsFromStart(start, at, totalMonths)),
        y: toY(row.avgWeight),
        weight: row.avgWeight,
      };
    })
    .filter((point): point is { x: number; y: number; weight: number } => point != null)
    .sort((a, b) => a.x - b.x);

  if (currentWeight != null && actualPoints.length > 0) {
    const nowX = toX(monthsFromStart(start, new Date(), totalMonths));
    const last = actualPoints[actualPoints.length - 1]!;
    if (nowX - last.x > 8) {
      actualPoints.push({ x: nowX, y: toY(currentWeight), weight: currentWeight });
    }
  }

  const visibleActual = actualPoints.slice(0, Math.round(actualPoints.length * progressProgress));
  const linePath = smoothSvgPath(projectionPoints);
  const lastPt = projectionPoints[projectionPoints.length - 1] || { x: 0, y: toY(startWeight) };
  const actualPath = smoothSvgPath(visibleActual);
  const goalX = toX(goalMonths);
  const goalY = toY(targetWeight);
  const ticks = monthAxisTicks(totalMonths);

  const readHover = (event: MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    const x = Math.min(W - padR, Math.max(padL, local.x));
    const months = Math.min(totalMonths, Math.max(0, ((x - padL) / plotW) * totalMonths));
    const goalKg = projectedWeightAt(startWeight, targetWeight, months, k);
    const actual = interpolateActual(x, visibleActual);
    setHover({
      months,
      goalKg,
      actualKg: actual?.weight ?? null,
      x,
      yGoal: toY(goalKg),
      yActual: actual?.y ?? null,
    });
  };

  const tooltipLeft = hover ? Math.min(84, Math.max(16, (hover.x / W) * 100)) : 50;
  const tooltipBelow = hover ? hover.yGoal < H * 0.3 : false;
  const tooltipTop = hover
    ? Math.min(82, Math.max(6, (hover.yGoal / H) * 100 + (tooltipBelow ? 6 : -4)))
    : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <span className="font-serif text-3xl text-[#2c3628]">{startWeight.toFixed(1)}</span>
        <span className="text-lg text-[#7e9a72]">→</span>
        <span className="font-serif text-3xl text-[#5c7a52]">{targetWeight.toFixed(1)}</span>
        <span className="text-sm text-[#7e9a72]">kg</span>
      </div>
      <p className="mb-3 text-sm font-medium text-[#c17a58]">
        –{weightLoss.toFixed(1)} kg over {Math.round(goalMonths)} months
      </p>

      <div className="-mx-2 rounded-2xl border border-[#e6ebe3] bg-white p-1 sm:-mx-1 sm:p-2">
        <div className="relative" onMouseLeave={() => setHover(null)}>
          {hover ? (
            <div
              className={
                tooltipBelow
                  ? "pointer-events-none absolute z-10 w-44 -translate-x-1/2 rounded-xl border border-[#e6ebe3] bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm"
                  : "pointer-events-none absolute z-10 w-44 -translate-x-1/2 -translate-y-full rounded-xl border border-[#e6ebe3] bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm"
              }
              style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%` }}
            >
              <p className="text-[10px] font-medium tracking-wide text-[#7e9a72]">
                {weekLabel(hover.months, totalMonths)}
              </p>
              <p className="mt-1 font-serif text-lg leading-none text-[#2c3628]">
                {hover.goalKg.toFixed(1)}
                <span className="ml-1 text-xs font-sans text-[#7e9a72]">kg goal</span>
              </p>
              {hover.actualKg != null ? (
                <p className="mt-1.5 text-sm text-[#c17a58]">{hover.actualKg.toFixed(1)} kg logged</p>
              ) : (
                <p className="mt-1.5 text-xs text-[#7e9a72]">No weigh-in at this point</p>
              )}
            </div>
          ) : null}
          <svg
            className="block w-full"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="geometricPrecision"
            style={{ aspectRatio: `${W} / ${H}` }}
            xmlns="http://www.w3.org/2000/svg"
            onMouseMove={readHover}
            onMouseLeave={() => setHover(null)}
          >
          <defs>
            <linearGradient id={`journeyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5c7a52" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#5c7a52" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((m) => (
            <line
              key={`g${m}`}
              x1={toX(m)}
              y1={padT}
              x2={toX(m)}
              y2={H - padB}
              stroke="#f1f5f0"
              strokeWidth={3}
            />
          ))}
          <line
            x1={padL}
            y1={goalY}
            x2={W - padR}
            y2={goalY}
            stroke="#5c7a52"
            strokeWidth={3}
            strokeDasharray="10,8"
            opacity={0.45}
          />
          {projectionPoints.length > 1 ? (
            <path
              d={`${linePath} L${lastPt.x.toFixed(2)},${(H - padB).toFixed(2)} L${padL},${H - padB} Z`}
              fill={`url(#journeyGrad-${uid})`}
            />
          ) : null}
          <path
            d={linePath}
            fill="none"
            stroke="#5c7a52"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {visibleActual.length > 1 ? (
            <path
              d={actualPath}
              fill="none"
              stroke="#c17a58"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {visibleActual.map((point, i) => (
            <circle
              key={`p${i}`}
              cx={point.x}
              cy={point.y}
              r={i === visibleActual.length - 1 ? 11 : 8}
              fill="#c17a58"
              stroke="white"
              strokeWidth={2}
            />
          ))}
          <circle cx={toX(0)} cy={toY(startWeight)} r={11} fill="#2c3628" />
          {showGoal ? (
            <circle
              cx={goalX}
              cy={goalY}
              r={16}
              fill="#5c7a52"
              stroke="white"
              strokeWidth={4}
              style={{ transformOrigin: `${goalX}px ${goalY}px`, animation: "journeyGoalPop 0.3s ease" }}
            />
          ) : null}
          {ticks.map((m) => (
            <text
              key={`t${m}`}
              x={toX(m)}
              y={H - 18}
              textAnchor="middle"
              fontSize="28"
              fill="#7e9a72"
            >
              {m === 0 ? "Now" : `${Math.round(m)}mo`}
            </text>
          ))}
          {hover ? (
            <g pointerEvents="none">
              <line
                x1={hover.x}
                y1={padT}
                x2={hover.x}
                y2={H - padB}
                stroke="#5c7a52"
                strokeWidth={3}
                strokeDasharray="5,5"
                opacity={0.45}
              />
              <circle cx={hover.x} cy={hover.yGoal} r={12} fill="#5c7a52" stroke="white" strokeWidth={4} />
              {hover.yActual != null ? (
                <circle cx={hover.x} cy={hover.yActual} r={11} fill="#c17a58" stroke="white" strokeWidth={4} />
              ) : null}
            </g>
          ) : null}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="transparent"
            className="cursor-crosshair"
          />
        </svg>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-[#7e9a72]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-[#5c7a52]" />
          Goal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-[#c17a58]" />
          Your progress
        </span>
      </div>

      <style>{`
        @keyframes journeyGoalPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
