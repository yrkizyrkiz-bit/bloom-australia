"use client";

import { useEffect, useRef, useState } from "react";
import { Scale, MessageCircle, Activity, Pill, TrendingDown, FlaskConical } from "lucide-react";

const appFeatures = [
  { icon: Scale, label: "Weight trends" },
  { icon: Pill, label: "Medication schedule" },
  { icon: FlaskConical, label: "Biomarker dashboard" },
  { icon: MessageCircle, label: "Message your doctor" },
];

export function AppSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#34412f] to-[#2c3628]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5c7a52]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div
            className={`
              space-y-8 transition-all duration-700
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
            `}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight">
              Your progress, tracked{" "}
              <span className="text-[#a8bb9e] italic">in one place</span>
            </h2>

            <p className="text-lg text-[#a8bb9e] leading-relaxed">
              Our app keeps you connected to your care team and helps you monitor every aspect of your weight management journey.
            </p>

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {appFeatures.map((feature, index) => (
                <div
                  key={feature.label}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10
                    transition-all duration-500 hover:bg-white/10
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                  `}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5c7a52]/30 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#a8bb9e]" />
                  </div>
                  <span className="text-white">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Phone Mockups */}
          <div
            className={`
              relative flex justify-center lg:justify-end transition-all duration-700 delay-300
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
            `}
          >
            {/* Phone 1 - Main */}
            <div className="relative z-10 w-64 lg:w-72">
              <div className="bg-white rounded-[40px] p-3 shadow-2xl">
                {/* Phone Screen */}
                <div className="bg-[#f4f7f2] rounded-[32px] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-[#34412f] p-4 pb-8">
                    <div className="flex justify-between items-center text-white text-xs mb-4">
                      <span>9:41</span>
                      <span>sanative</span>
                      <span>100%</span>
                    </div>
                    <div className="text-white">
                      <p className="text-xs text-white/60 mb-1">Weekly Progress</p>
                      <p className="text-3xl font-serif">-2.4 kg</p>
                    </div>
                  </div>

                  {/* Progress Chart Area */}
                  <div className="p-4 -mt-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-[#34412f]">Weight Trend</span>
                        <TrendingDown className="w-4 h-4 text-[#5c7a52]" />
                      </div>
                      {/* Mini Chart */}
                      <div className="h-24 flex items-end gap-2">
                        {[85, 84, 83, 82, 81, 80, 79].map((value, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-[#5c7a52] to-[#7e9a72] rounded-t"
                            style={{ height: `${(value - 75) * 8}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-[#a8bb9e]">
                        <span>Mon</span>
                        <span>Today</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-white rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Pill className="w-3 h-3 text-[#5c7a52]" />
                          <span className="text-xs text-[#7e9a72]">Medication</span>
                        </div>
                        <p className="text-sm font-medium text-[#34412f]">Taken today</p>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-3 h-3 text-[#5c7a52]" />
                          <span className="text-xs text-[#7e9a72]">Goal</span>
                        </div>
                        <p className="text-sm font-medium text-[#34412f]">On track</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2 - Background */}
            <div className="absolute -left-8 lg:-left-16 top-12 w-52 lg:w-60 opacity-60 transform -rotate-6">
              <div className="bg-white rounded-[36px] p-2.5 shadow-xl">
                <div className="bg-[#f4f7f2] rounded-[28px] p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#5c7a52]/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-[#5c7a52]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#34412f]">Care Team</p>
                      <p className="text-xs text-[#7e9a72]">Online</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-[#e6ebe3] rounded-xl p-3 text-xs text-[#5c7a52]">
                      Great progress this week! Keep it up.
                    </div>
                    <div className="bg-[#5c7a52] rounded-xl p-3 text-xs text-white ml-8">
                      Thank you! Feeling great.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
