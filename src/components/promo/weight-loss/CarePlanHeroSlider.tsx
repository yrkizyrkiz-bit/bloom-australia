"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./care-plan-hero-slider.css";

/**
 * Each slide is a full opaque card JPEG with the app screen already
 * warped into the phone glass (scripts/warp-care-plan-screens.py).
 * No overlay, no matrix3d — alignment is baked into the pixels.
 */
const slides = [
  {
    src: "/images/care-plan-slider/baked/card-goals.jpg",
    alt: "Sanative goals screen on a phone — get a personalized care plan",
  },
  {
    src: "/images/care-plan-slider/baked/card-treatment.jpg",
    alt: "Sanative program status screen on a phone",
  },
  {
    src: "/images/care-plan-slider/baked/card-planner.jpg",
    alt: "Sanative weekly meal planner screen on a phone",
  },
  {
    src: "/images/care-plan-slider/baked/card-trends.jpg",
    alt: "Sanative biomarker trends screen on a phone",
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
        {slides.map((slide, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            className={`care-plan-hero__slide${
              index === activeIndex ? " is-active" : ""
            }`}
            src={`${slide.src}?v=restored-better-1`}
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
