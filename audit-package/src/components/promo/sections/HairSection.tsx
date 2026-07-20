"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CLINICAL_INDIVIDUALITY_COPY,
  DOCTOR_LED_DISCLAIMER,
} from "@/lib/legal/marketing-compliance";

export function HairSection() {
  const careFocusAreas = [
    "Understand thinning or shedding",
    "Doctor-led assessment of hair health",
    "Ongoing monitoring with your care team",
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight">
              Doctor-led
              <br />
              <span className="text-[#5c7a52] italic">hair health</span>
            </h2>
            <p className="mt-6 text-lg text-[#5c7a52] max-w-lg">
              AHPRA-registered doctors assess your history and discuss suitable care options privately if clinically appropriate.
            </p>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-medium text-[#34412f] uppercase tracking-wider">
                What would you like to explore?
              </p>
              {careFocusAreas.map((goal) => (
                <div
                  key={goal}
                  className="w-full text-left px-5 py-4 rounded-xl bg-[#e6ebe3] text-[#34412f] font-medium"
                >
                  {goal}
                </div>
              ))}
            </div>

            <Link
              href="/hair-health"
              className="mt-8 btn-primary inline-flex items-center gap-2"
            >
              Start assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] rounded-3xl p-8 lg:p-10">
            <p className="text-lg lg:text-xl text-[#2c3628] leading-relaxed font-serif">
              {CLINICAL_INDIVIDUALITY_COPY}
            </p>
            <p className="mt-6 text-sm text-[#34412f] leading-relaxed">
              {DOCTOR_LED_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
