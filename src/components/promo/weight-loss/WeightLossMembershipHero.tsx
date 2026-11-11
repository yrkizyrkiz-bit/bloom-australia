"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./WeightLossMembershipHero.module.css";
import { FUNNEL_PATH, PRICING } from "@/lib/lp/weight-management";

const programmePoints = [
  { text: "New medical weight loss program" },
  { text: "New non-invasive approach to weight loss" },
  {
    text: "Love it or Leave it, 30-day money-back",
    footnote: true,
  },
  { text: "Speak to a doctor about your options" },
];

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="9" r="7.65" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.6 9.2 7.7 11.3 12.4 6.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Sanative Weight Loss Membership hero, editorial bento composition.
 * Hers used only as layout reference; Sanative brand, copy and assets.
 */
export function WeightLossMembershipHero({
  variant = "default",
}: {
  variant?: "default" | "men";
}) {
  const isMen = variant === "men";
  return (
    <section
      className={styles.hero}
      aria-labelledby="weight-loss-membership-heading"
    >
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>Your complete structured weight loss program</p>
            <h1 id="weight-loss-membership-heading" className={styles.heading}>
              Weight loss guided by
              <br />
              your health check
            </h1>
          </div>

          <div className={styles.summary}>
            <ul className={styles.points}>
              {programmePoints.map((point) => (
                <li
                  key={point.text}
                  className={styles.point}
                  {...(point.footnote
                    ? { "aria-describedby": "wm-guarantee-terms" }
                    : {})}
                >
                  <CheckCircleIcon className={styles.pointIcon} />
                  {point.text}
                  {point.footnote ? <sup className={styles.pointStar}>*</sup> : null}
                </li>
              ))}
            </ul>
            <Link href={FUNNEL_PATH} className={styles.cta}>
              Let&apos;s get you started ${PRICING.assessmentFee}
            </Link>
          </div>
        </div>

        <div className={styles.bento}>
          <article className={`${styles.card} ${styles.biomarkers}`}>
            <div className={styles.cardMedia}>
              <Image
                src="/images/membership/sanative-biomarker-test-tube.webp"
                alt="Illustrated biomarker blood test tube with metabolic health markers"
                fill
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-center"
                priority
              />
            </div>
          </article>

          <article className={`${styles.card} ${styles.doctor}`}>
            <div className={styles.cardMedia}>
              <Image
                src="/images/membership/sanative-doctor-screens.webp"
                alt="Australian doctor with Sanative care screens for messages, progress and consultations"
                fill
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-[center_20%]"
                priority
              />
            </div>
          </article>

          <article className={`${styles.card} ${styles.measure}`}>
            <div className={styles.cardMedia}>
              <Image
                src={
                  isMen
                    ? "/images/membership/wm_3_male.webp"
                    : "/images/membership/WM_4.webp"
                }
                alt={
                  isMen
                    ? "Man measuring his waist in athletic wear"
                    : "Woman measuring her waist in athletic wear"
                }
                fill
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 100vw, 100vw"
                className="object-cover object-[center_20%]"
                priority
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
