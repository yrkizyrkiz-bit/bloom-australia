"use client";

import type { CSSProperties } from "react";
import "@/components/promo/weight-loss/cascading-health-cards.css";

type CascadeFeature = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

const features: CascadeFeature[] = [
  {
    eyebrow: "Step 1",
    title: "Check your hair health",
    description:
      "Start with a doctor-led assessment and targeted biomarkers that reveal what’s driving your hair loss: hormones, thyroid, iron, nutrients, and more.",
    image: "/images/membership/hair_dressing_w.webp",
  },
  {
    eyebrow: "Step 2",
    title: "Get your personalised hair care plan",
    description:
      "Review your results with an AHPRA-registered doctor and receive a clear treatment plan shaped around your biology, goals, and stage of hair loss.",
    image: "/images/membership/Action_planPM.webp",
  },
  {
    eyebrow: "Step 3",
    title: "Care delivered. Support that stays.",
    description:
      "Your plan arrives at your door, with ongoing clinical check-ins, progress tracking, and real Care Partner support so you never navigate hair recovery alone.",
    image: "/images/supplements-pills.webp",
  },
];

export function HairHealthCascadeSection() {
  return (
    <section
      className="cascade-section"
      aria-label="Treatment with depth and vision"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-14">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
            Our approach
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-4">
            Treatment with{" "}
            <span className="text-[#5c7a52] italic">depth and vision</span>
          </h2>
          <p className="text-lg text-[#5c7a52]">
            We stand for a holistic, personalised treatment approach that goes
            far beyond conventional solutions and promotes natural, visible
            results.
          </p>
        </div>
      </div>

      <div className="cascade-list">
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className="cascade-card"
            style={{ "--card-index": index } as CSSProperties}
          >
            <div className="cascade-card-inner">
              <div className="cascade-card-copy">
                <p className="cascade-eyebrow">{feature.eyebrow}</p>
                <h3>{feature.title}</h3>
                <p className="cascade-description">{feature.description}</p>
              </div>
              <div className="cascade-card-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={feature.image} alt="" loading="lazy" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
