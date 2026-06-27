"use client";

import { Stethoscope } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#e8ede5] to-[#dce4d6]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628]">
            Doctor-led care, <span className="text-[#5c7a52] italic">built around you</span>
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#f4f7f2] flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-[#5c7a52]" />
            </div>
          </div>

          <p className="text-lg lg:text-xl text-[#2c3628] leading-relaxed text-center font-serif">
            People come to Sanative with different health profiles, goals and medical histories.
            Your doctor will review your assessment and discuss what is clinically appropriate for you.
          </p>

          <p className="mt-6 text-sm text-[#7e9a72] text-center leading-relaxed">
            Individual results vary and are not guaranteed. Sanative does not use patient testimonials
            in its advertising of regulated health services.
          </p>
        </div>
      </div>
    </section>
  );
}
