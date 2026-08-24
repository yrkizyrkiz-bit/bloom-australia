"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Activity, Brain, Flame, Heart, Moon, type LucideIcon } from "lucide-react";
import "./womens-health-symptoms-marquee.css";

type SymptomGroup = {
  title: string;
  icon: LucideIcon;
  items: string[];
};

const symptomGroups: SymptomGroup[] = [
  {
    title: "Vasomotor",
    icon: Flame,
    items: ["Hot flushes and night sweats", "Sudden warmth or chills", "Flushing of the face or chest"],
  },
  {
    title: "Sleep & mood",
    icon: Moon,
    items: ["Difficulty falling or staying asleep", "Low mood or irritability", "Anxiety or brain fog"],
  },
  {
    title: "Sexual & urinary",
    icon: Heart,
    items: ["Vaginal dryness or discomfort", "Changes in libido", "Urinary urgency or leakage"],
  },
  {
    title: "Physical & metabolic",
    icon: Activity,
    items: ["Joint aches or stiffness", "Weight changes", "Reduced energy or stamina"],
  },
  {
    title: "Menstrual",
    icon: Brain,
    items: ["Irregular or heavier periods (perimenopause)", "Skipped cycles", "Periods stopping (menopause)"],
  },
];

const symptomDetails = symptomGroups.flatMap((group) =>
  group.items.map((item) => ({ group: group.title, item })),
);

const ROW_CYCLE_SECONDS = [38, 44] as const;

function SymptomGroupCard({ group }: { group: SymptomGroup }) {
  const Icon = group.icon;

  return (
    <div className="wh-marquee-card">
      <div className="wh-marquee-card__icon">
        <Icon aria-hidden />
      </div>
      <h3 className="wh-marquee-card__title">{group.title}</h3>
      <ul className="wh-marquee-card__items">
        {group.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SymptomDetailCard({
  group,
  item,
}: {
  group: string;
  item: string;
}) {
  return (
    <div className="wh-marquee-card wh-marquee-card--detail">
      <p className="wh-marquee-card__label">{group}</p>
      <h3 className="wh-marquee-card__detail">{item}</h3>
    </div>
  );
}

function MarqueeGroup({
  children,
  hidden,
}: {
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <div className="wh-marquee-group" aria-hidden={hidden || undefined}>
      {children}
    </div>
  );
}

export function WomensHealthSymptomsMarquee() {
  const marqueeRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = marqueeRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const tracks = Array.from(root.querySelectorAll<HTMLElement>(".wh-marquee-track"));

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
        const group = row.track.querySelector<HTMLElement>(".wh-marquee-group");
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
      const group = track.querySelector(".wh-marquee-group");
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
    <section id="symptoms" className="wh-symptoms-marquee scroll-mt-16">
      <div className="wh-symptoms-marquee__bg" aria-hidden />
      <div className="wh-symptoms-marquee__glow" aria-hidden />
      <div className="wh-symptoms-marquee__noise" aria-hidden />

      <div className="wh-symptoms-marquee__inner">
        <div className="wh-symptoms-marquee__header">
          <h2>Common menopause symptoms</h2>
        </div>

        <section
          ref={marqueeRef}
          className="wh-health-marquee"
          aria-label="Common menopause symptoms"
        >
          <div className="wh-marquee-row">
            <div className="wh-marquee-track">
              <MarqueeGroup>
                {symptomGroups.map((group) => (
                  <SymptomGroupCard key={group.title} group={group} />
                ))}
              </MarqueeGroup>
              <MarqueeGroup hidden>
                {symptomGroups.map((group) => (
                  <SymptomGroupCard key={`${group.title}-dup`} group={group} />
                ))}
              </MarqueeGroup>
            </div>
          </div>

          <div className="wh-marquee-row">
            <div className="wh-marquee-track">
              <MarqueeGroup>
                {symptomDetails.map((detail) => (
                  <SymptomDetailCard
                    key={`${detail.group}-${detail.item}`}
                    group={detail.group}
                    item={detail.item}
                  />
                ))}
              </MarqueeGroup>
              <MarqueeGroup hidden>
                {symptomDetails.map((detail) => (
                  <SymptomDetailCard
                    key={`${detail.group}-${detail.item}-dup`}
                    group={detail.group}
                    item={detail.item}
                  />
                ))}
              </MarqueeGroup>
            </div>
          </div>
        </section>

        <p className="wh-symptoms-marquee__lede">
          Every woman&apos;s experience is different. These are among the most reported
          symptoms during perimenopause and menopause.
        </p>
      </div>
    </section>
  );
}
