"use client";

import Link from "next/link";
import { Activity, Flame, Pill, Scale, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calorieRingRatio,
  clampRatio,
  type RingDayScore,
  type RingWeekScore,
} from "@/lib/weight-management/score-ring-week";

const CALORIES = "#F97316";
const EXERCISE = "#0D9488";
const WEIGH_IN = "#059669";
const MEDS_DONE = "#F87171";

function capPoint(cx: number, cy: number, radius: number, ratio: number) {
  const angle = -Math.PI / 2 + Math.min(ratio, 1) * Math.PI * 2;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function mixHex(hex: string, toward: string, amount: number) {
  const parse = (value: string) => {
    const n = value.replace("#", "");
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(toward);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * amount);
  return `rgb(${mix(r1, r2)} ${mix(g1, g2)} ${mix(b1, b2)})`;
}

function DayRing({ day, size }: { day: RingDayScore; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.max(6, Math.round(size * 0.11));
  const gap = stroke + 1.5;
  const outer = size / 2 - stroke / 2 - 1;
  const jewelR = Math.max(3.5, outer - 3 * gap - stroke * 0.35);
  const layers = [
    {
      label: "Calories",
      ratio: calorieRingRatio(day),
      color: CALORIES,
      wrap: true,
    },
    {
      label: "Exercise",
      ratio: day.isFuture ? 0 : clampRatio(day.exercise, day.exerciseGoal, 2),
      color: EXERCISE,
      wrap: true,
    },
    {
      label: "Weigh-in",
      ratio: day.isFuture ? 0 : day.weight,
      color: WEIGH_IN,
      wrap: false,
    },
  ];
  const medsOn = !day.isFuture && day.meds >= 1;
  const wrapFilterId = `ring-wrap-${size}-${day.date}`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <filter id={wrapFilterId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0.4" dy={Math.max(1.6, stroke * 0.14)} stdDeviation={Math.max(1.4, stroke * 0.12)} floodColor="#111827" floodOpacity="0.5" />
          </filter>
        </defs>
        {layers.map((layer, index) => {
          const radius = outer - index * gap;
          const circumference = 2 * Math.PI * radius;
          const closed = Math.min(layer.ratio, 1);
          const overflow = layer.wrap ? Math.max(0, Math.min(layer.ratio - 1, 1)) : 0;
          const wrapArc = overflow > 0 ? Math.max(overflow, (stroke * 1.8) / circumference) : 0;
          const rotate = `rotate(-90 ${cx} ${cy})`;
          return (
            <g key={layer.label}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={layer.color}
                strokeOpacity={day.isFuture ? 0.18 : 0.22}
                strokeWidth={stroke}
              />
              {closed >= 0.999 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={wrapArc > 0 ? mixHex(layer.color, "#000000", 0.22) : layer.color}
                  strokeWidth={stroke}
                />
              ) : closed > 0 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={layer.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${closed * circumference} ${circumference}`}
                  transform={rotate}
                />
              ) : null}
              {wrapArc > 0 ? (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke="#111827"
                    strokeOpacity="0.3"
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={`${wrapArc * circumference} ${circumference}`}
                    transform={`translate(${Math.max(1, stroke * 0.08)} ${Math.max(1.4, stroke * 0.12)}) ${rotate}`}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={mixHex(layer.color, "#ffffff", 0.42)}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={`${wrapArc * circumference} ${circumference}`}
                    transform={rotate}
                  />
                  <circle
                    cx={capPoint(cx, cy, radius, wrapArc).x}
                    cy={capPoint(cx, cy, radius, wrapArc).y}
                    r={stroke / 2}
                    fill={mixHex(layer.color, "#ffffff", 0.42)}
                    filter={`url(#${wrapFilterId})`}
                  />
                </g>
              ) : null}
            </g>
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={jewelR}
          fill={medsOn ? MEDS_DONE : "white"}
          stroke={medsOn ? MEDS_DONE : day.medsDue ? CALORIES : WEIGH_IN}
          strokeWidth={medsOn ? 0 : 1.5}
          strokeOpacity={0.45}
        />
      </svg>
      <p className={`text-xs ${day.isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        {day.day}
      </p>
    </div>
  );
}

function mealHint(day: RingDayScore) {
  if (day.calories <= 0) return "Log a meal";
  if (day.caloriesOver) return "Log a meal - exceeded daily calories";
  return "Log a meal - on track";
}

function exerciseHint(day: RingDayScore) {
  if (day.exerciseGoal > 0 && day.exercise >= day.exerciseGoal) {
    return "Log activity - on track well done";
  }
  return "Log activity";
}

function weighInCopy(logged: boolean) {
  return logged
    ? { value: "Well done", hint: "Logged" }
    : { value: "Due", hint: "Log your weight and waist" };
}

function medsCopy(logged: boolean, due: boolean) {
  if (logged) return { value: "Well done", hint: "Logged" };
  if (due) return { value: "Due", hint: " " };
  return { value: "Not due", hint: " " };
}

function WeekStatCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  gradient,
  tone,
  swatchColor,
  valueClassName,
  locked,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
  tone: "light" | "dark";
  swatchColor: string;
  valueClassName?: string;
  locked?: boolean;
}) {
  const dark = tone === "dark";
  const className = cn(
    "group relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-br px-3 py-2.5",
    !locked && "transition-transform duration-300 md:hover:scale-[1.02]",
    gradient
  );
  const body = (
    <>
      {dark ? (
        <div className="pointer-events-none absolute top-1 right-1 h-8 w-8 rounded-full bg-white/10 blur-md" />
      ) : null}
      <div className="relative z-10 flex h-7 shrink-0 items-center justify-between gap-2">
        <p className={cn("truncate text-xs leading-4", dark ? "text-[#cdd8c6]" : "text-[#5c7a52]")}>{label}</p>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: swatchColor }}
          aria-hidden
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </div>
      <p
        className={cn(
          "relative z-10 mt-1 h-6 shrink-0 truncate text-sm font-medium leading-6",
          dark ? "text-white" : "text-[#2c3628]",
          valueClassName
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "relative z-10 mt-auto h-8 shrink-0 text-[11px] leading-4",
          dark ? "text-[#a8bb9e]" : "text-[#5c7a52]"
        )}
      >
        <span className="line-clamp-2">{hint || "\u00a0"}</span>
      </p>
    </>
  );
  if (locked) {
    return <div className={className}>{body}</div>;
  }
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

export function GoalRings({ week }: { week: RingWeekScore }) {
  const days = week.days ?? [];
  const today = days.find((day) => day.isToday) ?? days[0];
  if (!today) return null;
  const locked = Boolean(week.locked);
  const weighIn = weighInCopy(Boolean(today.weight));
  const meds = medsCopy(Boolean(today.meds), Boolean(today.medsDue));

  return (
    <div className="rounded-2xl border border-[#cdd8c6] bg-[#f8f4ec] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#2c3628]">This week</p>
          <p className="text-xs text-muted-foreground">
            {week.dailyCalorieGoal} kcal · {week.dailyExerciseMin} min
            {week.weeklyTargetLoss != null ? ` · ${week.weeklyTargetLoss} kg weekly target` : ""}
          </p>
          {locked ? (
            <p className="mt-1 text-xs text-[#7e9a72]">
              Rings stay grey until your doctor approves your program.
            </p>
          ) : null}
        </div>
      </div>
      <div className={cn(locked && "pointer-events-none select-none grayscale")}>
        <div className="flex items-end justify-between gap-2 overflow-x-auto pb-1">
          {days.map((day) => (
            <DayRing key={day.date} day={day} size={day.isToday ? 88 : 68} />
          ))}
        </div>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DayRing day={today} size={168} />
          <div className="grid h-[15.5rem] w-full min-w-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
            <WeekStatCard
              href="/dashboard/weight-management/meals"
              label="Calories"
              value={`${today.calories}/${today.calorieGoal}`}
              hint={mealHint(today)}
              icon={Flame}
              gradient="from-[#f0e8d8] to-[#e5d7bf]"
              tone="light"
              swatchColor={CALORIES}
              locked={locked}
            />
            <WeekStatCard
              href="/dashboard/weight-management/exercise"
              label="Exercise"
              value={`${today.exercise}/${today.exerciseGoal} min`}
              hint={exerciseHint(today)}
              icon={Activity}
              gradient="from-[#e6ebe3] to-[#cdd8c6]"
              tone="light"
              swatchColor={EXERCISE}
              locked={locked}
            />
            <WeekStatCard
              href="/dashboard/weight-management/track"
              label="Weigh-in"
              value={weighIn.value}
              hint={weighIn.hint}
              icon={Scale}
              gradient="from-[#cdd8c6] to-[#a8bb9e]"
              tone="light"
              swatchColor={WEIGH_IN}
              valueClassName={weighIn.value === "Well done" ? "text-[#d8d6d2]" : undefined}
              locked={locked}
            />
            <WeekStatCard
              href="/dashboard/weight-management/treatment"
              label="Meds"
              value={meds.value}
              hint={meds.hint}
              icon={Pill}
              gradient="from-[#4a6243] to-[#3d4f38]"
              tone="dark"
              swatchColor={MEDS_DONE}
              locked={locked}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
