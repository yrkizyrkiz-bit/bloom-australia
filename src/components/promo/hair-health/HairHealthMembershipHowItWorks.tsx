"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Hair-health membership offer — presentation mirrors WeightLossMembershipHowItWorks
 * (split offer card). Pricing: $90 every three months for medical treatment after
 * the included first 30 days.
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
    body: "Your doctor reviews your health, discusses your hair goals and issues the appropriate pathology request for your blood tests.",
  },
  {
    number: "3",
    title: "Complete your testing",
    body: "Complete your biomarker panel to help uncover factors that may be influencing your hair and overall health.",
  },
  {
    number: "4",
    title: "Start your personalised program",
    body: "Your doctor develops a hair health plan around your results, medical history and goals.",
  },
  {
    number: "5",
    title: "Continue your care",
    body: "Your first 30 days of doctor-led hair health care are included. After that, continue for $90 every three months.",
  },
];

export function HairHealthMembershipHowItWorks() {
  return (
    <section
      id="how-membership-works"
      className="relative z-[2] scroll-mt-24 bg-white"
      style={{
        marginTop: "clamp(-36px, -5vw, -56px)",
        borderTopLeftRadius: "clamp(1.5rem, 2.5vw, 2rem)",
        borderTopRightRadius: "clamp(1.5rem, 2.5vw, 2rem)",
        paddingTop: "clamp(3.5rem, 7vw, 5.5rem)",
      }}
    >
      <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 pb-14 lg:pb-20">
        <h2 className="font-sans text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.08] text-black mb-10 lg:mb-12 max-w-3xl">
          How Sanative hair health program works
        </h2>

        <div className="rounded-3xl bg-gradient-to-br from-[#e8efe0] to-[#d5e0cb] p-4 sm:p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 rounded-3xl border border-black/10 bg-white shadow-2xl overflow-hidden">
            {/* Offer — left */}
            <div className="flex flex-col justify-between gap-10 p-8 sm:p-10 lg:p-12 lg:border-r border-black/10">
              <div>
                <p className="text-sm font-semibold text-[#4f6038]">
                  All Sanative Programs start with
                </p>
                <h3 className="mt-4 font-sans text-3xl sm:text-[2.5rem] font-semibold text-black leading-tight tracking-tight">
                  Sanative Membership
                </h3>
                <p className="mt-2 text-base text-black/55">
                  Comprehensive biomarker panel + first 30 days of Hair Health
                  Care
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#eef4e6] to-[#dbe7cc] border border-[#b1cc7d]/50 p-6 sm:p-7 max-w-md">
                <p className="text-lg sm:text-xl leading-snug font-medium text-[#3c4a27]">
                  After your included 30 days, continue your Hair Health Program
                  for{" "}
                  <span className="font-semibold text-[#4f6038]">
                    $90 every three months
                  </span>
                  .
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-sans text-6xl sm:text-7xl font-semibold tracking-tight text-black tabular-nums leading-none">
                        $1
                      </span>
                      <span className="text-lg sm:text-xl font-medium text-black">
                        a day
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-black/50">
                      $365 billed annually
                    </p>
                  </div>
                  <Link
                    href="/membership/checkout?intent=hair_loss"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4f6038] px-6 py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] shrink-0"
                  >
                    Join Sanative
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* How it works — right */}
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 border-t border-black/10 lg:border-t-0">
              <ol className="space-y-0">
                {STEPS.map((step) => (
                  <li
                    key={step.number}
                    className="flex gap-4 sm:gap-5 py-4 first:pt-0 last:pb-0"
                  >
                    <div
                      className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-sans text-lg sm:text-xl font-semibold text-[#3c4a27]"
                      style={{ backgroundColor: "#b1cc7d" }}
                      aria-hidden
                    >
                      {step.number}
                    </div>
                    <div className="pt-0.5">
                      <h3 className="font-sans text-xl sm:text-2xl font-semibold text-black leading-tight">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-base leading-relaxed text-black/70">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed max-w-3xl mx-auto text-center text-black/45">
          Sanative Membership supports access to multiple care programs. One
          included 30-day care period applies to your first eligible program.
        </p>
      </div>
    </section>
  );
}
