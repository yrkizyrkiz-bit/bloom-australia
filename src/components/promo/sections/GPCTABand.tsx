"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function GPCTABand() {
  return (
    <section className="bg-[#04342C] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-white/90 text-lg md:text-xl lg:text-2xl font-serif">
              Are you a GP?{" "}
              <span className="text-[#5DCAA5]">
                Refer your patients to a supervised health program
              </span>{" "}
              — with zero admin.
            </p>
          </div>
          <Link
            href="/for-doctors"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#04342C] font-medium rounded-full hover:bg-[#5DCAA5] hover:text-white transition-all duration-200 whitespace-nowrap group"
          >
            Learn more
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
