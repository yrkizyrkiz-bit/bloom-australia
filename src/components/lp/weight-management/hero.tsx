"use client";

import { ShieldCheck } from "lucide-react";
import Image from "next/image";

import { CtaLink } from "./cta-link";
import { useLpGender } from "./gender-context";
import { lpImages, PRICING } from "@/lib/lp/weight-management";

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="9" r="7.65" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.6 9.2 7.7 11.3 12.4 6.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const programmePoints = [
  { text: "The latest treatment options" },
  { text: "New non-invasive approach to weight loss" },
  { text: "Led by experienced doctors" },
  { text: "Everything tracked in your portal" },
  {
    text: "Love it or Leave it, 30-day money-back guarantee",
    footnote: true,
  },
];

export function Hero() {
  const { gender, setGender } = useLpGender();
  const isMale = gender === "men";
  const heroImage = isMale ? lpImages.manWaist : lpImages.womanWaist;
  const heroAlt = isMale
    ? "Smiling man in athletic wear measuring his waist"
    : "Smiling woman in activewear measuring her waist";

  return (
    <section className="relative overflow-hidden bg-hero text-forest-foreground">
      <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 pb-16 pt-4 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="relative mx-auto w-full lg:order-2 lg:max-w-none">
          <div className="flex justify-center lg:justify-start">
            <div className="wm-gender-toggle" role="group" aria-label="Select gender">
              <span className="wm-gender-toggle__label">I am</span>
              <button
                type="button"
                className={`wm-gender-toggle__btn${gender === "women" ? " wm-gender-toggle__btn--active" : ""}`}
                aria-pressed={gender === "women"}
                onClick={() => setGender("women")}
              >
                Female
              </button>
              <button
                type="button"
                className={`wm-gender-toggle__btn${gender === "men" ? " wm-gender-toggle__btn--active" : ""}`}
                aria-pressed={gender === "men"}
                onClick={() => setGender("men")}
              >
                Male
              </button>
            </div>
          </div>
          <div className="relative aspect-[9/10] overflow-hidden rounded-3xl shadow-glass">
            <Image
              key={heroImage}
              src={heroImage}
              alt={heroAlt}
              className="h-full w-full object-cover object-[center_18%]"
              width={933}
              height={1400}
              priority
            />
            <div className="absolute inset-0 bg-fade opacity-30 lg:opacity-60" />
          </div>
        </div>

        <div className="animate-rise flex flex-col justify-center lg:order-1">
          <h1 className="hero-title max-w-xl font-hers text-forest-foreground">
            A new medical weight loss program
          </h1>

          <ul className="mt-6 max-w-xl space-y-2.5">
            {programmePoints.map((point) => (
              <li
                key={point.text}
                className="flex items-start gap-2.5 text-base leading-snug text-forest-foreground/90"
                {...(point.footnote ? { "aria-describedby": "lp-guarantee-terms" } : {})}
              >
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
                <span>
                  {point.text}
                  {point.footnote ? (
                    <sup className="ml-0.5 text-[0.7em] leading-none">*</sup>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-8 w-fit lg:mx-0">
            <CtaLink variant="cta-light" location="hero">
              Let's get you started ${PRICING.assessmentFee}
            </CtaLink>
          </div>

          <div className="glass-panel mx-auto mt-5 flex max-w-xl items-start gap-1.5 rounded-2xl p-4 text-sm leading-snug text-forest-foreground/85 sm:p-5 lg:mx-0">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />
            <p>
              Join with confidence, your ${PRICING.assessmentFee} consultation fee is redeemable off your first month,
              or it&apos;s fully refundable if you don&apos;t qualify for the program.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
