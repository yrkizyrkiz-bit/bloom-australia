"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./WeightLossMembershipHero.module.css";

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
            <p className={styles.eyebrow}>Your complete care ecosystem</p>
            <h1 id="weight-loss-membership-heading" className={styles.heading}>
              Start with Sanative
              <br />
              Membership
            </h1>
          </div>

          <div className={styles.summary}>
            <p>
              Get doctor-guided biomarker testing, personalised health insights
              and your first 30 days of Weight Management Care included.
            </p>
            <Link href="/membership/checkout?intent=weight_management" className={styles.cta}>
              Start losing weight
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
