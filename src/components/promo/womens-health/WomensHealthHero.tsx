"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Shield, Clock, Sparkles } from "lucide-react";

export function WomensHealthHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background with soft feminine gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fdf8f6] via-[#fef4f0] to-[#f9f5f3]" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[#f8e1e1]/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-[#e8d5e8]/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fce4d8]/20 rounded-full blur-3xl" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, #c17a58 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f8e1e1]/60 border border-[#e8b4b4]/30 mb-8">
              <Sparkles className="w-4 h-4 text-[#c17a58]" />
              <span className="text-sm font-medium text-[#8b5a5a]">
                Precise Women&apos;s Healthcare
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-[1.1]">
              Your health journey,{" "}
              <span className="text-[#c17a58] italic">supported</span>{" "}
              at every stage
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-[#5c7a52] leading-relaxed">
              From hormonal balance to menopause care, our AHPRA-registered doctors provide personalised assessment and care plans. Treatment options are discussed privately if clinically appropriate.
            </p>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#f8e1e1] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#c17a58]" />
                </div>
                <span className="text-sm text-[#5c7a52]">AHPRA Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#e8d5e8]/50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#8b6b8b]" />
                </div>
                <span className="text-sm text-[#5c7a52]">Confidential Care</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#fce4d8]/50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#c17a58]" />
                </div>
                <span className="text-sm text-[#5c7a52]">30-min Consults</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/womens-health/assessment"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c17a58] hover:bg-[#a86548] text-white rounded-full font-medium transition-all shadow-lg shadow-[#c17a58]/20 hover:shadow-xl hover:shadow-[#c17a58]/30"
              >
                Start Your Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/80 hover:bg-white text-[#2c3628] rounded-full font-medium transition-all border border-[#e8d5d5]"
              >
                Explore Services
              </Link>
            </div>
          </div>

          {/* Right - Hero image */}
          <div className="relative">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] max-w-lg mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-xl border border-[#f8e1e1]/50">
              <Image
                src="/images/menopause-hero.png"
                alt="Woman with personalised health dashboard showing hormone balance, sleep, energy, and care team support"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
