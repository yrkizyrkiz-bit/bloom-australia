"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import marqueeStyles from "@/components/promo/sections/MembershipPricingCard.module.css";

/**
 * Men's health membership offer, presentation mirrors WeightLossMembershipHowItWorks.
 * Left panel adds the Organ Care-style image marquee.
 */
const STEPS = [
  {
    number: "1",
    title: "Join Sanative",
    body: "Become a member for $365 annually, including your comprehensive biomarker panel.",
  },
  {
    number: "2",
    title: "Meet your doctor",
    body: "Your doctor reviews your health, discusses your men's health goals and issues the appropriate pathology request for your blood tests.",
  },
  {
    number: "3",
    title: "Complete your testing",
    body: "Complete your biomarker panel to help uncover factors that may be influencing your energy, hormones and overall health.",
  },
  {
    number: "4",
    title: "Start your personalised program",
    body: "Your doctor develops a men's health plan around your results, medical history and goals.",
  },
  {
    number: "5",
    title: "Continue your care",
    body: "Your first 30 days of doctor-led men's health care are included. After that, continue for $240 every three months.*",
  },
];

const MARQUEE = [
  {
    src: "/images/membership/mens-marquee/biomarker-vial.webp",
    alt: "Sanative biomarker blood test vial with metabolic markers",
  },
  {
    src: "/images/membership/mens-marquee/organ-dashboard.webp",
    alt: "Sanative organ and metabolic health dashboard",
  },
  {
    src: "/images/membership/mens-marquee/app-insights.webp",
    alt: "Sanative app showing health score and biomarker insights",
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
            className="h-32 w-48 sm:h-40 sm:w-64 lg:h-44 lg:w-72 shrink-0 rounded-xl object-cover"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

export function MensHealthMembershipHowItWorks() {
  return (
    <section
      id="how-membership-works"
      className="scroll-mt-24 py-12 lg:py-16 bg-[#fdfbf7]"
    >
      <div className="max-w-[1344px] mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <h2 className="font-sans text-3xl sm:text-4xl lg:text-[2.5rem] font-semibold leading-[1.08] text-black mb-6 lg:mb-7 max-w-3xl">
          How Sanative men&apos;s health program works
        </h2>

        <div className="rounded-3xl bg-gradient-to-br from-[#e8efe0] to-[#d5e0cb] p-3 sm:p-4 lg:p-5">
          <div className="grid min-w-0 w-full gap-3 sm:gap-4 lg:gap-0 lg:grid-cols-2 lg:rounded-3xl lg:border lg:border-black/10 lg:bg-white lg:shadow-2xl lg:overflow-hidden">
            <div className="flex min-w-0 max-w-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-black/10 bg-white p-6 sm:p-7 lg:p-8 shadow-xl lg:rounded-none lg:border-0 lg:border-r lg:border-black/10 lg:shadow-none">
              <div>
                <p className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#2c3628] leading-tight">
                  All Sanative Programs{" "}
                  <span className="text-[#5c7a52] italic">start with</span>
                </p>
                <h3 className="mt-2 font-sans text-2xl sm:text-[2rem] font-semibold text-black leading-tight tracking-tight">
                  Sanative Membership
                </h3>
                <p className="mt-1.5 text-sm sm:text-base text-black/55">
                  Comprehensive biomarker panel + first 30 days of Men&apos;s
                  Health Care
                </p>
              </div>

              <div className="flex-1 flex items-center min-h-0 min-w-0 w-full max-w-full">
                <ImageMarquee />
              </div>

              <div>
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-sans text-5xl sm:text-6xl font-semibold tracking-tight text-black tabular-nums leading-none">
                        $1
                      </span>
                      <span className="text-base sm:text-lg font-medium text-black">
                        a day
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-black/50">
                      $365 billed annually
                    </p>
                  </div>
                  <Link
                    href="/membership/checkout?intent=mens_health"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#4f6038] px-5 py-2.5 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] shrink-0"
                  >
                    Join Sanative
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 max-w-full flex-col justify-center overflow-hidden rounded-3xl border border-black/10 bg-white p-6 sm:p-7 lg:p-8 shadow-xl lg:rounded-none lg:border-0 lg:shadow-none">
              <ol className="space-y-0">
                {STEPS.map((step) => (
                  <li
                    key={step.number}
                    className="flex gap-3 sm:gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div
                      className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-sans text-base sm:text-lg font-semibold text-[#3c4a27]"
                      style={{ backgroundColor: "#b1cc7d" }}
                      aria-hidden
                    >
                      {step.number}
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

        <p className="mt-6 text-xs leading-relaxed max-w-3xl mx-auto text-center text-black/45">
          Sanative Membership supports access to multiple care programs. One
          included 30-day care period applies if you nominate that eligible
          program before or during your initial doctor consultation. It is not
          available for a program selected after that consultation.
          *Medication cost not included.
        </p>
      </div>
    </section>
  );
}
