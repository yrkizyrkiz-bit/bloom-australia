"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Scale, Ruler } from "lucide-react";

const eligibilityCriteria = [
  "BMI exceeding range",
  "Difficulty losing weight",
  "Ongoing cravings or hunger",
  "Looking for medical support",
];

export function EligibilitySection() {
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
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (heightNum > 0 && weightNum > 0) {
      // BMI = weight (kg) / height (m)²
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
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#5c7a52]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            See if you may be{" "}
            <span className="text-[#5c7a52] italic">eligible</span>
          </h2>
          <p className="text-lg text-[#5c7a52]">
            Our programs are designed for adults who meet specific health criteria
          </p>
        </div>

        {/* Main Card */}
        <div
          className={`
            bg-white rounded-[32px] shadow-xl border border-[#e6ebe3] overflow-hidden
            transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="grid lg:grid-cols-2">
            {/* Left - Checklist */}
            <div className="p-8 lg:p-12">
              <h3 className="text-2xl font-serif text-[#2c3628] mb-6">
                You may be eligible if you have:
              </h3>
              <div className="space-y-4 mb-8">
                {eligibilityCriteria.map((item, index) => (
                  <div
                    key={item}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl bg-[#f4f7f2] border border-[#e6ebe3]
                      transition-all duration-500
                      ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
                    `}
                    style={{ transitionDelay: `${200 + index * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#34412f] font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/weight-management/assessment"
                className="group inline-flex items-center gap-3 btn-primary text-lg px-8 py-4 w-full justify-center lg:w-auto"
              >
                Check your eligibility
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right - BMI Calculator */}
            <div className="bg-gradient-to-br from-[#f4f7f2] to-[#e6ebe3] p-8 lg:p-12 flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
                  <Scale className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h4 className="text-xl font-serif text-[#2c3628] mb-2">
                  BMI Calculator
                </h4>
                <p className="text-sm text-[#7e9a72]">
                  Most eligible candidates have a BMI of 27+
                </p>
              </div>

              {/* BMI Calculator Form */}
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                {/* Height Input */}
                <div>
                  <label htmlFor="height" className="flex items-center gap-2 text-sm text-[#5c7a52] mb-2">
                    <Ruler className="w-4 h-4" />
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 170"
                    min="100"
                    max="250"
                    className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-[#f4f7f2] text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 transition-all"
                  />
                </div>

                {/* Weight Input */}
                <div>
                  <label htmlFor="weight" className="flex items-center gap-2 text-sm text-[#5c7a52] mb-2">
                    <Scale className="w-4 h-4" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
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
                      <div className="p-3 rounded-xl bg-[#5c7a52]/10 text-center">
                        <p className="text-sm text-[#5c7a52] font-medium">
                          You may be eligible for our program
                        </p>
                      </div>
                    ) : bmiValue >= 25 ? (
                      <div className="p-3 rounded-xl bg-[#c17a58]/10 text-center">
                        <p className="text-sm text-[#c17a58]">
                          You may be eligible with weight-related health conditions
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#e6ebe3] text-center">
                        <p className="text-sm text-[#7e9a72]">
                          Our program is designed for BMI 27+
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
        </div>
      </div>
    </section>
  );
}
