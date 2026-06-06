"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const benefits = [
  "Personalised meal plans tailored to your goals",
  "Access to 500+ protein-rich recipes",
  "Weekly check-ins with your dietitian",
  "Grocery lists and meal prep guides",
  "Adjustments based on your progress",
];

export function DietitianCTA() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5c7a52] via-[#4a6243] to-[#34412f]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#c17a58]/10 rounded-full blur-3xl" />

      {/* Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-[#a8bb9e] rounded-full animate-pulse" />
            <span className="text-sm text-white/90">Included in your program</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight mb-6">
            Ready for{" "}
            <span className="text-[#cdd8c6] italic">personalised nutrition?</span>
          </h2>

          <p className="text-lg text-[#a8bb9e] max-w-2xl mx-auto mb-10">
            When you join our weight management program, you get access to accredited dietitians who will create a meal plan that works for your lifestyle.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={benefit}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4"
            >
              <div className="w-6 h-6 rounded-full bg-[#a8bb9e] flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#34412f]" />
              </div>
              <span className="text-white text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/weight-management/assessment"
            className="group inline-flex items-center gap-3 bg-white text-[#34412f] rounded-full px-10 py-5 text-lg font-medium hover:bg-[#f8f4ec] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            Start your journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-6 text-sm text-[#a8bb9e]">
            Dietitian support is included in all weight management programs
          </p>
        </div>
      </div>
    </section>
  );
}
