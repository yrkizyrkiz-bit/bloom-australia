import type { CSSProperties, ReactNode } from "react";
import "./sanative-journey.css";

type JourneyStep = {
  number: string;
  title: string;
  description: string;
  image: string;
  image800: string;
  alt: string;
};

const steps: JourneyStep[] = [
  {
    number: "01",
    title: "Check your health",
    description:
      "All our programs start with a comprehensive health check. Choose the Sanative biomarker panel (85+ markers) for holistic insight into your health for $1/day.",
    image: "/images/membership/Main_slide1.webp",
    image800: "/images/membership/Main_slide1-800.webp",
    alt: "Sanative biomarker health check on a tablet",
  },
  {
    number: "02",
    title: "Doctor consultation",
    description:
      "A telehealth consultation with an AHPRA registered doctor. Share your health history and goals so we can tailor insights to you. Get your pathology referral for your blood test.",
    image: "/images/membership/Main_slide1b.webp",
    image800: "/images/membership/Main_slide1b-800.webp",
    alt: "Sanative doctor consultation and care guidance",
  },
  {
    number: "03",
    title: "Get your biomarker results",
    description:
      "After completing your blood test, clear results appear with insight. Monitor health changes, targets and progress over time, all in one place on the Sanative app.",
    image: "/images/membership/Main_Slide_3.webp",
    image800: "/images/membership/Main_Slide_3-800.webp",
    alt: "Sanative app showing biomarker results",
  },
  {
    number: "04",
    title: "Unlock your health action plan",
    description:
      "Join the many staying ahead of their health with preventative care, customised based on your results, or unlock any Sanative program with your first month membership on us.",
    image: "/images/membership/Main_Slide_4.webp",
    image800: "/images/membership/Main_Slide_4-800.webp",
    alt: "Sanative personalised health action plan",
  },
];

const stats = [
  { value: "85+", label: "Biomarkers available" },
  { value: "100%", label: "AHPRA-registered" },
  { value: "100%", label: "Australian doctors" },
  { value: "24hrs", label: "Typical doctor response" },
];

type SanativeJourneyProps = {
  fullWidth?: boolean;
  heading?: ReactNode;
  subheading?: string;
};

export function SanativeJourney({
  fullWidth = false,
  heading = (
    <>
      How <em>sanative</em> works
    </>
  ),
  subheading = "Healthcare that fits your life. No waiting rooms, no hassle.",
}: SanativeJourneyProps) {
  return (
    <section
      id="how-it-works"
      className={`journey-section${fullWidth ? " journey-section--full" : ""}`}
      aria-label="How Sanative works"
    >
      <header className="journey-heading">
        <h2>{heading}</h2>
        <p>{subheading}</p>
      </header>

      <div className="journey-stack">
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

            <div className="journey-card__visual">
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${step.image800} 800w, ${step.image} 1200w`}
                  sizes={
                    fullWidth
                      ? "(max-width: 767px) 100vw, 80vw"
                      : "(max-width: 767px) 100vw, 55vw"
                  }
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.image} alt={step.alt} loading="lazy" />
              </picture>
            </div>
          </article>
        ))}
      </div>

      <div className="journey-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="journey-stats__item">
            <p className="journey-stats__value">{stat.value}</p>
            <p className="journey-stats__label">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
