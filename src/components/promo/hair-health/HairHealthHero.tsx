"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./HairHealthHero.module.css";

type Gender = "men" | "women";

type HairHealthHeroProps = {
  gender: Gender;
  onGenderChange: (gender: Gender) => void;
};

const HAIR_IMAGES: Record<Gender, { src: string; alt: string; caption: string }> = {
  women: {
    src: "/images/hair-health/hero-women.webp",
    alt: "Woman with healthy hair",
    caption: "Doctor-led care for female hair health",
  },
  men: {
    src: "/images/hair-health/hero-men.webp",
    alt: "Man with healthy hair",
    caption: "Doctor-led care for male hair health",
  },
};

/**
 * Hair health membership hero, mirrors WeightLossMembershipHero richness
 * (radial greens, large type, bento cards) with the hair-page palette and
 * a male/female toggle. Two cards: biomarkers + gender portrait.
 */
export function HairHealthHero({ gender, onGenderChange }: HairHealthHeroProps) {
  const portrait = HAIR_IMAGES[gender];

  return (
    <section className={styles.hero} aria-labelledby="hair-health-heading">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div>
            <div className={styles.eyebrowRow}>
              <p className={styles.eyebrow}>More than a hair-loss treatment</p>
              <div className={styles.toggle} role="group" aria-label="Select gender">
                <span className={styles.toggleLabel}>I am</span>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${
                    gender === "women" ? styles.toggleBtnActive : ""
                  }`}
                  aria-pressed={gender === "women"}
                  onClick={() => onGenderChange("women")}
                >
                  Female
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${
                    gender === "men" ? styles.toggleBtnActive : ""
                  }`}
                  aria-pressed={gender === "men"}
                  onClick={() => onGenderChange("men")}
                >
                  Male
                </button>
              </div>
            </div>

            <h1 id="hair-health-heading" className={styles.heading}>
              <span className={styles.headingLine}>The best treatment</span>
              <span className={styles.headingLine}>
                for a fuller head of hair
              </span>
            </h1>
          </div>

          <div className={styles.summary}>
            <ul className={styles.points}>
              <li>Modern treatment for hair loss</li>
              <li>Doctor phone consultation</li>
              <li>Delivered to your door</li>
            </ul>
            <Link
              href="/membership/checkout?intent=hair_loss"
              className={styles.cta}
            >
              Start your assessment
            </Link>
          </div>
        </div>

        <div className={styles.bento}>
          <article className={`${styles.card} ${styles.biomarkers}`}>
            <div className={styles.cardMedia}>
              <Image
                src="/images/membership/sanative-biomarker-test-tube.webp"
                alt="Illustrated biomarker blood test tube with health markers"
                fill
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover object-center"
                priority
              />
            </div>
            <p className={styles.cardCaption}>
              Comprehensive biomarker panel included
            </p>
          </article>

          <article className={`${styles.card} ${styles.portrait}`}>
            <div className={styles.cardMedia}>
              <img
                key={portrait.src}
                src={portrait.src}
                alt={portrait.alt}
                width={1200}
                height={1400}
                fetchPriority="high"
                decoding="async"
                className={gender === "men" ? styles.portraitMen : styles.portraitWomen}
              />
            </div>
            <p className={styles.cardCaption}>{portrait.caption}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
