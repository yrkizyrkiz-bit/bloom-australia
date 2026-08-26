import type { CSSProperties } from "react";
import Link from "next/link";
import "@/components/promo/sections/sanative-journey.css";
import "./labs-roadmap-cascade.css";

type RoadmapStep = {
  number: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

const steps: RoadmapStep[] = [
  {
    number: "01",
    title: "Your personalised Action Plan",
    description:
      "Turn your biomarker results into a clear roadmap, habits, nutrition and further care when clinically appropriate.",
    image: "/images/membership/Action_planPM.webp",
    alt: "Action Plan, Sanative health overview on the beach at sunset",
  },
  {
    number: "02",
    title: "Discover where your health needs attention",
    description:
      "Your lab results reveal where to focus, with risk assessment and detailed risk factors.",
    image: "/images/membership/RIsk_factors.webp",
    alt: "Sanative risk factors, discover where your health needs attention",
  },
  {
    number: "03",
    title: "Set your health goals based on your health needs",
    description:
      "Reduce your risk through lifestyle changes and if eligible, access to treatment.",
    image: "/images/membership/health_goals.webp",
    alt: "Sanative Health Goals, set biomarker targets and track progress",
  },
  {
    number: "04",
    title: "Medical treatment and ongoing care",
    description:
      "Sanative care team will review your results and goals, with medical treatment available if needed to achieve your health goals.",
    image: "/images/membership/sanative-doctor-screens.webp",
    alt: "Sanative doctor with personalised care insights and treatment guidance",
  },
  {
    number: "05",
    title: "Monitor and track your health progress",
    description:
      "Track your progress between blood tests over time, measure your improvements, achieve your goals.",
    image: "/images/membership/results_app.webp",
    alt: "Sanative results app, monitor and track your health progress",
  },
];

/** Cascading roadmap cards, same sticky stack pattern as How Sanative works. */
export function LabsRoadmapCascade() {
  return (
    <section
      id="roadmap"
      className="journey-section !bg-[#fdfbf7] !overflow-visible"
      aria-label="Results that come with a roadmap"
    >
      <header className="journey-heading">
        <h2>
          Results that come with <em>a roadmap</em>
        </h2>
        <p>
          Customised from your results, habit building, nutrition plans, and
          further care if clinically appropriate.
        </p>
      </header>

      <div className="journey-stack labs-roadmap-stack">
        {steps.map((step, index) => (
          <article
            className="journey-card"
            key={step.number}
            style={{ "--card-index": index } as CSSProperties}
          >
            <div className="journey-card__copy">
              <span className="journey-card__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>

            <div
              className={`journey-card__visual labs-roadmap-visual${
                index === 0 || index === 1
                  ? " labs-roadmap-visual--hero"
                  : ""
              }`}
            >
              {index === 0 || index === 1 ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cards 1–2 wrap edge-to-edge
                <img
                  className={`labs-roadmap-visual__cover${
                    index === 1 ? " labs-roadmap-visual__cover--slide-2" : ""
                  }`}
                  src={step.image}
                  alt={step.alt}
                  loading="lazy"
                />
              ) : (
                <>
                  {/* Bleed layer, wraps the card edge-to-edge */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="labs-roadmap-visual__bleed"
                    src={step.image}
                    alt=""
                    aria-hidden
                    loading="lazy"
                  />
                  {/* Fit layer, full image visible, no top/bottom crop */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="labs-roadmap-visual__fit"
                    src={step.image}
                    alt={step.alt}
                    loading="lazy"
                  />
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 lg:mt-14 flex flex-wrap justify-center gap-4">
        <Link href="/biomarker-intake" className="btn-primary">
          Start testing
        </Link>
      </div>
    </section>
  );
}
