"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Users, HeartHandshake, Fingerprint } from "lucide-react";

const trustItems = [
  {
    icon: Lock,
    title: "Secure & confidential",
    description: "Your health data is protected with bank-level encryption",
  },
  {
    icon: Users,
    title: "Australian clinicians",
    description: "AHPRA-registered doctors based in Australia",
  },
  {
    icon: HeartHandshake,
    title: "Ongoing support",
    description: "Continuous care throughout your journey",
  },
  {
    icon: Fingerprint,
    title: "Personalised care",
    description: "Treatment tailored to your unique biology",
  },
];

export function TrustSection() {
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-10 lg:py-14 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#f4f7f2]" />

      {/* Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#cdd8c6] to-transparent" />

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#cdd8c6] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, index) => (
            <div
              key={item.title}
              className={`
                text-center transition-all duration-700
                ${isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
                }
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm border border-[#e6ebe3] flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-[#5c7a52]" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-serif text-[#2c3628] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#5c7a52]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
