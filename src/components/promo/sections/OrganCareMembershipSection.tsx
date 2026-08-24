"use client";

import type { ReactNode } from "react";
import { MembershipPricingCard } from "@/components/promo/sections/MembershipPricingCard";

const ORGAN_CARE_MARQUEE = [
  { src: "/images/heart-anatomical.webp", alt: "Heart" },
  { src: "/images/liver-comparison.webp", alt: "Liver" },
  { src: "/images/kidney-health.jpg", alt: "Kidney" },
  { src: "/images/biomarker-marquee/screen-01.webp", alt: "Organ Care dashboard" },
  { src: "/images/biomarker-marquee/screen-02.webp", alt: "Biomarker insights" },
  { src: "/images/membership/sanative-doctor-screens.webp", alt: "Doctor-reviewed care" },
] as const;

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
};

export function OrganCareMembershipSection({
  accent = "sage",
  programName = "Organ Care",
  heading,
}: OrganCareMembershipSectionProps) {
  const tones = ACCENT[accent];

  return (
    <section id="membership" className={`py-20 ${tones.section}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-gray-900 leading-tight">
            {heading ?? (
              <>
                One membership includes{" "}
                <span className={`${tones.title} italic`}>{programName}</span>.
              </>
            )}
          </h2>
        </div>
        <MembershipPricingCard imageMarquee={ORGAN_CARE_MARQUEE} />
      </div>
    </section>
  );
}
