"use client";

import type { CSSProperties } from "react";
import "./cascading-health-cards.css";

type CascadeFeature = {
  eyebrow: string;
  title: string;
  description: string;
  image: string | null;
  /** Portrait 9:16 art for full-screen mobile cascade */
  imageMobile?: string | null;
  useTabletSlider?: boolean;
};

const features: CascadeFeature[] = [
  {
    eyebrow: "YOUR BASELINE",
    title: "Start with a complete view of your health",
    description:
      "Test the biomarkers that reveal where your health needs attention first.",
    image: "/images/membership/slide_1.webp",
    imageMobile: "/images/membership/mobile/slide_1_mobile.webp?v=3",
    useTabletSlider: true,
  },
  {
    eyebrow: "YOUR RESULTS",
    title: "See all your health data in one place",
    description:
      "Understand your results, monitor changes and connect the patterns across your health.",
    image: "/images/membership/slide_2.webp",
    imageMobile: "/images/membership/mobile/slide_2_mobile.webp?v=2",
    useTabletSlider: true,
  },
  {
    eyebrow: "YOUR ACTION PLAN",
    title: "Turn your results into precise care",
    description:
      "Receive a doctor-led plan shaped by your biomarkers, health history and goals.",
    image: "/images/membership/Slide_3.webp",
    imageMobile: "/images/membership/mobile/slide_3_mobile.webp?v=2",
    useTabletSlider: true,
  },
  {
    eyebrow: "ONGOING CARE",
    title: "Stay supported as your health changes",
    description:
      "Access your Australian care team, follow your progress and adjust your plan when needed.",
    image: "/images/membership/Slide_4.webp",
    imageMobile: "/images/membership/mobile/slide_4_mobile.webp?v=2",
    useTabletSlider: true,
  },
  {
    eyebrow: "YOUR JOURNEY",
    title: "Keep improving with every check-in",
    description:
      "Revisit your biomarkers, refine your plan and build lasting habits with continuous clinical guidance.",
    image: "/images/membership/slide_5.webp",
    imageMobile: "/images/membership/mobile/slide_5_mobile.webp?v=2",
    useTabletSlider: true,
  },
];

export function CascadingHealthCards() {
  return (
    <section
      className="cascade-section"
      aria-label="What your membership includes"
    >
      <div className="cascade-list">
        {features.map((feature, index) => {
          const fullBleed = feature.useTabletSlider;

          return (
            <article
              key={feature.title}
              className={`cascade-card${
                fullBleed ? " cascade-card--tablet" : ""
              }`}
              style={{ "--card-index": index } as CSSProperties}
            >
              <div className="cascade-card-inner">
                {feature.useTabletSlider ? (
                  <div className="cascade-card-visual cascade-card-visual--tablet">
                    <picture>
                      {feature.imageMobile ? (
                        <source
                          media="(max-width: 900px)"
                          srcSet={feature.imageMobile}
                        />
                      ) : null}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="cascade-tablet-static"
                        src={feature.image!}
                        alt={feature.title}
                      />
                    </picture>
                  </div>
                ) : (
                  <>
                    <div className="cascade-card-copy">
                      <p className="cascade-eyebrow">{feature.eyebrow}</p>
                      <h3>{feature.title}</h3>
                      <p className="cascade-description">
                        {feature.description}
                      </p>
                    </div>
                    <div className="cascade-card-visual">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={feature.image!} alt="" loading="lazy" />
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
