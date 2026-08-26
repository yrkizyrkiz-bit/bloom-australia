"use client";

import {
  Apple,
  ArrowUp,
  Check,
  Clock,
  Heart,
  Moon,
} from "lucide-react";

/** Illustrative product UI mocks for the Labs Action Plan marketing page. */

export function ResultsPhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-b from-sky-200/80 via-sky-100/40 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/20 bg-gradient-to-b from-[#1e2a24] via-[#243530] to-[#15201c] shadow-2xl shadow-[#1a2218]/40 aspect-[9/16]">
        <div className="absolute inset-x-0 top-0 h-8 bg-black/20" />
        <div className="px-5 pt-10 pb-6 h-full flex flex-col">
          <p className="text-[13px] leading-snug text-white/90">
            Hey Alex, all of your results are in. There&apos;s room for improvement, so let&apos;s dig in.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#5c9a8a"
                  strokeWidth="12"
                  strokeDasharray={`${66 * 3.016} ${100 * 3.016}`}
                  strokeLinecap="butt"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#e8c96a"
                  strokeWidth="12"
                  strokeDasharray={`${3 * 3.016} ${100 * 3.016}`}
                  strokeDashoffset={`${-(66 * 3.016)}`}
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#d4788a"
                  strokeWidth="12"
                  strokeDasharray={`${6 * 3.016} ${100 * 3.016}`}
                  strokeDashoffset={`${-((66 + 3) * 3.016)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-white/50 leading-none">All</span>
                <span className="text-lg font-semibold text-white leading-none mt-0.5">85+</span>
                <span className="text-[10px] text-white/50 leading-none mt-0.5">markers</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5c9a8a]" />
                <span className="text-white/70">Optimal</span>
                <span className="ml-auto font-semibold text-[#5c9a8a]">66</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e8c96a]" />
                <span className="text-white/70">In range</span>
                <span className="ml-auto font-semibold text-[#e8c96a]">8</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4788a]" />
                <span className="text-white/70">Out of range</span>
                <span className="ml-auto font-semibold text-[#d4788a]">6</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-3 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5c7a52] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                SC
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">
                  Your <span className="font-semibold">Action Plan</span> is ready.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5c9a8a]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
            </div>

            <div className="mt-4 flex justify-around text-[10px] text-white/40">
              {["Home", "Chat", "Plans", "Labs"].map((label, i) => (
                <div key={label} className={`flex flex-col items-center gap-1 ${i === 3 ? "text-[#5c9a8a]" : ""}`}>
                  <div className={`w-5 h-5 rounded-md ${i === 3 ? "bg-[#5c9a8a]/30" : "bg-white/10"}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[#7e9a72]">For illustrative purposes only.</p>
    </div>
  );
}

export function NeedsAttentionMock() {
  const items = [
    { area: "Metabolic Health", detail: "HbA1c out of range" },
    { area: "Nutrients", detail: "Vitamin B12 out of range" },
    { area: "Thyroid Health", detail: "Thyroid-stimulating hormone out of range" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#1e2a24] to-[#15201c]" />
      <div className="relative p-6 sm:p-8">
        <div className="rounded-2xl bg-white shadow-xl p-5">
          <span className="inline-flex px-2.5 py-1 rounded-md bg-[#d4788a] text-white text-xs font-medium">
            Needs attention
          </span>
          <ul className="mt-4 divide-y divide-[#eef1ec]">
            {items.map((item) => (
              <li key={item.area} className="py-3.5 first:pt-2 last:pb-1">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#d4788a] shrink-0" />
                  <div>
                    <p className="font-semibold text-[#1a2218]">{item.area}</p>
                    <p className="text-sm text-[#d4788a] mt-0.5">{item.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-center text-xs text-white/50">For illustrative purposes only.</p>
      </div>
    </div>
  );
}

export function GuidanceMock() {
  const actions = [
    { icon: Apple, title: "Nutrition", detail: "Eat selenium-rich foods like beans, eggs, and nuts" },
    { icon: Heart, title: "Exercise", detail: "Get 150 minutes of moderate cardio weekly", done: true },
    { icon: Moon, title: "Sleep", detail: "Aim for 7–9 hours of sleep a night" },
    { icon: Clock, title: "Habits", detail: "Manage stress through yoga, mindfulness, or walks" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#1e2a24] to-[#15201c]" />
      <div className="relative p-6 sm:p-8">
        <div className="rounded-2xl bg-white shadow-xl p-5 overflow-hidden">
          <h3 className="text-lg font-semibold text-[#1a2218]">Improve thyroid function</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4788a]" />
            <span className="text-sm text-[#d4788a]">Thyroid-stimulating hormone</span>
          </div>
          <ul className="mt-5 space-y-1">
            {actions.map(({ icon: Icon, title, detail, done }) => (
              <li
                key={title}
                className={`relative flex items-start gap-3 rounded-xl px-2 py-2.5 ${done ? "bg-[#f4f7f2]" : ""}`}
              >
                {done && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-8 rounded-full bg-[#5c7a52] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                )}
                <div className={`w-9 h-9 rounded-full bg-[#f4f7f2] flex items-center justify-center shrink-0 ${done ? "ml-3" : ""}`}>
                  <Icon className="w-4 h-4 text-[#1a2218]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1a2218] text-sm">{title}</p>
                  <p className="text-xs text-[#5c5c5c] mt-0.5 leading-snug">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-center text-xs text-white/50">For illustrative purposes only.</p>
      </div>
    </div>
  );
}

export function TreatmentMock() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-[#34412f]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ongoing-support.webp"
          alt="Sanative doctor reviewing member care"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2218]/70 via-transparent to-transparent" />

        <div className="absolute right-3 top-[18%] w-[58%] space-y-3">
          <div className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 p-3 text-white shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Metabolism</span>
              <span className="px-2 py-0.5 rounded-full bg-[#d4788a] text-[10px] font-medium">
                Needs attention
              </span>
            </div>
            <div className="mt-3 relative h-2 rounded-full bg-gradient-to-r from-[#5c9a8a] via-[#e8c96a] to-[#d4788a]">
              <span className="absolute top-1/2 right-[8%] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#1a2218] shadow" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 p-3 text-white shadow-lg">
            <div className="h-16 rounded-xl bg-[#f4f7f2]/15 flex items-center justify-center mb-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/supplements-pills.webp"
                alt=""
                className="h-14 w-auto object-contain opacity-95"
              />
            </div>
            <p className="text-xs leading-snug font-medium">
              You may be a candidate for treatment to improve your HbA1c
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[#7e9a72]">For illustrative purposes only.</p>
    </div>
  );
}

export function ProgressMock() {
  const points = [
    { x: 18, y: 28 },
    { x: 38, y: 22 },
    { x: 58, y: 30 },
    { x: 82, y: 58 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#1e2a24] to-[#15201c]" />
      <div className="relative p-6 sm:p-8">
        <div className="rounded-2xl bg-white shadow-xl p-5">
          <p className="text-xs text-[#8a8a8a]">As of today</p>
          <h3 className="text-lg font-semibold text-[#1a2218] mt-0.5">Hemoglobin A1c</h3>

          <div className="mt-4 flex gap-3">
            <div className="flex flex-col justify-between py-1 text-[10px] w-16 shrink-0">
              <span className="text-[#d4788a] leading-tight">Above range</span>
              <span className="text-[#5c7a52] font-medium">Optimal</span>
              <span className="text-[#d4788a] leading-tight">Below range</span>
            </div>
            <div className="flex-1 relative h-40 rounded-xl overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[38%] bg-[#f8e8ec]" />
              <div className="absolute inset-x-0 top-[38%] h-[28%] bg-[#e8f2ea]" />
              <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[#f8e8ec]" />
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full overflow-hidden">
                <div className="h-[38%] bg-[#d4788a]" />
                <div className="h-[28%] bg-[#5c7a52]" />
                <div className="h-[34%] bg-[#d4788a]" />
              </div>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#c5c5c5"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                />
                {points.slice(0, 3).map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="#d4788a" />
                ))}
                <line x1={points[3].x} y1="5" x2={points[3].x} y2="95" stroke="#1a2218" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx={points[3].x} cy={points[3].y} r="5" fill="#5c7a52" opacity="0.25" />
                <circle cx={points[3].x} cy={points[3].y} r="3" fill="#5c7a52" />
              </svg>
            </div>
          </div>

          <div className="mt-2 flex justify-between text-xs pl-[4.5rem]">
            <span className="text-[#8a8a8a]">Prior results</span>
            <span className="font-semibold text-[#1a2218]">Current result</span>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-white/50">For illustrative purposes only.</p>
      </div>
    </div>
  );
}

export function ChatMock() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-3xl bg-[#f4f7f2] border border-[#e6ebe3] shadow-xl overflow-hidden aspect-[9/14] flex flex-col">
        <div className="pt-5 pb-3 flex justify-center">
          <span className="font-serif text-xl text-[#34412f]">S</span>
        </div>

        <div className="flex-1 px-4 space-y-4 overflow-hidden">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#34412f] text-white px-3.5 py-2.5 text-sm leading-snug">
              What are the best ways to improve my B12?
              <p className="text-[10px] text-white/50 mt-1">10:04 AM</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white shadow-sm px-3.5 py-2.5 text-sm leading-snug text-[#1a2218]">
              Good question. Start by eating more lean protein or fortified foods like cereals and nutritional yeast.
              <p className="text-[10px] text-[#8a8a8a] mt-1">11:21 AM</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-full bg-white shadow-sm px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8bb9e] animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8bb9e] animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8bb9e] animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 rounded-full bg-white border border-[#e6ebe3] pl-4 pr-1.5 py-1.5 shadow-sm">
            <span className="flex-1 text-sm text-[#a0a0a0]">Ask me anything...</span>
            <span className="w-9 h-9 rounded-full bg-[#5c7a52] flex items-center justify-center">
              <ArrowUp className="w-4 h-4 text-white" />
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[#7e9a72]">For illustrative purposes only.</p>
    </div>
  );
}

export function ProgressProgramsMock() {
  const programs = [
    { label: "Heart Health", tone: "bg-[#7eb8c9]" },
    { label: "Hair Health", tone: "bg-[#8fbfa3]" },
    { label: "Organ Care", tone: "bg-[#5c7a52]", active: true },
    { label: "Weight Management", tone: "bg-[#6a8fad]" },
    { label: "Women's Health", tone: "bg-[#c49a72]" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="relative rounded-[2rem] overflow-hidden aspect-[3/5] bg-[#1a2218]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/remote/unsplash/photo-1506905925346-21bda4d32df4.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1612] via-[#0f1612]/50 to-transparent" />

        <div className="absolute inset-x-0 top-[28%] flex items-end justify-center gap-2 px-3">
          {programs.map((p) => (
            <div
              key={p.label}
              className={`flex flex-col items-center transition-transform ${p.active ? "scale-110 -translate-y-2" : "opacity-80"}`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${p.tone} shadow-lg flex items-center justify-center ${
                  p.active ? "ring-2 ring-[#a8bb9e] ring-offset-2 ring-offset-transparent" : ""
                }`}
              >
                <span className="font-serif text-white text-lg">S</span>
              </div>
              {p.active && (
                <p className="mt-2 text-[11px] text-white font-medium text-center whitespace-nowrap">
                  Organ Care
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 inset-x-8">
          <div className="h-px bg-[#5c9a8a]/60 relative">
            <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 rounded-full bg-[#5c9a8a] shadow-[0_0_12px_#5c9a8a]" />
          </div>
        </div>
      </div>
    </div>
  );
}
