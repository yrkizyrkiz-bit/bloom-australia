"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  name: string;
  age: number;
  location: string;
  quote: string;
  weightLost: string;
  duration: string;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Rebecca M.",
    age: 42,
    location: "Sydney, NSW",
    quote: "For the first time in years, I don't think about food constantly. I feel like myself again.",
    weightLost: "",
    duration: "5 months",
    image: "/images/female-after-1.jpg",
  },
  {
    name: "Sarah K.",
    age: 38,
    location: "Melbourne, VIC",
    quote: "The biomarker testing showed me exactly what was going on with my hormones. Finally, a program that looks at the whole picture.",
    weightLost: "",
    duration: "4 months",
    image: "/images/female-after-2.jpg",
  },
  {
    name: "Michelle T.",
    age: 51,
    location: "Brisbane, QLD",
    quote: "After menopause, nothing worked. The doctors here actually understood my biology and created a plan that works for my body.",
    weightLost: "",
    duration: "7 months",
  },
];

export function SocialProofStrip() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={sectionRef} id="real-results" className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Is This You? Intro */}
        <div
          className={`
            max-w-2xl mx-auto mb-12 p-6 bg-[#f4f7f2] rounded-2xl border border-[#e6ebe3] transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h3 className="text-xl font-serif text-[#2c3628] mb-4 text-center">Is this you?</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm text-[#5c7a52]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c17a58]" />
              <span>Tried dieting but nothing sticks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c17a58]" />
              <span>Constant hunger or cravings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c17a58]" />
              <span>Losing weight then regaining it</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div
          className={`
            text-center mb-8 transition-all duration-700
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            Real people.{" "}
            <span className="text-[#5c7a52] italic">Real results.</span>
          </h2>
          <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Join thousands of Australians who have transformed their health with our doctor-led programs.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div
          className={`
            relative max-w-4xl mx-auto transition-all duration-700 delay-200
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          {/* Main Testimonial Card */}
          <div className="bg-[#f4f7f2] rounded-3xl p-8 lg:p-12 border border-[#e6ebe3]">
            <div className="grid md:grid-cols-5 gap-8 items-center">
              {/* Image Column */}
              <div className="md:col-span-2 flex justify-center">
                {testimonials[activeIndex].image ? (
                  <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={testimonials[activeIndex].image}
                      alt={testimonials[activeIndex].name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#2c3628]/80 to-transparent p-4">
                      <div className="text-white text-center">
                        <span className="block text-xs text-white/80">Patient for {testimonials[activeIndex].duration}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-2xl bg-[#e6ebe3] flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-sm text-[#7e9a72]">Patient for {testimonials[activeIndex].duration}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="md:col-span-3 space-y-4">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#c17a58] text-[#c17a58]" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-xl lg:text-2xl font-serif text-[#2c3628] leading-relaxed">
                  &ldquo;{testimonials[activeIndex].quote}&rdquo;
                </blockquote>

                {/* Attribution */}
                <div className="pt-4 border-t border-[#e6ebe3]">
                  <p className="font-medium text-[#2c3628]">
                    {testimonials[activeIndex].name}
                  </p>
                  <p className="text-sm text-[#7e9a72]">
                    {testimonials[activeIndex].age} · {testimonials[activeIndex].location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              type="button"
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-white border border-[#e6ebe3] flex items-center justify-center hover:bg-[#f4f7f2] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#5c7a52]" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${activeIndex === index ? "w-6 bg-[#5c7a52]" : "bg-[#cdd8c6]"}
                  `}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-white border border-[#e6ebe3] flex items-center justify-center hover:bg-[#f4f7f2] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#5c7a52]" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div
          className={`
            grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-8 pt-8 border-t border-[#e6ebe3]
            transition-all duration-700 delay-400
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-serif text-[#5c7a52]">12-15%</div>
            <p className="text-sm text-[#7e9a72] mt-1">Average weight loss*</p>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-serif text-[#5c7a52]">10,000+</div>
            <p className="text-sm text-[#7e9a72] mt-1">Consultations delivered</p>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-serif text-[#5c7a52]">Included</div>
            <p className="text-sm text-[#7e9a72] mt-1">Medication in program</p>
          </div>
        </div>

        {/* Outcome Reinforcement */}
        <div
          className={`
            max-w-2xl mx-auto mt-8 p-4 bg-[#5c7a52]/10 rounded-xl text-center transition-all duration-700 delay-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <p className="text-[#5c7a52] font-medium">
            Most patients notice reduced appetite within weeks, followed by steady and sustainable weight loss over time.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-[#a8bb9e] mt-6">
          *Results vary. Individual weight loss depends on adherence to treatment, diet, and lifestyle factors.
        </p>
      </div>
    </section>
  );
}
