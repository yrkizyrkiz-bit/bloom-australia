"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Flag, BadgeCheck, Activity, Heart, FlaskConical, Stethoscope } from "lucide-react";

export function WeightLossHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f4ec] via-[#f4f7f2] to-[#e6ebe3]" />

      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#7e9a72]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #34412f 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-5 lg:space-y-6">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-[#2c3628] leading-[1.1] tracking-tight">
              Doctor-led metabolic weight management,{" "}
              <span className="text-[#5c7a52] italic">guided by your biology</span>
            </h1>

            {/* Market leader statement */}
            <p className="text-base lg:text-lg text-[#5c7a52] leading-relaxed max-w-xl">
              Sanative is Australia&apos;s doctor-led metabolic weight management program: treatment if prescribed, biomarker-guided monitoring, Health Age tracking, secure delivery and ongoing care — from $249 for your first month.
            </p>

            {/* Supporting line */}
            <p className="text-base text-[#7e9a72] leading-relaxed max-w-xl">
              More than weight loss. Sanative helps your doctor understand, monitor and guide your metabolic health while you progress.
            </p>

            {/* Value Proposition Highlight */}
            <div className="bg-gradient-to-r from-[#5c7a52]/10 to-[#7e9a72]/5 border border-[#5c7a52]/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5c7a52]/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#5c7a52]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2c3628]">Start from $249 for your first month</p>
                  <p className="text-sm text-[#5c7a52] mt-0.5">
                    Includes doctor assessment, treatment if prescribed, biomarker monitoring, Health Age tracking and ongoing care. $100 introductory discount applied.
                  </p>
                </div>
              </div>
            </div>

            {/* Key features pills */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e6ebe3] rounded-full text-sm text-[#5c7a52]">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Biomarker-guided</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e6ebe3] rounded-full text-sm text-[#5c7a52]">
                <Heart className="w-3.5 h-3.5" />
                <span>Health Age tracking</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e6ebe3] rounded-full text-sm text-[#5c7a52]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Australian doctors</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/weight-management/assessment"
                className="group inline-flex items-center gap-3 btn-primary text-lg px-8 py-4"
              >
                Start assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="text-[#5c7a52] font-medium hover:text-[#34412f] transition-colors underline underline-offset-4"
              >
                How it works
              </a>
            </div>

            {/* Trust Bar */}
            <div className="pt-6 border-t border-[#e6ebe3]">
              {/* GAP-019: Removed star rating - health service advertising risk */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* Doctor-led */}
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#34412f]">Australian doctor-led care</span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-5 bg-[#cdd8c6]" />

                {/* Clinical appropriateness */}
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#34412f]">Treatment if clinically appropriate</span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-5 bg-[#cdd8c6]" />

                {/* Refund */}
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#34412f]">Refund if not suitable</span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-5 bg-[#cdd8c6]" />

                {/* AHPRA */}
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#34412f]">AHPRA-registered doctors</span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-5 bg-[#cdd8c6]" />

                {/* Australian */}
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#34412f]">Australian owned</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image & App Mockup */}
          <div className="relative flex flex-col">
            {/* Main Image */}
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl w-full">
              <Image
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80"
                alt="Healthy lifestyle"
                width={600}
                height={700}
                className="w-full h-auto object-cover"
                priority
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c3628]/30 via-transparent to-transparent" />
            </div>

            {/* Floating Phone Mockup - App Dashboard */}
            <div className="absolute -left-8 lg:-left-16 bottom-12 w-48 lg:w-56 bg-white rounded-3xl shadow-2xl p-3 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="bg-[#f4f7f2] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#5c7a52] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-xs font-medium text-[#34412f]">sanative</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-[#7e9a72]">Your Health Age</div>
                  <div className="text-2xl font-serif text-[#2c3628]">42 <span className="text-sm font-normal text-[#5c7a52]">years</span></div>
                  <div className="text-xs text-[#5c7a52]">3 years younger than actual age</div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="absolute -right-4 lg:-right-8 bottom-24 bg-white rounded-2xl shadow-xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center space-y-1">
                <div className="text-3xl font-serif text-[#5c7a52]">80+</div>
                <div className="text-xs text-[#7e9a72]">biomarkers monitored</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
