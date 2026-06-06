"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Scale, Ruler, ArrowRight } from "lucide-react";

export function BMICalculator() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [bmiValue, setBmiValue] = useState<number | null>(null);

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

  // Calculate BMI when height or weight changes
  useEffect(() => {
    const heightNum = Number.parseFloat(height);
    const weightNum = Number.parseFloat(weight);

    if (heightNum > 0 && weightNum > 0) {
      const heightInMeters = heightNum / 100;
      const bmi = weightNum / (heightInMeters * heightInMeters);
      setBmiValue(Math.round(bmi * 10) / 10);
    } else {
      setBmiValue(null);
    }
  }, [height, weight]);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "#7e9a72" };
    if (bmi < 25) return { label: "Normal", color: "#5c7a52" };
    if (bmi < 30) return { label: "Overweight", color: "#c17a58" };
    return { label: "Obese", color: "#a9634a" };
  };

  const bmiCategory = bmiValue ? getBMICategory(bmiValue) : null;

  return (
    <section ref={sectionRef} className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#5c7a52]/5 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mid-Page Outcome Reinforcement */}
        <div
          className={`
            max-w-xl mx-auto mb-10 p-4 bg-[#5c7a52]/10 rounded-xl text-center transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <p className="text-[#5c7a52] font-medium">
            Most patients experience meaningful weight loss within the first 3 months.
          </p>
        </div>

        {/* Header */}
        <div
          className={`
            text-center mb-10 transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            Check if you may be{" "}
            <span className="text-[#5c7a52] italic">eligible</span>
          </h2>
          <p className="text-lg text-[#5c7a52]">
            Use our BMI calculator to see if you may qualify for treatment.
          </p>
        </div>

        {/* Calculator Card */}
        <div
          className={`
            bg-[#f4f7f2] rounded-3xl p-8 lg:p-12 border border-[#e6ebe3] max-w-xl mx-auto
            transition-all duration-700 delay-200
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
              <Scale className="w-8 h-8 text-[#5c7a52]" />
            </div>
            <h3 className="text-xl font-serif text-[#2c3628] mb-2">
              BMI Calculator
            </h3>
            <p className="text-sm text-[#7e9a72]">
              Most eligible candidates have a BMI of 27+
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            {/* Height Input */}
            <div>
              <label htmlFor="bmi-height" className="flex items-center gap-2 text-sm text-[#5c7a52] mb-2">
                <Ruler className="w-4 h-4" />
                Height (cm)
              </label>
              <input
                type="number"
                id="bmi-height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 165"
                min="100"
                max="250"
                className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-[#f4f7f2] text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 transition-all"
              />
            </div>

            {/* Weight Input */}
            <div>
              <label htmlFor="bmi-weight" className="flex items-center gap-2 text-sm text-[#5c7a52] mb-2">
                <Scale className="w-4 h-4" />
                Weight (kg)
              </label>
              <input
                type="number"
                id="bmi-weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 75"
                min="30"
                max="300"
                className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-[#f4f7f2] text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 transition-all"
              />
            </div>

            {/* BMI Result */}
            {bmiValue !== null && (
              <div className="pt-4 border-t border-[#e6ebe3] animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-[#7e9a72]">Your BMI</span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-3xl font-serif"
                      style={{ color: bmiCategory?.color }}
                    >
                      {bmiValue}
                    </span>
                    <span className="text-sm text-[#7e9a72]">kg/m²</span>
                  </div>
                </div>

                {/* BMI Scale Visual */}
                <div className="relative h-3 rounded-full bg-gradient-to-r from-[#5c7a52] via-[#7e9a72] via-[#c17a58] to-[#a9634a] mb-2 overflow-hidden">
                  <div
                    className="absolute top-0 w-1 h-full bg-white shadow-md rounded-full transition-all duration-500"
                    style={{
                      left: `${Math.min(Math.max(((bmiValue - 15) / 30) * 100, 0), 100)}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>

                {/* Scale Labels */}
                <div className="flex justify-between text-xs text-[#a8bb9e] mb-4">
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>

                {/* Category Badge */}
                <div className="flex justify-center mb-3">
                  <span
                    className="px-4 py-2 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: bmiCategory?.color }}
                  >
                    {bmiCategory?.label}
                  </span>
                </div>

                {/* Eligibility Note */}
                {bmiValue >= 27 ? (
                  <div className="p-4 rounded-xl bg-[#5c7a52]/10 text-center">
                    <p className="text-sm text-[#5c7a52] font-medium mb-3">
                      You may be eligible for our program
                    </p>
                    <Link
                      href="/weight-management/assessment"
                      className="group inline-flex items-center gap-2 bg-[#5c7a52] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#4a6343] transition-colors"
                    >
                      Start your assessment
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ) : bmiValue >= 25 ? (
                  <div className="p-4 rounded-xl bg-[#c17a58]/10 text-center">
                    <p className="text-sm text-[#c17a58] font-medium mb-3">
                      You may be eligible with weight-related health conditions
                    </p>
                    <Link
                      href="/weight-management/assessment"
                      className="group inline-flex items-center gap-2 bg-[#c17a58] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#a9634a] transition-colors"
                    >
                      Check your eligibility
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#e6ebe3] text-center">
                    <p className="text-sm text-[#7e9a72]">
                      Our program is designed for BMI 27+. Speak to your GP for advice.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder when no BMI calculated */}
            {bmiValue === null && (
              <div className="pt-4 border-t border-[#e6ebe3] text-center">
                <p className="text-sm text-[#a8bb9e]">
                  Enter your height and weight to calculate your BMI
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
