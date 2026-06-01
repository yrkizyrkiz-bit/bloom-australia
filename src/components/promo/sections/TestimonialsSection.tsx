"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      quote: "Sanative made the whole process so easy. I was nervous about telehealth, but my doctor was so understanding and professional. I've lost 12kg in 4 months and feel amazing.",
      name: "Michelle K.",
      age: 38,
      location: "Sydney, NSW",
      treatment: "Weight Management",
      result: "Lost 12kg",
      initials: "MK",
    },
    {
      id: 2,
      quote: "After years of trying everything for my hair loss, I finally found something that works. The minoxidil treatment has given me my confidence back. My hair is noticeably thicker.",
      name: "Jessica T.",
      age: 45,
      location: "Melbourne, VIC",
      treatment: "Hair Regrowth",
      result: "Fuller hair in 6 months",
      initials: "JT",
    },
    {
      id: 3,
      quote: "The comprehensive blood test was eye-opening. I discovered I had low vitamin D and iron, which explained my fatigue. My doctor created a treatment plan and I feel so much better now.",
      name: "Amanda R.",
      age: 52,
      location: "Brisbane, QLD",
      treatment: "Health Labs",
      result: "Improved energy",
      initials: "AR",
    },
    {
      id: 4,
      quote: "Managing menopause symptoms was overwhelming until I found Sanative. My doctor took the time to understand my symptoms and prescribed HRT that has made such a difference to my quality of life.",
      name: "Catherine M.",
      age: 54,
      location: "Perth, WA",
      treatment: "Menopause Care",
      result: "Symptom relief",
      initials: "CM",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#e8ede5] to-[#dce4d6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628]">
            Real people, <span className="text-[#5c7a52] italic">real results</span>
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52]">
            Join thousands of Australians taking control of their health
          </p>
        </div>

        {/* Main Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <Quote className="w-12 h-12 text-[#cdd8c6]" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#c17a58] text-[#c17a58]" />
                ))}
              </div>
            </div>

            <blockquote className="text-xl lg:text-2xl font-serif text-[#2c3628] leading-relaxed mb-8">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-[#e6ebe3]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7e9a72] to-[#5c7a52] flex items-center justify-center text-white font-medium text-lg">
                  {current.initials}
                </div>
                <div>
                  <p className="font-medium text-[#2c3628]">
                    {current.name}, {current.age}
                  </p>
                  <p className="text-sm text-[#5c7a52]">{current.location}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 rounded-full bg-[#e6ebe3] text-[#34412f] text-sm">
                  {current.treatment}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-[#c17a58]/10 text-[#c17a58] text-sm font-medium">
                  {current.result}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#34412f] hover:bg-[#e6ebe3] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-[#34412f]"
                      : "bg-[#a8bb9e]"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#34412f] hover:bg-[#e6ebe3] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[#5c7a52]">
          Results have not been independently verified. Individual results will vary.
        </p>
      </div>
    </section>
  );
}
