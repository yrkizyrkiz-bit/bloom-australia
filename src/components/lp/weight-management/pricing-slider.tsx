"use client";

import { useState } from "react";

import { CtaLink } from "./cta-link";
import { BASE_MONTHLY_PRICE, PLANS, formatAUD, quote } from "@/lib/pricing";

import "./pricing-slider.css";

/**
 * Sanative pricing slider from the attached package.
 * Drag the slider (or click a plan) to see the monthly price, per-day price,
 * saving and total for each plan length.
 */
export function PricingSlider({ defaultPlanIndex = 0 }: { defaultPlanIndex?: number }) {
  const [idx, setIdx] = useState(defaultPlanIndex);
  const q = quote(PLANS[idx], BASE_MONTHLY_PRICE);
  const hasDiscount = q.plan.discountPct > 0;
  const fill = (idx / (PLANS.length - 1)) * 100;

  return (
    <section id="pricing" className="wm-pricing bg-[#F4F1E9] px-6 py-20 text-[#1F2A1C]">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
            Pricing
          </p>
          <h2 className="font-serif text-4xl leading-tight md:text-5xl">
            Every plan, <em className="font-medium italic text-sage-deep">everything included.</em>
          </h2>
          <p className="text-lg text-[#4A5546]">
            Slide to choose your plan length. The longer you commit, the more you save.
          </p>
        </header>

        <div className="flex flex-col gap-7 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(31,42,28,.06),0_12px_32px_rgba(31,42,28,.08)] md:p-10">
          <div className="flex flex-col gap-5">
            <input
              type="range"
              min={0}
              max={PLANS.length - 1}
              step={1}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              aria-label="Plan length"
              aria-valuetext={`${q.plan.label}, ${formatAUD(q.monthly)} per month`}
              className="sanative-range h-2 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-3 focus-visible:outline-offset-[6px] focus-visible:outline-[#9DB884]"
              style={{
                background: `linear-gradient(to right, #3E5A34 0%, #3E5A34 ${fill}%, #E6E2D8 ${fill}%, #E6E2D8 100%)`,
              }}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLANS.map((p, i) => {
                const on = i === idx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIdx(i)}
                    aria-pressed={on}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2.5 transition-colors ${
                      on
                        ? "border-[#3E5A34] bg-[#EEF4E6] text-[#1F2A1C]"
                        : "border-[#E6E2D8] bg-white text-[#4A5546] hover:border-[#9DB884]"
                    }`}
                  >
                    <span className="text-[15px] font-semibold">{p.label}</span>
                    <span
                      className={`text-[13px] font-semibold ${p.discountPct ? "text-[#3E5A34]" : "text-[#6B7567]"}`}
                    >
                      {p.discountPct ? `Save ${p.discountPct}%` : "Flexible"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#E6E2D8]" />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-[#5B6657]">
                {q.plan.months === 1 ? "Monthly plan, cancel anytime" : `${q.plan.label} plan`}
              </p>
              <p className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-serif text-5xl leading-none md:text-6xl">
                  {formatAUD(q.monthly)}
                </span>
                <span className="text-lg text-[#5B6657]">/month</span>
                {hasDiscount && (
                  <span className="text-lg text-[#5B6657] line-through">
                    {formatAUD(BASE_MONTHLY_PRICE)}
                  </span>
                )}
              </p>
              <p className="text-[15px] text-[#5B6657]">{formatAUD(q.perDay)} per day</p>
            </div>
            {hasDiscount && (
              <p className="whitespace-nowrap rounded-full bg-[#E3EDD3] px-4 py-2.5 text-[15px] font-semibold text-[#2B3F24]">
                Save {q.plan.discountPct}% · {formatAUD(q.saving)} saved
              </p>
            )}
          </div>

          <div
            className="flex items-center justify-between gap-4 rounded-2xl bg-[#2B3F24] px-6 py-5 text-[#F4F1E9]"
            aria-live="polite"
          >
            <div className="flex flex-col gap-1">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C9DAB4]">
                Total
              </p>
              <p className="text-[15px] text-[#DCE6D0]">
                {q.plan.months === 1
                  ? "Billed monthly"
                  : `For ${q.plan.months} months (${q.plan.months} × ${formatAUD(q.monthly)})`}
              </p>
            </div>
            <p className="font-serif text-3xl leading-none text-white md:text-4xl">
              {formatAUD(q.total)}
            </p>
          </div>

          <CtaLink className="w-full" location="pricing-slider">
            Let&apos;s get you started
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
