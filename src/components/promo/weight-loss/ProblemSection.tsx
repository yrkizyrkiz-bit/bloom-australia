"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Scale, TrendingDown } from "lucide-react";

interface ProblemCard {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  body: string;
}

const problems: ProblemCard[] = [
  {
    icon: Brain,
    title: "Your body fights back",
    subtitle: "Metabolic adaptation",
    body: "When you lose weight, your body reduces its energy expenditure and increases hunger hormones like ghrelin. This biological response makes it progressively harder to lose weight and easier to regain it — regardless of willpower.",
  },
  {
    icon: Scale,
    title: "Calories aren't the whole story",
    subtitle: "Hormonal imbalances",
    body: "Insulin resistance, thyroid dysfunction, cortisol imbalances and other hormonal factors can make weight loss extremely difficult. Counting calories alone won't address these underlying metabolic issues.",
  },
  {
    icon: TrendingDown,
    title: "One-size-fits-all doesn't work",
    subtitle: "Generic approaches",
    body: "Most programs ignore individual differences in metabolism, appetite regulation and medical history. Without understanding your unique biology, even the most disciplined approach may not deliver lasting results.",
  },
];

export function ProblemSection() {
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
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#e6ebe3] to-transparent" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#c17a58]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-[#5c7a52]/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
            Why most weight loss attempts{" "}
            <span className="text-[#c17a58] italic">don&apos;t work</span> long term
          </h2>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className={`
                relative bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-[#e6ebe3]
                transition-all duration-700 ease-out
                hover:shadow-lg hover:border-[#cdd8c6] hover:-translate-y-1
                ${isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
                }
              `}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Number */}
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-[#f8f4ec] border border-[#e6ebe3] flex items-center justify-center">
                <span className="text-lg font-serif text-[#c17a58]">{index + 1}</span>
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#c17a58]/10 flex items-center justify-center mb-6">
                <problem.icon className="w-7 h-7 text-[#c17a58]" />
              </div>

              {/* Content */}
              <p className="text-xs font-medium text-[#c17a58] uppercase tracking-wider mb-2">
                {problem.subtitle}
              </p>
              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628] mb-3">
                {problem.title}
              </h3>
              <p className="text-[#5c7a52] leading-relaxed text-sm lg:text-base">
                {problem.body}
              </p>
            </div>
          ))}
        </div>

        {/* Transition Line */}
        <div
          className={`
            text-center max-w-3xl mx-auto transition-all duration-700 delay-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div className="w-16 h-px bg-[#cdd8c6] mx-auto mb-6" />
          <p className="text-lg lg:text-xl text-[#5c7a52] leading-relaxed">
            That&apos;s why we take a different approach — one that works{" "}
            <span className="text-[#34412f] font-medium">with your biology</span>, not against it. Our doctors assess your individual situation and, where appropriate, prescribe evidence-based treatments designed to address the underlying factors.
          </p>
        </div>
      </div>
    </section>
  );
}
