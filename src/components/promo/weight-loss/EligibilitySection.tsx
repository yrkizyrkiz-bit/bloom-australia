"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Scale, Ruler } from "lucide-react";
import { calculateBmi } from "@/lib/bmi";

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
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (heightNum > 0 && weightNum > 0) {
      setBmiValue(calculateBmi(weightNum, heightNum));
    } else {
      setBmiValue(null);
    }
  }, [height, weight]);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "#84956f" };
    if (bmi < 25) return { label: "Normal", color: "#7b8967" };
    if (bmi < 30) return { label: "Overweight", color: "#5d6a4d" };
    return { label: "Obese", color: "#313630" };
  };

  const bmiCategory = bmiValue ? getBMICategory(bmiValue) : null;

  return (
    <section
      id="bmi"
      ref={sectionRef}
      className="relative pt-6 pb-12 lg:pt-8 lg:pb-16 overflow-hidden bg-white scroll-mt-24"
    >
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#7b8967]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-[#d3e0db]/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-[clamp(1.85rem,3.2vw,2.75rem)] font-medium text-[#313630] leading-[1.05] tracking-[-0.02em] mb-4">
            See if you may be{" "}
            <span className="text-[#7b8967]">eligible</span>
          </h2>
          <p className="text-lg text-[rgba(0,0,0,0.5)]">
            Our programs are designed for adults who meet specific health
            criteria
          </p>
        </div>

        <div
          className={`
            bg-white rounded-[32px] shadow-[0_16px_40px_rgba(49,54,48,0.1)] border border-[#d3e0db] overflow-hidden
            transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <h3 className="text-2xl font-medium text-[#313630] tracking-tight mb-6">
                You may be eligible if you have:
              </h3>
              <div className="space-y-4 mb-8">
                {eligibilityCriteria.map((item, index) => (
                  <div
                    key={item}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl bg-[#f5faf6] border border-[#d3e0db]
                      transition-all duration-500
                      ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
                    `}
                    style={{ transitionDelay: `${200 + index * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#7b8967] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#313630] font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/weight-management/assessment"
                className="group inline-flex items-center gap-3 bg-[#313630] text-white text-lg font-semibold px-8 py-4 rounded-full w-full justify-center lg:w-auto hover:bg-[#3f4740] transition-colors"
              >
                Check your eligibility
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-[#f5faf6] p-8 lg:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#d3e0db]">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg border border-[#d3e0db] mb-4">
                  <Scale className="w-8 h-8 text-[#7b8967]" />
                </div>
                <h4 className="text-xl font-medium text-[#313630] tracking-tight mb-2">
                  BMI Calculator
                </h4>
                <p className="text-sm text-[rgba(0,0,0,0.5)]">
                  Most eligible candidates have a BMI of 27+
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#d3e0db] space-y-5">
                <div>
                  <label
                    htmlFor="height"
                    className="flex items-center gap-2 text-sm text-[rgba(0,0,0,0.55)] mb-2"
                  >
                    <Ruler className="w-4 h-4 text-[#7b8967]" />
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
                    className="w-full px-4 py-3 rounded-xl border border-[#d3e0db] bg-[#f5faf6] text-[#313630] placeholder:text-[rgba(0,0,0,0.35)] focus:outline-none focus:border-[#7b8967] focus:ring-2 focus:ring-[#7b8967]/20 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="weight"
                    className="flex items-center gap-2 text-sm text-[rgba(0,0,0,0.55)] mb-2"
                  >
                    <Scale className="w-4 h-4 text-[#7b8967]" />
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
                    className="w-full px-4 py-3 rounded-xl border border-[#d3e0db] bg-[#f5faf6] text-[#313630] placeholder:text-[rgba(0,0,0,0.35)] focus:outline-none focus:border-[#7b8967] focus:ring-2 focus:ring-[#7b8967]/20 transition-all"
                  />
                </div>

                {bmiValue !== null && (
                  <div className="pt-4 border-t border-[#d3e0db] animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-[rgba(0,0,0,0.5)]">
                        Your BMI
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-3xl font-medium tracking-tight"
                          style={{ color: bmiCategory?.color }}
                        >
                          {bmiValue.toFixed(1)}
                        </span>
                        <span className="text-sm text-[rgba(0,0,0,0.5)]">
                          kg/m²
                        </span>
                      </div>
                    </div>

                    <div className="relative h-3 rounded-full bg-gradient-to-r from-[#84956f] via-[#7b8967] via-[#5d6a4d] to-[#313630] mb-2 overflow-hidden">
                      <div
                        className="absolute top-0 w-1 h-full bg-white shadow-md rounded-full transition-all duration-500"
                        style={{
                          left: `${Math.min(Math.max(((bmiValue - 15) / 30) * 100, 0), 100)}%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-[rgba(0,0,0,0.4)] mb-4">
                      <span>18.5</span>
                      <span>25</span>
                      <span>30</span>
                      <span>40+</span>
                    </div>

                    <div className="flex justify-center mb-3">
                      <span
                        className="px-4 py-2 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: bmiCategory?.color }}
                      >
                        {bmiCategory?.label}
                      </span>
                    </div>

                    {bmiValue >= 27 ? (
                      <div className="p-3 rounded-xl bg-[#7b8967]/12 text-center">
                        <p className="text-sm text-[#7b8967] font-medium">
                          You may be eligible for our program
                        </p>
                      </div>
                    ) : bmiValue >= 25 ? (
                      <div className="p-3 rounded-xl bg-[#5d6a4d]/12 text-center">
                        <p className="text-sm text-[#5d6a4d]">
                          You may be eligible with weight-related health
                          conditions
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#e2ece7] text-center">
                        <p className="text-sm text-[rgba(0,0,0,0.5)]">
                          Our program is designed for BMI 27+
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {bmiValue === null && (
                  <div className="pt-4 border-t border-[#d3e0db] text-center">
                    <p className="text-sm text-[rgba(0,0,0,0.4)]">
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
