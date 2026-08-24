"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import styles from "./SanativeMenopauseHero.module.css";

const SYMPTOMS = [
  "Brain fog",
  "Hot flushes",
  "Mood changes",
  "Weight gain",
  "Low energy",
  "Low sex drive",
  "Night sweats",
  "Vaginal discomfort",
];

export function SanativeMenopauseHero() {
  const railRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const LOOP = useMemo(
    () => [...SYMPTOMS.slice(-3), ...SYMPTOMS, ...SYMPTOMS.slice(0, 3)],
    []
  );

  useEffect(() => {
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const rail = railRef.current;
    const rows = rowRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!rail || !rows.length || reduceMotion) return;

    const baseOffset = 3;
    let index = baseOffset + 3; // Start with "Weight gain" as the highlighted row.

    const rowHeight = () => {
      const first = rows[0];
      const second = rows[1];
      if (!first || !second) return 92;
      return Math.abs(second.offsetTop - first.offsetTop);
    };

    const fittedSize = (text: HTMLElement, desired: string) => {
      const previous = text.style.fontSize;
      text.style.fontSize = desired;
      const natural = parseFloat(getComputedStyle(text).fontSize);
      const maxWidth = rail.parentElement?.clientWidth ?? 0;
      const needed = text.scrollWidth;
      text.style.fontSize = previous;
      if (!maxWidth || !needed || needed <= maxWidth) return desired;
      return `${Math.max(18, (natural * maxWidth) / needed)}px`;
    };

    const paintRows = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      rows.forEach((row, i) => {
        const distance = Math.abs(i - index);
        const isActive = distance === 0;

        gsap.to(row, {
          opacity: isActive ? 1 : distance === 1 ? 0.42 : distance === 2 ? 0.2 : 0.08,
          scale: isActive ? 1 : distance === 1 ? 0.94 : distance === 2 ? 0.9 : 0.86,
          duration: 0.55,
          ease: "power2.out",
          overwrite: true,
        });

        const text = row.querySelector("span");
        if (text) {
          const desired = isActive
            ? isMobile
              ? "clamp(26px, 7.2vw, 32px)"
              : "clamp(44px, 4.6vw, 72px)"
            : distance === 1
              ? isMobile
                ? "clamp(18px, 4.6vw, 22px)"
                : "clamp(26px, 2.8vw, 44px)"
              : isMobile
                ? "clamp(16px, 4vw, 20px)"
                : "clamp(22px, 2.2vw, 36px)";

          gsap.to(text, {
            fontSize: fittedSize(text, desired),
            duration: 0.55,
            ease: "power2.out",
            overwrite: true,
          });
        }
      });
    };

    const snap = () => {
      gsap.set(rail, { y: -(index * rowHeight()) });
      paintRows();
    };

    const advance = () => {
      index += 1;
      gsap.to(rail, {
        y: -(index * rowHeight()),
        duration: 0.7,
        ease: "power3.inOut",
        onStart: paintRows,
        onComplete: () => {
          if (index >= baseOffset + SYMPTOMS.length) {
            index = baseOffset;
            gsap.set(rail, { y: -(index * rowHeight()) });
            paintRows();
          }
        },
      });
    };

    snap();

    const timer = window.setInterval(advance, 2300);
    const onResize = () => snap();
    window.addEventListener("resize", onResize);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf([rail, ...rows]);
    };
  }, []);

  return (
    <section className={styles.hero} aria-label="Menopause symptom hero">
      <img
        className={styles.background}
        src="/sanative-menopause-hero/menopause-hero-background.webp"
        alt=""
        aria-hidden="true"
      />

      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.ticker}>
        <div className={styles.viewport}>
          <div className={styles.rail} ref={railRef}>
            {LOOP.map((symptom, i) => (
              <div
                key={`${symptom}-${i}`}
                className={styles.row}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
              >
                <span>{symptom}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <img
        className={styles.woman}
        src="/sanative-menopause-hero/menopause-woman.webp"
        alt="A confident menopause-age woman"
      />
    </section>
  );
}

export default SanativeMenopauseHero;
