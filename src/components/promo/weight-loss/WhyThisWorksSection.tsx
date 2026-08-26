"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Brain, Dna, TrendingUp } from "lucide-react";

interface ExplanationBlock {
  icon: React.ElementType;
  title: string;
  description: string;
}

const explanations: ExplanationBlock[] = [
  {
    icon: Brain,
    title: "Understand appetite and hunger",
    description:
      "We look at appetite regulation, cravings and satiety to understand what may be driving overeating or difficulty maintaining results.",
  },
  {
    icon: Dna,
    title: "Personalised care plan",
    description:
      "Your plan is tailored based on your symptoms, health profile, medical history and progress over time, with biomarker testing used where appropriate to provide additional insight.",
  },
  {
    icon: TrendingUp,
    title: "Long-term results",
    description:
      "The goal is not just to lose weight, it is to help you maintain results with ongoing support and a more personalised approach.",
  },
];

export function WhyThisWorksSection() {
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
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative pt-20 pb-10 lg:pt-32 lg:pb-14 overflow-hidden bg-white"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#7b8967]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Image */}
          <div
            className={`
              relative transition-all duration-700
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
            `}
          >
            <div className="relative rounded-[32px] overflow-hidden shadow-[0_16px_40px_rgba(49,54,48,0.14)]">
              <Image
                src="/images/remote/unsplash/photo-1506126613408-eca07ce68773.webp"
                alt="Scientific approach to wellness"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#313630]/45 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-[#d3e0db]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[rgba(0,0,0,0.5)] uppercase tracking-wider">
                      Doctor-led care
                    </p>
                    <p className="text-2xl font-medium text-[#313630] tracking-tight">
                      Metabolic Health
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-medium text-[#7b8967] tracking-tight">
                      1:1
                    </p>
                    <p className="text-xs text-[rgba(0,0,0,0.5)]">
                      clinical support
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#7b8967] rounded-full flex items-center justify-center shadow-xl">
              <div className="text-center">
                <p className="text-2xl font-medium text-white tracking-tight">
                  1:1
                </p>
                <p className="text-[10px] text-white/80 uppercase tracking-wider">
                  Doctor Care
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div
            className={`
              space-y-8 transition-all duration-700 delay-200
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
            `}
          >
            <div>
              <h2 className="text-[clamp(1.85rem,3.2vw,2.75rem)] font-medium text-[#313630] leading-[1.05] tracking-[-0.02em] mb-6">
                A more{" "}
                <span className="text-[#7b8967]">scientific</span> approach to
                weight loss
              </h2>
              <p className="text-lg text-[rgba(0,0,0,0.5)] leading-relaxed">
                Weight management is not just about willpower. Appetite,
                metabolism, hormones, insulin resistance and how your body
                regulates hunger can all influence weight gain and long-term
                success.
              </p>
            </div>

            <div className="space-y-4">
              {explanations.map((item, index) => (
                <div
                  key={item.title}
                  className={`
                    flex gap-5 p-5 rounded-2xl bg-[#f5faf6] border border-[#d3e0db]
                    transition-all duration-500 hover:bg-[#e2ece7] hover:border-[#c6d8d1]
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                  `}
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[#7b8967]/15 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-[#7b8967]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#313630] tracking-tight mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[rgba(0,0,0,0.5)] text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[rgba(0,0,0,0.4)] italic">
              Care plans are developed only when clinically appropriate following
              assessment. Results may vary.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
