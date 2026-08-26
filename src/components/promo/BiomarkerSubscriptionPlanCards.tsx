"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import {
  PUBLIC_BIOMARKER_COUNT_LABEL,
  getPublicBiomarkerSubscriptionPlans,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";

type Variant = "select" | "pricing";

interface BiomarkerSubscriptionPlanCardsProps {
  variant: Variant;
  selectedId?: string | null;
  onSelect?: (tier: BiomarkerSubscriptionTier) => void;
  /** Base path for pricing CTAs, defaults to biomarker intake */
  ctaBasePath?: string;
}

export function BiomarkerSubscriptionPlanCards({
  variant,
  selectedId,
  onSelect,
  ctaBasePath = "/biomarkers/checkout",
}: BiomarkerSubscriptionPlanCardsProps) {
  const plans = getPublicBiomarkerSubscriptionPlans();
  return (
    <div className={plans.length === 1 ? "mx-auto max-w-md" : "grid md:grid-cols-3 gap-6"}>
      {plans.map((plan) => {
        const isSelected = selectedId === plan.id;
        const cardClass = `relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all ${
          variant === "select" && isSelected
            ? "border-[#5c7a52] bg-[#f4f7f2]"
            : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
        }`;

        const inner = (
          <>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#c17a58] text-white text-xs font-medium rounded-full whitespace-nowrap">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-serif text-[#2c3628] mb-2">{plan.name}</h3>
            <p className="text-sm text-[#5c7a52] mb-4 flex-1">{plan.tagline}</p>
            <p className="text-sm text-[#7e9a72] mb-4">
              {PUBLIC_BIOMARKER_COUNT_LABEL} tests & markers*
            </p>
            <div className="mb-4">
              <p className="text-2xl font-serif text-[#34412f]">
                ${plan.priceAud}
                <span className="text-sm font-normal text-[#7e9a72]"> AUD</span>
              </p>
              <p className="text-xs text-[#7e9a72] mt-1">{plan.billingLabel}</p>
            </div>

            {variant === "pricing" && (
              <ul className="space-y-2 mb-6">
                {plan.highlights.slice(0, 4).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#5c7a52]">
                    <Check className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {variant === "select" && isSelected && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#5c7a52] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {variant === "pricing" && (
              <Link
                href={`${ctaBasePath}?package=${plan.id}`}
                className="group mt-auto flex items-center justify-center gap-2 btn-primary w-full py-3"
              >
                Choose {plan.name}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </>
        );

        if (variant === "select") {
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect?.(plan.id)}
              className={cardClass}
            >
              {inner}
            </button>
          );
        }

        return (
          <div key={plan.id} className={cardClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
