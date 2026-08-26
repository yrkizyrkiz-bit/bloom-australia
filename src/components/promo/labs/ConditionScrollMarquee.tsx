"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import "./condition-scroll-marquee.css";

type ConditionCard = {
  title: string;
  image: string;
  alt: string;
};

const conditionCards: ConditionCard[] = [
  { title: "Metabolic syndrome", image: "/images/conditions/metabolic-syndrome.webp", alt: "Metabolic syndrome" },
  { title: "Type 2 diabetes", image: "/images/conditions/type-2-diabetes.webp", alt: "Type 2 diabetes" },
  { title: "Insulin resistance", image: "/images/conditions/insulin-resistance.webp", alt: "Insulin resistance" },
  { title: "Metabolic dysfunction", image: "/images/conditions/metabolic-dysfunction.webp", alt: "Metabolic dysfunction" },
  { title: "Coronary artery disease", image: "/images/conditions/coronary-artery-disease.webp", alt: "Coronary artery disease" },
  { title: "Gout", image: "/images/conditions/gout.webp", alt: "Gout" },
  { title: "Chronic kidney disease", image: "/images/conditions/chronic-kidney-disease.webp", alt: "Chronic kidney disease" },
  { title: "Hypothyroidism", image: "/images/conditions/hypothyroidism.webp", alt: "Hypothyroidism" },
  { title: "Hyperthyroidism", image: "/images/conditions/hyperthyroidism.webp", alt: "Hyperthyroidism" },
  { title: "Hashimoto's thyroiditis", image: "/images/conditions/hashimotos-disease.webp", alt: "Hashimoto's thyroiditis" },
  { title: "Anaemia", image: "/images/conditions/anaemia.webp", alt: "Anaemia" },
  { title: "Iron deficiency", image: "/images/conditions/iron-deficiency.webp", alt: "Iron deficiency" },
  { title: "Thrombocytosis", image: "/images/conditions/thrombocytosis.webp", alt: "Thrombocytosis" },
  { title: "Growth hormone deficiency", image: "/images/conditions/growth-hormone-deficiency.webp", alt: "Growth hormone deficiency" },
  { title: "Folate deficiency", image: "/images/conditions/folate-deficiency.webp", alt: "Folate deficiency" },
  { title: "Vitamin B12 deficiency", image: "/images/conditions/vitamin-b12-deficiency.webp", alt: "Vitamin B12 deficiency" },
  { title: "MASLD", image: "/images/conditions/masld.webp", alt: "MASLD" },
  { title: "Fatty liver disease", image: "/images/conditions/fatty-liver-disease.webp", alt: "Fatty liver disease" },
  { title: "Addison's disease", image: "/images/conditions/addisons-disease.webp", alt: "Addison's disease" },
  { title: "PCOS", image: "/images/conditions/pcos.webp", alt: "PCOS" },
];

const rows: ConditionCard[][] = [
  conditionCards.slice(0, 7),
  conditionCards.slice(7, 14),
  conditionCards.slice(14),
];

/** Seconds for one full group-width cycle. */
const ROW_CYCLE_SECONDS = [38, 46, 40] as const;

function Card({ card }: { card: ConditionCard }) {
  return (
    <div className="condition-scroll__card">
      <div className="condition-scroll__card-image">
        <Image
          src={card.image}
          alt={card.alt}
          fill
          sizes="48px"
          className="object-contain object-center"
        />
      </div>
      <p className="condition-scroll__card-title">{card.title}</p>
    </div>
  );
}

function RowGroup({ items, hidden }: { items: ConditionCard[]; hidden?: boolean }) {
  return (
    <div className="condition-scroll__group" aria-hidden={hidden || undefined}>
      {items.map((card, index) => (
        <Card key={`${card.title}-${hidden ? "dup" : "src"}-${index}`} card={card} />
      ))}
    </div>
  );
}

export function ConditionScrollMarquee() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const tracks = Array.from(
      root.querySelectorAll<HTMLElement>(".condition-scroll__track"),
    );

    type RowState = {
      track: HTMLElement;
      index: number;
      reverse: boolean;
      distance: number;
      offset: number;
    };

    const rowStates: RowState[] = tracks.map((track, index) => ({
      track,
      index,
      reverse: index % 2 === 1,
      distance: 0,
      offset: 0,
    }));

    const measure = () => {
      rowStates.forEach((row) => {
        const group = row.track.querySelector<HTMLElement>(
          ".condition-scroll__group",
        );
        const distance = group?.offsetWidth ?? 0;
        if (distance > 0 && row.distance > 0 && distance !== row.distance) {
          row.offset = (row.offset / row.distance) * distance;
        }
        row.distance = distance;
      });
    };

    measure();

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;

      rowStates.forEach((row) => {
        if (row.distance <= 0) return;
        const cycleMs = (ROW_CYCLE_SECONDS[row.index] ?? 40) * 1000;
        const speed = row.distance / cycleMs;
        row.offset = (row.offset + speed * dt) % row.distance;
        const x = row.reverse ? row.offset - row.distance : -row.offset;
        row.track.style.transform = `translate3d(${x}px, 0, 0)`;
      });

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    const observer = new ResizeObserver(measure);
    tracks.forEach((track) => {
      const group = track.querySelector(".condition-scroll__group");
      if (group) observer.observe(group);
    });

    // Re-measure after images settle so the loop distance stays exact.
    const images = root.querySelectorAll("img");
    const onImageLoad = () => measure();
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onImageLoad);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      images.forEach((img) => img.removeEventListener("load", onImageLoad));
      tracks.forEach((track) => {
        track.style.transform = "";
      });
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="condition-scroll"
      aria-label="Conditions our tests can help flag"
    >
      {rows.map((row, rowIndex) => (
        <div className="condition-scroll__row" key={`row-${rowIndex}`}>
          <div className="condition-scroll__track">
            <RowGroup items={row} />
            <RowGroup items={row} hidden />
          </div>
        </div>
      ))}
    </div>
  );
}
