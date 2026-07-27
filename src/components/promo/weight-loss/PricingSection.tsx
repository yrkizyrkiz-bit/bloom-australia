"use client";

import Image from "next/image";

/**
 * Pricing / CTA band — lifestyle image with left-side slogan.
 */
export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[#e6ebe3]" />
      <div className="relative w-full">
        <h2 className="sr-only">We&apos;re behind you all the way</h2>
        <Image
          src="/images/weight-management/cta-hero.webp"
          alt="Sanative member outdoors — we're behind you all the way"
          width={1024}
          height={576}
          className="w-full h-auto object-cover"
          sizes="100vw"
          priority={false}
        />
        {/* Above the fence; second line = "all the way" */}
        <div className="pointer-events-none absolute inset-0">
          <p className="absolute left-[20%] top-[22%] max-w-[14ch] text-[clamp(1.6rem,5vw,6rem)] font-serif text-white leading-[1.1] tracking-tight drop-shadow-[0_2px_16px_rgba(30,40,25,0.4)]">
            We&apos;re behind you
            <br />
            <span className="italic text-white/95">all the way</span>
          </p>
        </div>
      </div>
    </section>
  );
}
