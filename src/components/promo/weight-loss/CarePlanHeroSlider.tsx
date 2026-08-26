"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./care-plan-hero-slider.css";

/**
 * Permanent care-plan phone slider:
 * - Static base (scene + hands + Dynamic Island)
 * - Pre-warped transparent overlays at the same 1672×941 size
 * - Opacity crossfade only, no live matrix / warp in the browser
 *
 * Bake: python3 scripts/bake-care-plan-overlays.py
 */
const BASE_SRC = "/images/care-plan-slider/care-plan-base.webp?v=opt-1";

const slides = [
  {
    src: "/images/care-plan-slider/overlays/overlay-01-treatment.webp?v=glass-clip-5",
    alt: "Sanative program status and meal planning on a phone",
  },
  {
    src: "/images/care-plan-slider/overlays/overlay-02-planner.webp?v=glass-clip-5",
    alt: "Sanative weekly meal planner on a phone",
  },
  {
    src: "/images/care-plan-slider/overlays/overlay-03-chat.webp?v=glass-clip-5",
    alt: "Sanative care partner chat on a phone",
  },
] as const;

const ROTATE_MS = 3800;

export function CarePlanHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (reducedMotion || slides.length < 2) return;
    const id = window.setInterval(() => {
      goToSlide(indexRef.current + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [goToSlide, reducedMotion]);

  return (
    <section
      className="care-plan-hero"
      aria-label="Sanative personalised care plan"
    >
      <div className="care-plan-hero__stack" aria-live="polite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="care-plan-hero__base"
          src={BASE_SRC}
          alt=""
          aria-hidden
          draggable={false}
        />
        {slides.map((slide, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            className={`care-plan-hero__slide${
              index === activeIndex ? " is-active" : ""
            }`}
            src={slide.src}
            alt={slide.alt}
            aria-hidden={index === activeIndex ? undefined : true}
            draggable={false}
          />
        ))}
      </div>

      <div className="care-plan-hero__dots" aria-label="Phone slide navigation">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={`care-plan-hero__dot${
              index === activeIndex ? " is-active" : ""
            }`}
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
