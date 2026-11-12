"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { LEGAL_LINKS } from "@/lib/legal/constants";
import { lpImages, PRICING } from "@/lib/lp/weight-management";

const NEXT_STEPS = [
  {
    title: "Book your doctor consultation",
    detail: "Pick a time that suits you. Your Sanative doctor will review your assessment and discuss suitable options.",
  },
  {
    title: "Complete your profile",
    detail: "Add your name, email and mobile so we can confirm your booking.",
  },
  {
    title: `Pay $${PRICING.assessmentFee}`,
    detail: `Redeemable off your first month, or fully refundable if you don't qualify for the program.`,
  },
];

type Props = {
  firstName?: string;
  gender?: string;
  onBack: () => void;
  onContinue: (claimedOffer: boolean) => void;
};

export function LpWmQualificationStep({ firstName, gender, onBack, onContinue }: Props) {
  const [claimed, setClaimed] = useState(false);
  const greeting = firstName ? `${firstName}, you've` : "You've";

  const claimOffer = () => {
    if (claimed) return;
    setClaimed(true);
    window.setTimeout(() => onContinue(true), 250);
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-neutral-500 hover:text-black"
      >
        ← Back
      </button>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm">
        <Image
          src={gender === "male" ? lpImages.welcomeMale : lpImages.welcomeFemale}
          alt={
            gender === "male"
              ? "Smart move. Your health deserves this — doctor-led weight management for men"
              : "Smart move. Your health deserves this — doctor-led weight management for women"
          }
          fill
          sizes="(max-width: 576px) 100vw, 576px"
          className="object-cover object-center"
          priority
        />
      </div>

      <div className="text-center">
        <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#5c7a52]/10">
          <CheckCircle2 className="h-4 w-4 text-[#5c7a52]" />
        </div>
        <h1 className="font-serif text-2xl leading-tight text-[#2c3628] sm:text-3xl">
          {greeting} come to the right place
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-[#5c7a52]">
          Your doctor will review your answers and discuss your options. We can&apos;t wait to tell you
          about some new and exciting medical weight options for you.
        </p>
      </div>

      <div className="rounded-2xl border border-[#e6ebe3] bg-white px-3.5 py-3 shadow-sm">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5c7a52]">
          Next steps
        </p>
        <ol>
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="relative flex gap-2.5 pb-2.5 last:pb-0">
              {index < NEXT_STEPS.length - 1 && (
                <span
                  className="absolute left-[13px] top-7 bottom-0 w-px bg-[#e6ebe3]"
                  aria-hidden
                />
              )}
              <div className="relative z-[1] flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#34412f] text-xs font-semibold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold leading-tight text-[#2c3628]">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#5c7a52]">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e6ebe3] bg-[#f4f7f2] px-4 py-3.5">
        <input
          type="checkbox"
          checked={claimed}
          onChange={(event) => {
            if (event.target.checked) claimOffer();
          }}
          className="mt-1 h-5 w-5 flex-shrink-0 accent-[#5c7a52]"
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5c7a52]">
            New customer intro offer
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#2c3628]">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
            Love it or Leave it, 30-day money-back guarantee
          </p>
          <p className="mt-1 text-sm font-medium text-[#2c3628]">Claim your intro offer</p>
          <p className="mt-1 text-xs leading-relaxed text-[#5c7a52]">
            Eligible first-time patients are covered for weight management subscription fees.{" "}
            <Link
              href={LEGAL_LINKS.refundPolicy}
              className="underline underline-offset-2"
              onClick={(event) => event.stopPropagation()}
            >
              T&amp;Cs apply
            </Link>
            .
          </p>
        </div>
      </label>

      <button
        type="button"
        onClick={() => onContinue(claimed)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27]"
      >
        Continue <ArrowRight className="h-5 w-5" />
      </button>

      <p className="text-center text-[10px] leading-snug text-[#7e9a72] sm:text-xs">
        AHPRA-registered Australian doctors · Cancel anytime
      </p>
    </div>
  );
}
