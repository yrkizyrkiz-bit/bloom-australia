"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import {
  ClipboardList,
  FlaskConical,
  Stethoscope,
  HeartPulse,
  Droplet,
  ThermometerSun,
  Pill,
  Camera,
  type LucideIcon,
} from "lucide-react";
import "@/components/promo/weight-loss/biomarker-health-marquee.css";

type ProcessCard = {
  kind: "process";
  icon: LucideIcon;
  title: string;
  description: string;
};

type QuestionCard = {
  kind: "question";
  question: string;
  tags: string[];
};

type MarqueeItem = ProcessCard | QuestionCard;

const processCards: ProcessCard[] = [
  {
    kind: "process",
    icon: ClipboardList,
    title: "Online assessment",
    description: "Hair patterns, history, lifestyle, and goals",
  },
  {
    kind: "process",
    icon: FlaskConical,
    title: "Hormone panel",
    description: "DHT, testosterone, and related markers",
  },
  {
    kind: "process",
    icon: ThermometerSun,
    title: "Thyroid function markers",
    description: "TSH, free T4, free T3 where indicated",
  },
  {
    kind: "process",
    icon: Droplet,
    title: "Iron & nutrient status",
    description: "Ferritin, iron studies, vitamin D & B12",
  },
  {
    kind: "process",
    icon: Stethoscope,
    title: "Doctor consultation",
    description: "AHPRA-registered review of your results",
  },
  {
    kind: "process",
    icon: Pill,
    title: "Personalised treatment plan",
    description: "Clinically guided options for your profile",
  },
  {
    kind: "process",
    icon: Camera,
    title: "Progress photo tracking",
    description: "Document change across your journey",
  },
  {
    kind: "process",
    icon: HeartPulse,
    title: "Ongoing clinical monitoring",
    description: "Check-ins and plan adjustments over time",
  },
];

const questionCards: QuestionCard[] = [
  {
    kind: "question",
    question: "Why is my hair thinning?",
    tags: ["DHT", "Thyroid", "Iron", "Ferritin"],
  },
  {
    kind: "question",
    question: "Why is my part getting wider?",
    tags: ["Hormones", "Genetics", "Stress"],
  },
  {
    kind: "question",
    question: "Why am I shedding more than usual?",
    tags: ["Iron", "Vitamin D", "Thyroid"],
  },
  {
    kind: "question",
    question: "Could my thyroid be affecting my hair?",
    tags: ["TSH", "Free T4", "Free T3"],
  },
  {
    kind: "question",
    question: "Is iron deficiency causing my hair loss?",
    tags: ["Ferritin", "Iron", "B12"],
  },
  {
    kind: "question",
    question: "Why is hair loss different for women?",
    tags: ["Hormones", "Ludwig", "Stress"],
  },
];

const marqueeRows: MarqueeItem[][] = [
  processCards.slice(0, 4),
  questionCards,
  processCards.slice(4, 8),
];

function ProcessMarqueeCard({ item }: { item: ProcessCard }) {
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
  return <ProcessMarqueeCard item={item} />;
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

const ROW_CYCLE_SECONDS = [38, 44, 34] as const;

export function HairHealthProcessSection() {
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
        const x = row.reverse ? row.offset - row.distance : -row.offset;
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
    <section id="how-it-works" className="biomarker-health-section">
      <div className="biomarker-health-section__bg" aria-hidden />
      <div className="biomarker-health-section__glow" aria-hidden />
      <div className="biomarker-health-section__noise" aria-hidden />

      <div className="biomarker-health-section__inner">
        <div className="biomarker-health-section__header">
          <h2>
            A clinically rigorous process.
            <span>Doctor-led care for healthier hair.</span>
          </h2>
          <p className="biomarker-health-section__lede">
            From assessment through ongoing monitoring, evidence-based steps
            guided by qualified healthcare professionals.
          </p>
          <Link
            href="/hair-assessment"
            className="btn-primary inline-flex items-center gap-2 mt-1"
          >
            Start your assessment
          </Link>
        </div>

        <section
          ref={marqueeRef}
          className="health-marquee"
          aria-label="Hair health clinical process"
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
