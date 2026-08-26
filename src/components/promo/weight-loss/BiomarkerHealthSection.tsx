"use client";

import { useLayoutEffect, useRef } from "react";
import {
  Activity,
  Heart,
  FlaskConical,
  Droplet,
  Zap,
  ThermometerSun,
  Flame,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import "./biomarker-health-marquee.css";

type BiomarkerCard = {
  kind: "biomarker";
  icon: LucideIcon;
  title: string;
  description: string;
};

type QuestionCard = {
  kind: "question";
  question: string;
  tags: string[];
};

type MarqueeItem = BiomarkerCard | QuestionCard;

const biomarkerCategories: BiomarkerCard[] = [
  {
    kind: "biomarker",
    icon: Droplet,
    title: "Blood sugar and metabolic health",
    description: "HbA1c, fasting glucose, insulin markers",
  },
  {
    kind: "biomarker",
    icon: Heart,
    title: "Cholesterol and cardiovascular risk markers",
    description: "Total cholesterol, LDL, HDL, triglycerides",
  },
  {
    kind: "biomarker",
    icon: FlaskConical,
    title: "Liver function markers",
    description: "ALT, AST, GGT, bilirubin",
  },
  {
    kind: "biomarker",
    icon: Zap,
    title: "Kidney function markers",
    description: "Creatinine, eGFR, urea",
  },
  {
    kind: "biomarker",
    icon: ThermometerSun,
    title: "Thyroid function markers",
    description: "TSH, free T4, free T3",
  },
  {
    kind: "biomarker",
    icon: Flame,
    title: "Inflammation and nutritional markers",
    description: "Where clinically appropriate",
  },
  {
    kind: "biomarker",
    icon: Activity,
    title: "Health Age / biological-age style score",
    description: "Based on your metabolic health profile",
  },
  {
    kind: "biomarker",
    icon: TrendingUp,
    title: "Progress trends over time",
    description: "Track improvement across all markers",
  },
];

const questionCards: QuestionCard[] = [
  {
    kind: "question",
    question: "Why am I struggling to lose weight?",
    tags: ["Insulin", "HbA1c", "Thyroid", "Cortisol"],
  },
  {
    kind: "question",
    question: "Why am I always tired?",
    tags: ["Iron", "B12", "Vitamin D", "Thyroid"],
  },
  {
    kind: "question",
    question: "Why is my libido lower than it used to be?",
    tags: ["Testosterone", "Oestrogen", "Cortisol"],
  },
  {
    kind: "question",
    question: "Why do I keep gaining weight around my stomach?",
    tags: ["Insulin", "Cortisol", "Cholesterol"],
  },
  {
    kind: "question",
    question: "Why do I feel stressed or burnt out?",
    tags: ["Cortisol", "Magnesium", "Vitamin D"],
  },
  {
    kind: "question",
    question: "Why do I feel different in my 40s or 50s?",
    tags: ["Testosterone", "Oestrogen", "Thyroid"],
  },
];

const marqueeRows: MarqueeItem[][] = [
  biomarkerCategories.slice(0, 4),
  questionCards,
  biomarkerCategories.slice(4, 8),
];

function BiomarkerMarqueeCard({ item }: { item: BiomarkerCard }) {
  const Icon = item.icon;

  return (
    <div className="marquee-card">
      <div className="marquee-card__icon">
        <Icon aria-hidden />
      </div>
      <h3 className="marquee-card__title">{item.title}</h3>
      <p className="marquee-card__description">{item.description}</p>
    </div>
  );
}

function QuestionMarqueeCard({ item }: { item: QuestionCard }) {
  return (
    <div className="marquee-card marquee-card--question">
      <div className="marquee-card__qmark" aria-hidden>
        ?
      </div>
      <h3 className="marquee-card__question">{item.question}</h3>
      <div className="marquee-card__meta">
        <p className="marquee-card__tags-label">Markers that may be relevant:</p>
        <div className="marquee-card__tags">
          {item.tags.map((tag) => (
            <span key={tag} className="marquee-card__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarqueeCard({ item }: { item: MarqueeItem }) {
  if (item.kind === "question") {
    return <QuestionMarqueeCard item={item} />;
  }
  return <BiomarkerMarqueeCard item={item} />;
}

function MarqueeGroup({
  items,
  hidden,
}: {
  items: MarqueeItem[];
  hidden?: boolean;
}) {
  return (
    <div className="marquee-group" aria-hidden={hidden || undefined}>
      {items.map((item, index) => {
        const key =
          item.kind === "question"
            ? `${item.question}-${hidden ? "dup" : "src"}-${index}`
            : `${item.title}-${hidden ? "dup" : "src"}-${index}`;
        return <MarqueeCard key={key} item={item} />;
      })}
    </div>
  );
}

/** Seconds for one full group-width cycle (matches prior CSS durations). */
const ROW_CYCLE_SECONDS = [38, 44, 34] as const;

export function BiomarkerHealthSection() {
  const marqueeRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = marqueeRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const tracks = Array.from(
      root.querySelectorAll<HTMLElement>(".marquee-track"),
    );

    type RowState = {
      track: HTMLElement;
      index: number;
      reverse: boolean;
      distance: number;
      /** Progress through one cycle, 0…distance */
      offset: number;
    };

    const rows: RowState[] = tracks.map((track, index) => ({
      track,
      index,
      reverse: index === 1,
      distance: 0,
      offset: 0,
    }));

    const measure = () => {
      rows.forEach((row) => {
        const group = row.track.querySelector<HTMLElement>(".marquee-group");
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

      rows.forEach((row) => {
        if (row.distance <= 0) return;
        const cycleMs = (ROW_CYCLE_SECONDS[row.index] ?? 38) * 1000;
        const speed = row.distance / cycleMs;
        row.offset = (row.offset + speed * dt) % row.distance;
        // Forward: 0 → -distance. Reverse: -distance → 0. Same wrap point.
        const x = row.reverse
          ? row.offset - row.distance
          : -row.offset;
        row.track.style.transform = `translate3d(${x}px, 0, 0)`;
      });

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    const observer = new ResizeObserver(measure);
    tracks.forEach((track) => {
      const group = track.querySelector(".marquee-group");
      if (group) observer.observe(group);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      tracks.forEach((track) => {
        track.style.transform = "";
      });
    };
  }, []);

  return (
    <section className="biomarker-health-section">
      <div className="biomarker-health-section__bg" aria-hidden />
      <div className="biomarker-health-section__glow" aria-hidden />
      <div className="biomarker-health-section__noise" aria-hidden />

      <div className="biomarker-health-section__inner">
        <div className="biomarker-health-section__header">
          <h2>
            More than weight loss.
            <span>A clearer picture of your health.</span>
          </h2>
          <p className="biomarker-health-section__lede">
            Doctor-reviewed biomarker monitoring for the metabolic markers
            that matter to your weight and long-term health.
          </p>
        </div>

        <section
          ref={marqueeRef}
          className="health-marquee"
          aria-label="Biomarker health areas"
        >
          {marqueeRows.map((row, rowIndex) => (
            <div className="marquee-row" key={`row-${rowIndex}`}>
              <div className="marquee-track">
                <MarqueeGroup items={row} />
                <MarqueeGroup items={row} hidden />
              </div>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
