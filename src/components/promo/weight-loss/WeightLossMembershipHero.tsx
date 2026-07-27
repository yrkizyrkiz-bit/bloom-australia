"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./WeightLossMembershipHero.module.css";

/**
 * Sanative Weight Loss Membership hero — editorial bento composition.
 * Hers used only as layout reference; Sanative brand, copy and assets.
 */
export function WeightLossMembershipHero() {
  return (
    <section
      className={styles.hero}
      aria-labelledby="weight-loss-membership-heading"
    >
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>More than a weight-loss program</p>
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
                src="/images/membership/sanative-biomarker-test-tube.png"
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
                src="/images/membership/sanative-doctor-screens.png"
                alt="Australian doctor with Sanative care screens for messages, progress and consultations"
                fill
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-[center_20%]"
                priority
              />
            </div>
          </article>

          <article className={`${styles.card} ${styles.community}`}>
            <div className={styles.cardMedia}>
              <Image
                src="/images/membership/sanative-community-women.png"
                alt="Two women smiling outdoors in warm natural light"
                fill
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-[center_30%]"
                priority
              />
            </div>
          </article>

          <article className={`${styles.card} ${styles.phone}`}>
            <div className={styles.phoneMedia}>
              <Image
                src="/images/membership/sanative-phone-hand.png"
                alt="Hand holding a phone showing the Sanative health app"
                width={893}
                height={1282}
                sizes="(min-width: 1024px) 26vw, (min-width: 640px) 40vw, 80vw"
                className="object-contain"
                priority
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
