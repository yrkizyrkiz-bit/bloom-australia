"use client";

import type { CSSProperties } from "react";
import Image from "next/image";

import { lpImages } from "@/lib/lp/weight-management";

import { useLpGender } from "./gender-context";
import { HoneycombVisual } from "./honeycomb-visual";
import "./whats-included.css";

const slides = [
  {
    number: "01",
    title: "Medical weight loss pack",
    body: "Everything required to get started is delivered in a compact, discreet pack.",
    image: lpImages.treatment,
    alt: "Sanative clinician holding a Sanative treatment box",
    fit: "cover" as const,
  },
  {
    number: "02",
    title: "Sanative weight loss app",
    body: "Your weight loss program, tracked in an AI-powered app, meals, movement, treatment and progress in one place.",
    image: lpImages.inApp,
    alt: "Sanative app on two phones showing meals, weight tracking and care team",
    fit: "cover" as const,
  },
  {
    number: "03",
    title: "Comprehensive health check",
    body: "Results explained in the app, so you understand how your organs and health markers are tracking with respect to your weight loss plan.",
    visual: "honeycomb" as const,
  },
  {
    number: "04",
    title: "Doctor consultations and ongoing follow-up",
    body: "Experienced Sanative doctors review your health, explain your results, and adjust your weight management plan as you progress.",
    image: lpImages.doctorScreens,
    alt: "Sanative doctor with app screens for consults, progress and care messages",
    fit: "doctor" as const,
  },
  {
    number: "05",
    title: "Ongoing care by your care team",
    body: "Your Care Partner, health coach and clinical team stay with you between consults.",
    image: lpImages.ongoingCare,
    alt: "Member using the Sanative app on her phone for ongoing care",
    fit: "cover" as const,
  },
];

function slideImage(slide: (typeof slides)[number], isMale: boolean) {
  if (slide.number === "05" && isMale) {
    return {
      src: lpImages.ongoingCareMale,
      alt: "Members reviewing their Sanative care and treatment pack together",
      className: "wm-included-card__img wm-included-card__img--care-male",
    };
  }
  if (!("image" in slide)) return null;
  return {
    src: slide.image,
    alt: slide.alt,
    className:
      slide.fit === "contain"
        ? "wm-included-card__img wm-included-card__img--contain"
        : slide.fit === "wide"
          ? "wm-included-card__img wm-included-card__img--wide"
          : slide.fit === "doctor"
            ? "wm-included-card__img wm-included-card__img--doctor"
            : "wm-included-card__img",
  };
}

export function WhatsIncluded() {
  const { gender } = useLpGender();
  const isMale = gender === "men";

  return (
    <section className="wm-included" aria-label="What's included">
      <header className="wm-included__header">
        <p>What's included</p>
        <h2>Everything you need to support your journey</h2>
      </header>

      <div className="wm-included__stack">
        {slides.map((slide, index) => {
          const image = slideImage(slide, isMale);
          return (
            <article
              className="wm-included-card"
              key={slide.number}
              style={{ "--card-index": index } as CSSProperties}
            >
              <div className="wm-included-card__copy">
                <span className="wm-included-card__number">{slide.number}</span>
                <h3>{slide.title}</h3>
                <p>{slide.body}</p>
              </div>

              <div
                className={`wm-included-card__visual${
                  "visual" in slide && slide.visual === "honeycomb"
                    ? " wm-included-card__visual--honeycomb"
                    : ""
                }${
                  "fit" in slide && slide.fit === "contain"
                    ? " wm-included-card__visual--contain"
                    : ""
                }${"fit" in slide && slide.fit === "wide" ? " wm-included-card__visual--wide" : ""}`}
              >
                {"visual" in slide && slide.visual === "honeycomb" ? (
                  <HoneycombVisual />
                ) : image ? (
                  <Image
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className={image.className}
                  />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
