"use client";

import { useEffect, useRef, useState } from "react";
import { Stethoscope } from "lucide-react";
import { ConsentNotice } from "@/components/legal/ConsentNotice";
import { lpWmWeightLossCurveParams } from "@/lib/lp/weight-management-funnel";

const CLINICAL_COPY =
  "People enter Sanative with different health profiles, goals and medical histories. Your doctor will review your assessment and discuss what is clinically appropriate for you.";

type GraphSvgProps = {
  currentWeight: number;
  targetWeight: number;
  animated?: boolean;
  gradientId: string;
};

function GraphSvg({ currentWeight, targetWeight, animated = false, gradientId }: GraphSvgProps) {
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const [showGoal, setShowGoal] = useState(!animated);
  const { goalMonths, totalMonths, k } = lpWmWeightLossCurveParams(currentWeight, targetWeight);

  useEffect(() => {
    if (!animated) return;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const prog = Math.min(elapsed / duration, 1);
      setAnimationProgress(prog);
      if (prog < 1) requestAnimationFrame(animate);
      else setTimeout(() => setShowGoal(true), 200);
    };
    requestAnimationFrame(animate);
  }, [animated]);

  const W = 390;
  const H = 140;
  const minW = targetWeight - 3;
  const maxW = currentWeight + 4;
  const toY = (w: number) => H - ((w - minW) / (maxW - minW)) * H * 0.85 - H * 0.04;
  const toX = (t: number) => (t / totalMonths) * W;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * totalMonths * animationProgress;
    const w = targetWeight + (currentWeight - targetWeight) * Math.exp(-k * t);
    points.push({ x: toX(t), y: toY(w) });
  }

  const toPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C${cpx.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${cpx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return d;
  };

  const goalX = toX(goalMonths);
  const goalY = toY(targetWeight);
  const linePath = toPath(points);
  const lastPt = points[points.length - 1] || { x: 0, y: toY(currentWeight) };

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c7a52" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#5c7a52" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 3, 6].map(
        (m) =>
          m <= totalMonths && (
            <line
              key={m}
              x1={toX(m)}
              y1={0}
              x2={toX(m)}
              y2={H}
              stroke="#f1f5f0"
              strokeWidth={1}
            />
          )
      )}
      <line
        x1={0}
        y1={goalY}
        x2={W}
        y2={goalY}
        stroke="#5c7a52"
        strokeWidth={1}
        strokeDasharray="4,3"
        opacity={0.5}
      />
      {points.length > 1 && (
        <path d={linePath + ` L${lastPt.x},${H} L0,${H} Z`} fill={`url(#${gradientId})`} />
      )}
      <path d={linePath} fill="none" stroke="#5c7a52" strokeWidth="3" strokeLinecap="round" />
      <circle cx={0} cy={toY(currentWeight)} r={5} fill="#2c3628" />
      {showGoal && (
        <circle cx={goalX} cy={goalY} r={8} fill="#5c7a52" stroke="white" strokeWidth={3} />
      )}
      {[0, 3, 6].map(
        (m) =>
          m <= totalMonths && (
            <text
              key={`t${m}`}
              x={toX(m)}
              y={H - 5}
              textAnchor="middle"
              fontSize="10"
              fill="#7e9a72"
            >
              {m === 0 ? "Now" : `${m}mo`}
            </text>
          )
      )}
    </svg>
  );
}

type Props = {
  currentWeight: number;
  targetWeight: number;
  firstName?: string;
  email?: string;
  revealed?: boolean;
  saving?: boolean;
  error?: string | null;
  onUnlock: (email: string) => Promise<void>;
  onContinue: () => void;
};

export function LpWmProjectionGraph({
  currentWeight,
  targetWeight,
  firstName,
  email = "",
  revealed = false,
  saving = false,
  error = null,
  onUnlock,
  onContinue,
}: Props) {
  const [draftEmail, setDraftEmail] = useState(email);
  const emailRef = useRef<HTMLInputElement>(null);
  const { weightLoss, goalMonths } = lpWmWeightLossCurveParams(currentWeight, targetWeight);
  const greeting = firstName ? `${firstName}, let's` : "Let's";
  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim());

  useEffect(() => {
    if (revealed) return;
    const input = emailRef.current;
    if (!input) return;
    const frame = window.requestAnimationFrame(() => {
      input.focus();
      input.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [revealed]);

  if (!revealed) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#e6ebe3] bg-[#fdfbf7]">
        <div className="relative overflow-hidden px-4 pt-5" aria-hidden="true">
          <div className="select-none" style={{ filter: "blur(8px)", transform: "scale(1.04)" }}>
            <p className="text-xs text-[#7e9a72]">Your weight</p>
            <p className="font-serif text-4xl leading-none text-[#2c3628]">
              {currentWeight} <span className="text-lg font-medium">kg</span>
            </p>
            <p className="mt-1 text-lg font-bold text-[#5c7a52]">↓ {weightLoss.toFixed(1)} kg</p>
            <div className="mt-2">
              <GraphSvg
                currentWeight={currentWeight}
                targetWeight={targetWeight}
                gradientId="lpWmGraphGateGrad"
              />
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(253,251,247,0.15) 0%, rgba(253,251,247,0.92) 72%, rgba(253,251,247,1) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 space-y-3 bg-white px-5 pb-5 pt-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-[#5c7a52] px-3 py-1.5 text-xs font-semibold text-white">
              Intro offer for new members
            </div>
          </div>
          <h3 className="text-center font-serif text-xl leading-snug text-[#2c3628]">
            Let&apos;s see what goal we can aim for
          </h3>
          <p className="text-center text-sm leading-relaxed text-[#7e9a72]">
            Enter your email to view your projected results.
          </p>
          <input
            ref={emailRef}
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="Email address"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && emailReady && !saving) {
                e.preventDefault();
                void onUnlock(draftEmail.trim().toLowerCase());
              }
            }}
            className="w-full rounded-xl border border-[#cdd8c6] bg-white px-4 py-3.5 text-base outline-none transition-all focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
          />
          <button
            type="button"
            disabled={!emailReady || saving}
            onClick={() => void onUnlock(draftEmail.trim().toLowerCase())}
            className="flex w-full items-center justify-center rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] disabled:opacity-50"
          >
            {saving ? "Saving…" : "View results"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <ConsentNotice variant="contact" className="text-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-[#2c3628]">
          {greeting} start your program with this goal
        </p>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-serif text-4xl text-[#2c3628]">{currentWeight}</span>
          <span className="text-xl text-[#7e9a72]">→</span>
          <span className="font-serif text-4xl text-[#5c7a52]">{Math.round(targetWeight)}</span>
          <span className="text-base text-[#7e9a72]">kg</span>
        </div>
        <p className="mt-0.5 text-base font-medium text-[#c17a58]">
          –{weightLoss.toFixed(1)} kg in {goalMonths} months
        </p>
      </div>

      <div className="rounded-2xl border border-[#e6ebe3] bg-white p-3">
        <GraphSvg
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          animated
          gradientId="lpWmGraphRevealGrad"
        />
      </div>

      <div className="rounded-2xl bg-[#f4f7f2] p-3.5">
        <p className="mb-2 text-sm font-semibold text-[#2c3628]">What happens next</p>
        <p className="mb-3 text-xs leading-relaxed text-[#5c7a52] sm:text-sm">{CLINICAL_COPY}</p>
        <div className="flex items-start gap-2.5">
          <Stethoscope className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
          <div>
            <p className="text-xs font-semibold text-[#2c3628] sm:text-sm">
              Doctor-led care plan review
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#7e9a72] sm:text-sm">
              Your doctor will review your health profile and discuss suitable care options
              privately if clinically appropriate, alongside lifestyle guidance to support your
              goals.
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#7e9a72] sm:text-xs">
          Individual results vary and are not guaranteed.
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="flex w-full items-center justify-center rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27]"
      >
        Continue
      </button>
    </div>
  );
}
