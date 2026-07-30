"use client";

import { useEffect, useState } from "react";
import "./sanative-tablet-slider.css";

/**
 * Faithful port of sanative_tablet_slider_package (index.html + slider.js).
 * Static hero; only the three supplied screenshots cycle inside .tablet-screen.
 */
const slides = [
  {
    src: "/images/tablet-slider/sanative-overview.png",
    alt: "Sanative health overview dashboard",
  },
  {
    src: "/images/tablet-slider/sanative-categories.png",
    alt: "Sanative health category dashboard",
  },
  {
    src: "/images/tablet-slider/sanative-scores.png",
    alt: "Sanative health score dashboard",
  },
] as const;

export function SanativeTabletSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="sanative-hero" aria-label="Sanative membership">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="sanative-hero__background"
        src="/images/tablet-slider/sanative-hero-clean.jpg"
        alt="Woman holding a tablet displaying the Sanative health dashboard"
      />

      {/*
        This layer is clipped and transformed so only the supplied program
        screenshots change. The woman, tablet frame, text and background remain static.
      */}
      <div className="tablet-screen" aria-live="polite">
        <div className="tablet-screen__track">
          {slides.map((slide, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slide.src}
              className={`tablet-screen__slide${
                index === active ? " is-active" : ""
              }`}
              src={slide.src}
              alt={slide.alt}
              draggable={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
