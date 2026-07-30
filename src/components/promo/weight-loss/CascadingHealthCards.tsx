"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CarePlanHeroSlider } from "@/components/promo/weight-loss/CarePlanHeroSlider";
import "./cascading-health-cards.css";

gsap.registerPlugin(ScrollTrigger);

type CascadeFeature = {
  eyebrow: string;
  title: string;
  description: string;
  image: string | null;
  useTabletSlider?: boolean;
  carePlanSlider?: boolean;
  glass?: boolean;
};

const features: CascadeFeature[] = [
  {
    eyebrow: "YOUR BASELINE",
    title: "Start with a complete view of your health",
    description:
      "Test the biomarkers that reveal where your health needs attention first.",
    image: "/images/membership/slide_1.png",
    useTabletSlider: true,
  },
  {
    eyebrow: "YOUR RESULTS",
    title: "See all your health data in one place",
    description:
      "Understand your results, monitor changes and connect the patterns across your health.",
    image: "/images/portal/webp/01-overview-dashboard.webp",
  },
  {
    eyebrow: "YOUR ACTION PLAN",
    title: "Turn your results into precise care",
    description:
      "Receive a doctor-led plan shaped by your biomarkers, health history and goals.",
    image: null,
    carePlanSlider: true,
  },
  {
    eyebrow: "ONGOING CARE",
    title: "Stay supported as your health changes",
    description:
      "Access your Australian care team, follow your progress and adjust your plan when needed.",
    image: "/images/membership/Slide_4.png",
    useTabletSlider: true,
    glass: true,
  },
];

export function CascadingHealthCards() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".cascade-card");

      cards.forEach((card, index) => {
        if (index === cards.length - 1) return;

        const followingCard = cards[index + 1];
        const inner = card.querySelector<HTMLElement>(".cascade-card-inner");
        if (!inner || !followingCard) return;

        gsap.to(inner, {
          scale: 0.94,
          y: -18,
          opacity: 0.82,
          ease: "none",
          scrollTrigger: {
            trigger: followingCard,
            start: "top 82%",
            end: "top 18%",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });
    }, section);

    const images = section.querySelectorAll("img");
    const onLoad = () => ScrollTrigger.refresh();
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onLoad);
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      images.forEach((img) => img.removeEventListener("load", onLoad));
      context.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="cascade-section"
      aria-label="What your membership includes"
    >
      <div className="cascade-list">
        {features.map((feature, index) => {
          const fullBleed =
            feature.useTabletSlider || feature.carePlanSlider;

          return (
            <article
              key={feature.title}
              className={`cascade-card${
                fullBleed ? " cascade-card--tablet" : ""
              }${feature.carePlanSlider ? " cascade-card--care-plan" : ""}${
                feature.glass ? " cascade-card--glass" : ""
              }`}
              style={{ "--card-index": index } as CSSProperties}
            >
              <div className="cascade-card-inner">
                {feature.carePlanSlider ? (
                  <CarePlanHeroSlider />
                ) : feature.useTabletSlider ? (
                  <div className="cascade-card-visual cascade-card-visual--tablet">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="cascade-tablet-static"
                      src={feature.image!}
                      alt={feature.title}
                    />
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
