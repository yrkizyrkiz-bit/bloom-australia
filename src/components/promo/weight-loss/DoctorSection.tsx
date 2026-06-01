"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Shield, UserCheck, Stethoscope, BarChart } from "lucide-react";

const trustBullets = [
  {
    icon: UserCheck,
    text: "Australian-registered clinicians",
  },
  {
    icon: BarChart,
    text: "Clinical assessment, symptoms and medical history review",
  },
  {
    icon: Stethoscope,
    text: "Treatment prescribed only if appropriate",
  },
  {
    icon: Shield,
    text: "Ongoing monitoring, support and adjustments",
  },
];

export function DoctorSection() {
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
    <section ref={sectionRef} className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#5c7a52]/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Image */}
          <div
            className={`
              relative transition-all duration-700
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}
            `}
          >
            <div className="relative">
              {/* Main Image */}
              <div className="rounded-[32px] overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"
                  alt="Australian healthcare professionals"
                  width={600}
                  height={700}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* AHPRA Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#5c7a52]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#5c7a52]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7e9a72] uppercase tracking-wider">Registered</p>
                    <p className="text-lg font-serif text-[#2c3628]">AHPRA Doctors</p>
                  </div>
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full border-4 border-[#e6ebe3]" />
            </div>
          </div>

          {/* Right Column - Content */}
          <div
            className={`
              space-y-8 transition-all duration-700 delay-200
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
            `}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#5c7a52]/10 rounded-full px-4 py-2">
              <CheckCircle2 className="w-4 h-4 text-[#5c7a52]" />
              <span className="text-sm font-medium text-[#5c7a52]">Doctor-led care</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
              Beyond{" "}
              <span className="text-[#5c7a52] italic">online checkboxes</span>
            </h2>

            <p className="text-lg text-[#5c7a52] leading-relaxed">
              Unlike many online programs, we do not rely on a simple questionnaire alone. We use clinical review, symptoms and medical history to understand your situation. Where appropriate, testing may be used to help identify potential contributing factors — but it is not required for all patients.
            </p>

            {/* Trust Bullets */}
            <div className="space-y-4">
              {trustBullets.map((item, index) => (
                <div
                  key={item.text}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl bg-[#f4f7f2] border border-[#e6ebe3]
                    transition-all duration-500 hover:bg-[#e6ebe3]
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                  `}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#5c7a52]" />
                  </div>
                  <span className="text-[#34412f]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
