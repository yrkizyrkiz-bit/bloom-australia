"use client";

import type { CSSProperties } from "react";
import "./cascading-health-cards.css";

type CascadeFeature = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  /** Smaller src for narrow viewports */
  imageMobile?: string;
};

/**
 * WM membership cascade — slide order matches product journey:
 * 01 Check your Health → 05 Ongoing care.
 * Assets: optimized WebP (1280 / 800) under /images/membership/wm-slides/.
 */
const features: CascadeFeature[] = [
  {
    eyebrow: "01",
    title: "Check your Health",
    description:
      "Your Sanative membership unlocks comprehensive biomarker analysis.",
    image: "/images/membership/wm-slides/slide-01.webp",
    imageMobile: "/images/membership/wm-slides/slide-01-800.webp",
  },
  {
    eyebrow: "02",
    title: "Doctor consultation",
    description:
      "Your biomarkers reviewed. Your goals understood. Your weight management program precisely tailored.",
    image: "/images/membership/wm-slides/slide-02.webp",
    imageMobile: "/images/membership/wm-slides/slide-02-800.webp",
  },
  {
    eyebrow: "03",
    title: "Personalised care plan",
    description:
      "Our medical care team will transform your numbers into a weight loss action plan.",
    image: "/images/membership/wm-slides/slide-03.webp",
    imageMobile: "/images/membership/wm-slides/slide-03-800.webp",
  },
  {
    eyebrow: "04",
    title: "All in one place",
    description:
      "See your health score, biological age, biomarker results and care plan together in one simple view.",
    image: "/images/membership/wm-slides/slide-04.webp",
    imageMobile: "/images/membership/wm-slides/slide-04-800.webp",
  },
  {
    eyebrow: "05",
    title: "Ongoing care",
    description:
      "Contact your care partner anytime for support with your weight loss journey.",
    image: "/images/membership/wm-slides/slide-05.webp",
    imageMobile: "/images/membership/wm-slides/slide-05-800.webp",
  },
];

export function CascadingHealthCards() {
  return (
    <section
      className="cascade-section"
      aria-label="What your membership includes"
    >
      <div className="cascade-list">
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className="cascade-card cascade-card--tablet"
            style={{ "--card-index": index } as CSSProperties}
          >
            <div className="cascade-card-inner">
              <div className="cascade-card-visual cascade-card-visual--tablet">
                <picture>
                  {feature.imageMobile ? (
                    <source
                      media="(max-width: 900px)"
                      srcSet={feature.imageMobile}
                      type="image/webp"
                    />
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="cascade-tablet-static"
                    src={feature.image}
                    alt={feature.title}
                    width={1280}
                    height={720}
                    decoding="async"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                </picture>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
