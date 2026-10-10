"use client";

import type { ReactNode } from "react";
import { MembershipPricingCard } from "@/components/promo/sections/MembershipPricingCard";
import { ORDER_SUMMARY_MARQUEE } from "@/lib/membership/order-summary-marquee";

const ACCENT = {
  rose: { section: "bg-gradient-to-br from-gray-50 to-rose-50", title: "text-rose-600" },
  sage: { section: "bg-gradient-to-br from-[#fdfbf7] to-[#e6ebe3]", title: "text-[#5c7a52]" },
  teal: { section: "bg-gradient-to-br from-gray-50 to-teal-50", title: "text-teal-600" },
  blush: { section: "bg-gradient-to-br from-[#fdf8f6] to-[#f8e1e1]/45", title: "text-[#c17a58]" },
} as const;

type OrganCareMembershipSectionProps = {
  accent?: keyof typeof ACCENT;
  programName?: string;
  heading?: ReactNode;
  checkoutHref?: string;
};

export function OrganCareMembershipSection({
  accent = "sage",
  programName = "Organ Care",
  heading,
  checkoutHref,
}: OrganCareMembershipSectionProps) {
  const tones = ACCENT[accent];

  return (
    <section id="membership" className={`py-14 sm:py-16 ${tones.section}`}>
      <div className="max-w-5xl mx-auto min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-7 lg:mb-8">
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-serif text-gray-900 leading-tight">
            {heading ?? (
              <>
                One membership includes{" "}
                <span className={`${tones.title} italic`}>{programName}</span>.
              </>
            )}
          </h2>
        </div>
        <MembershipPricingCard
          imageMarquee={ORDER_SUMMARY_MARQUEE}
          checkoutHref={checkoutHref}
        />
      </div>
    </section>
  );
}
