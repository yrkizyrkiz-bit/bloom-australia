"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import marqueeStyles from "@/components/promo/sections/MembershipPricingCard.module.css";
import { FUNNEL_PATH, HOW_IT_WORKS_STEPS, PRICING } from "@/lib/lp/weight-management";

const MARQUEE = [
  {
    src: "/images/membership/mens-marquee/in-app-white.webp",
    alt: "Sanative app on two phones showing meals, weight tracking and care team",
    variant: "phone" as const,
  },
  {
    src: "/images/membership/mens-marquee/biomarker-vial.webp",
    alt: "Sanative biomarker blood test vial with metabolic markers",
    variant: "wide" as const,
  },
  {
    src: "/images/membership/mens-marquee/organ-dashboard.webp",
    alt: "Sanative organ and metabolic health dashboard",
    variant: "wide" as const,
  },
  {
    src: "/images/membership/mens-marquee/app-insights.webp",
    alt: "Sanative app showing health score and biomarker insights",
    variant: "wide" as const,
  },
] as const;

function ImageMarquee() {
  const loop = [...MARQUEE, ...MARQUEE];
  return (
    <div className={marqueeStyles.viewport} aria-hidden>
      <div className={marqueeStyles.track}>
        {loop.map((item, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- CSS marquee needs plain imgs
          <img
            key={`${item.src}-${index}`}
            src={item.src}
            alt=""
            className={
              item.variant === "phone"
                ? "h-40 w-40 sm:h-48 sm:w-48 lg:h-52 lg:w-56 shrink-0 rounded-xl object-cover object-[42%_70%] bg-white"
                : "h-40 w-48 sm:h-48 sm:w-64 lg:h-52 lg:w-72 shrink-0 rounded-xl object-cover"
            }
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

export function WeightLossMembershipHowItWorks() {
  return (
    <section
      id="how-membership-works"
      className="relative z-[2] scroll-mt-24 bg-white"
      style={{
        marginTop: "clamp(-36px, -5vw, -56px)",
        borderTopLeftRadius: "clamp(1.5rem, 2.5vw, 2rem)",
        borderTopRightRadius: "clamp(1.5rem, 2.5vw, 2rem)",
        paddingTop: "clamp(2.25rem, 4vw, 3.25rem)",
      }}
    >
      <div className="max-w-[1344px] mx-auto min-w-0 px-4 sm:px-6 lg:px-8 pb-10 lg:pb-12">
        <h2 className="font-sans text-3xl sm:text-4xl lg:text-[2.5rem] font-semibold leading-[1.08] text-black mb-6 lg:mb-7 max-w-3xl">
          How Sanative weight management program works
        </h2>

        <div className="rounded-3xl bg-gradient-to-br from-[#e8efe0] to-[#d5e0cb] p-3 sm:p-4 lg:p-5">
          {/* Mobile: two separate rounded cards. Desktop: original single split card. */}
          <div className="grid min-w-0 w-full gap-3 sm:gap-4 lg:gap-0 lg:grid-cols-2 lg:rounded-3xl lg:border lg:border-black/10 lg:bg-white lg:shadow-2xl lg:overflow-hidden">
            {/* Offer, left */}
            <div className="flex min-w-0 max-w-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-black/10 bg-white p-6 sm:p-7 lg:p-8 shadow-xl lg:rounded-none lg:border-0 lg:border-r lg:border-black/10 lg:shadow-none">
              <div>
                <h3 className="font-sans text-2xl sm:text-[2rem] font-semibold text-black leading-tight tracking-tight">
                  A new non-invasive approach to weight loss treatment
                </h3>
              </div>

              <div className="flex-1 flex items-center min-h-0 min-w-0 w-full max-w-full">
                <ImageMarquee />
              </div>

              <div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="font-sans text-5xl sm:text-6xl font-semibold tracking-tight text-black tabular-nums leading-none">
                      ${PRICING.assessmentFee}
                    </div>
                    <p className="mt-1.5 max-w-md text-sm leading-snug text-black/70">
                      Join with confidence, speak to a doctor about your options.
                      Your ${PRICING.assessmentFee} consultation fee is redeemable off
                      your first month, or it&apos;s fully refundable if you don&apos;t
                      qualify for the program.
                    </p>
                  </div>
                  <Link
                    href={FUNNEL_PATH}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4f6038] px-5 py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-[#3c4a27]"
                  >
                    Let&apos;s book a time with a doctor and get you started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* How it works, right */}
            <div className="flex min-w-0 max-w-full flex-col justify-center overflow-hidden rounded-3xl border border-black/10 bg-white p-6 sm:p-7 lg:p-8 shadow-xl lg:rounded-none lg:border-0 lg:shadow-none">
              <ol className="space-y-0">
                {HOW_IT_WORKS_STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="flex gap-3 sm:gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div
                      className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-sans text-base sm:text-lg font-semibold text-[#3c4a27]"
                      style={{ backgroundColor: "#b1cc7d" }}
                      aria-hidden
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-sans text-lg sm:text-xl font-semibold text-black leading-tight">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm sm:text-[15px] leading-relaxed text-black/70">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
