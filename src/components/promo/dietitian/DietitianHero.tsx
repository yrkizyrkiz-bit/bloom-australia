"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Salad, Clock, Users } from "lucide-react";

const supportFeatures = [
  { icon: Salad, label: "Personalised meal plans" },
  { icon: Clock, label: "Quick & easy recipes" },
  { icon: Heart, label: "Nutritionally balanced" },
  { icon: Users, label: "1-on-1 dietitian support" },
];

export function DietitianHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f4ec] via-[#f4f7f2] to-[#e6ebe3]" />

      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#7e9a72]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      {/* Floating Food Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["🥗", "🍗", "🥑", "🍳", "🥦", "🍋"].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-20 animate-float"
            style={{
              top: `${15 + (i * 12)}%`,
              left: i % 2 === 0 ? `${8 + (i * 5)}%` : `${75 - (i * 4)}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#5c7a52]/10 rounded-full px-4 py-2">
              <Heart className="w-4 h-4 text-[#c17a58]" />
              <span className="text-sm font-medium text-[#34412f]">Dietitian Support</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-[#2c3628] leading-[1.1] tracking-tight">
              We&apos;re behind you{" "}
              <span className="text-[#5c7a52] italic">all the way</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-[#5c7a52] leading-relaxed max-w-xl">
              Your weight management journey doesn&apos;t have to be a solo effort. Our accredited dietitians create personalised meal recommendations that fit your lifestyle, taste preferences, and health goals.
            </p>

            {/* Secondary Text */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#e6ebe3]">
              <p className="text-[#34412f] leading-relaxed">
                From protein-rich breakfasts to satisfying dinners, we&apos;ll help you discover delicious meals that support your goals — without feeling like you&apos;re on a diet.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/weight-management/assessment"
                className="group inline-flex items-center justify-center gap-3 btn-primary text-lg px-8 py-4"
              >
                Get started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#meals"
                className="inline-flex items-center justify-center gap-2 btn-secondary text-lg px-8 py-4"
              >
                View sample meals
              </Link>
            </div>

            {/* Feature Strip */}
            <div className="pt-6 border-t border-[#e6ebe3]">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {supportFeatures.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#5c7a52]/10 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-[#5c7a52]" />
                    </div>
                    <span className="text-xs text-[#34412f]">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Image Collage */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"
                alt="Healthy meal preparation"
                width={600}
                height={700}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c3628]/40 via-transparent to-transparent" />
            </div>

            {/* Floating Card 1 - Dietitian */}
            <div className="absolute -left-6 lg:-left-12 top-16 bg-white rounded-2xl shadow-xl p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#5c7a52] flex items-center justify-center">
                  <span className="text-white text-lg">👩‍⚕️</span>
                </div>
                <div>
                  <p className="text-xs text-[#7e9a72]">Your dietitian</p>
                  <p className="text-sm font-serif text-[#2c3628]">Sarah M., APD</p>
                </div>
              </div>
            </div>

            {/* Floating Card 2 - Stats */}
            <div className="absolute -right-4 lg:-right-8 bottom-20 bg-white rounded-2xl shadow-xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center">
                <p className="text-3xl font-serif text-[#5c7a52]">500+</p>
                <p className="text-xs text-[#7e9a72]">Recipe library</p>
              </div>
            </div>

            {/* Floating Card 3 - Meal */}
            <div className="absolute -bottom-6 left-1/4 bg-white rounded-2xl shadow-xl p-3 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"
                    alt="Healthy salad"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs text-[#7e9a72]">Today&apos;s lunch</p>
                  <p className="text-sm font-medium text-[#2c3628]">Greek Power Bowl</p>
                  <p className="text-xs text-[#5c7a52]">420 cal • 35g protein</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
