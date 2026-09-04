"use client";

import {
  Apple,
  Beaker,
  Check,
  Circle,
  Dumbbell,
  Heart,
  MapPin,
  Moon,
  Pill,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_BG = "#F7FBF9";
const CARD_BG = "#E8F4F0";
const TEAL = "#6B9B8A";
const TEAL_DARK = "#2D5F54";
const CHARCOAL = "#1C1C1C";
const MUTED = "#5A6561";

const FLOAT_SHADOW = "0 14px 40px rgba(28, 60, 52, 0.1)";

const JOURNEY_STEPS = [
  {
    number: "1",
    title: "Quick health check",
    detail: "A short assessment is all it takes to get your membership and begin.",
    visual: "panel" as const,
  },
  {
    number: "2",
    title: "Doctor Consultation",
    detail:
      "For one telehealth consult with an AHPRA-registered doctor, plus pathology organised near you.",
    visual: "appointment" as const,
  },
  {
    number: "3",
    title: "Get your Biomarker Results",
    detail:
      "Clear results appear in the app with insight, monitor health changes over time.",
    visual: "results" as const,
  },
  {
    number: "4",
    title: "Unlock your Health action plan",
    detail: "With a doctor-developed program based on your results.",
    visual: "plan" as const,
  },
] as const;

function StepNumber({ number }: { number: string }) {
  return (
    <div className="mx-auto mb-6 flex h-9 w-9 items-center justify-center rounded-full border border-[#A8C9BE] bg-transparent text-[13px] font-medium text-[#3D6B5C]">
      {number}
    </div>
  );
}

function AppointmentVisual() {
  return (
    <div className="px-3 pb-5 pt-1">
      <div
        className="relative flex h-[9.5rem] w-full items-center rounded-2xl bg-white px-5 py-5"
        style={{ boxShadow: FLOAT_SHADOW }}
      >
        <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#6B9B8A]">
          <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex w-full items-center gap-4 pr-6">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2D5F54]">
            <MapPin className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-base font-semibold leading-tight text-[#1C1C1C]">
              Appointment confirmed
            </p>
            <p className="mt-1 text-sm text-[#5A6561]">Doctor consult + blood tests</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsVisual() {
  return (
    <div className="px-3 pb-5 pt-1">
      <div
        className="relative h-[9.5rem] w-full overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: FLOAT_SHADOW }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/biomarker-results-card.webp"
          alt="Sanative app showing health score, biological age, and biomarker results"
          className="h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

function PlanVisual() {
  const cards = [
    { label: "Habits", icon: Circle, x: "6%", y: 12, scale: 0.78, z: 1, h: 108 },
    { label: "Exercise", icon: Dumbbell, x: "22%", y: 6, scale: 0.86, z: 2, h: 118 },
    { label: "Care plan", icon: Pill, x: "50%", y: 0, scale: 1, z: 10, h: 140, featured: true },
    { label: "Nutrition", icon: Apple, x: "78%", y: 6, scale: 0.86, z: 2, h: 118 },
    { label: "Sleep", icon: Moon, x: "94%", y: 12, scale: 0.78, z: 1, h: 108 },
  ];

  return (
    <div className="px-3 pb-5 pt-1">
      <div className="relative mx-auto flex h-[9.5rem] w-full max-w-[15rem] items-end justify-center">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="absolute bottom-0 w-[4.5rem] rounded-[1.1rem] border border-[#E4EEEA] bg-white px-2 py-3 text-center"
              style={{
                left: card.x,
                zIndex: card.z,
                height: card.h,
                transform: `translateX(-50%) translateY(${card.y}px) scale(${card.scale})`,
                boxShadow: FLOAT_SHADOW,
              }}
            >
              {card.featured ? (
                <Sparkles className="mx-auto mb-1.5 h-3.5 w-3.5 text-[#1C1C1C]" strokeWidth={2} />
              ) : (
                <div className="mb-1.5 h-3.5" />
              )}
              <div
                className={`mx-auto mb-2 flex items-center justify-center rounded-2xl bg-[#F0F7F4] ${
                  card.featured ? "h-12 w-12" : "h-9 w-9"
                }`}
              >
                {card.featured ? (
                  <div className="flex items-center gap-0.5">
                    <Pill className="h-4 w-4 text-[#1C1C1C]" />
                    <Beaker className="h-3.5 w-3.5 text-[#1C1C1C]" />
                  </div>
                ) : (
                  <Icon className="h-4 w-4 text-[#1C1C1C]" strokeWidth={2} />
                )}
              </div>
              <p className="text-[10px] font-semibold text-[#1C1C1C]">{card.label}</p>
              {card.featured && (
                <p className="mt-1 text-[8px] leading-tight text-[#5A6561]">by your doctor</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelVisual() {
  return (
    <div className="px-3 pb-5 pt-1">
      <div
        className="flex h-[9.5rem] w-full items-center rounded-2xl bg-white px-4 py-4"
        style={{ boxShadow: FLOAT_SHADOW }}
      >
        <div className="w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F0F7F4]">
              <Beaker className="h-6 w-6 text-[#2D5F54]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[15px] font-semibold text-[#1C1C1C]">Essential Panel</p>
              <p className="text-[12px] text-[#5A6561]">Heart, liver, kidney, thyroid & metabolic</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#EEF4F1] pt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[#5A6561]">
              <Heart className="h-3.5 w-3.5 text-[#6B9B8A]" />
              <span>At checkout</span>
            </div>
            <span className="rounded-full bg-[#6B9B8A] px-3 py-1 text-[10px] font-semibold text-white">
              Book now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual({ type }: { type: (typeof JOURNEY_STEPS)[number]["visual"] }) {
  switch (type) {
    case "appointment":
      return <AppointmentVisual />;
    case "results":
      return <ResultsVisual />;
    case "plan":
      return <PlanVisual />;
    case "panel":
      return <PanelVisual />;
  }
}

type WomensHealthInsightsJourneyProps = {
  firstName?: string;
  categoryLabel?: string;
  isUnsure?: boolean;
  className?: string;
};

export function WomensHealthInsightsJourney({
  firstName,
  categoryLabel,
  isUnsure,
  className,
}: WomensHealthInsightsJourneyProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] px-4 py-8 sm:px-8 sm:py-10 lg:px-10",
        className
      )}
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
        <h1 className="text-[1.85rem] font-semibold leading-[1.2] tracking-tight sm:text-4xl lg:text-[2.65rem] text-[#1C1C1C]">
          {firstName ? (
            <>
              {firstName}, let&apos;s get some{" "}
              <span style={{ color: TEAL }}>real insight</span> into what is happening
              inside your body in four simple steps
            </>
          ) : (
            <>
              Let&apos;s get some <span style={{ color: TEAL }}>real insight</span> into
              what is happening inside your body in four simple steps
            </>
          )}
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed sm:text-[15px]" style={{ color: MUTED }}>
          {isUnsure
            ? "You don't need to diagnose yourself, testing and doctor review give you a clear picture of your health."
            : `For your ${categoryLabel?.toLowerCase() ?? "women's health"} goals, biomarkers turn symptoms into measurable insight your doctor can act on.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-4">
        {JOURNEY_STEPS.map((step) => (
          <article
            key={step.number}
            className="flex w-full flex-col overflow-hidden rounded-[1.75rem] lg:min-h-[27rem]"
            style={{ backgroundColor: CARD_BG }}
          >
            <div className="px-5 pb-4 pt-7 text-center sm:px-6 sm:pt-8">
              <StepNumber number={step.number} />
              <h2
                className="mb-3 text-[1.05rem] font-bold leading-snug sm:text-[1.1rem]"
                style={{ color: CHARCOAL }}
              >
                {step.title}
              </h2>
              <p className="text-[13px] leading-relaxed sm:text-sm" style={{ color: MUTED }}>
                {step.detail}
              </p>
            </div>

            <div className="mt-auto">
              <StepVisual type={step.visual} />
            </div>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed" style={{ color: TEAL }}>
        Symptom-based indicators only, not a diagnosis. All care decisions are made by
        AHPRA-registered Australian doctors.
      </p>
    </div>
  );
}
