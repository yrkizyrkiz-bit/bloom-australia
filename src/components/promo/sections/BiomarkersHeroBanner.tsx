import Link from "next/link";
import styles from "./BiomarkersHeroBanner.module.css";

const ASSET_BASE = "/images/biomarker-marquee";
const SCREENS = [
  "screen-01.webp",
  "screen-02.webp",
  "screen-03.webp",
  "screen-04.webp",
  "screen-05.webp",
  "screen-06.webp",
] as const;

function ScreenGroup({
  groupKey,
  eager,
}: {
  groupKey: string;
  eager?: boolean;
}) {
  return (
    <div className={styles.appScreenGroup}>
      {SCREENS.map((file, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- marquee needs plain imgs for seamless CSS animation
        <img
          key={`${groupKey}-${file}`}
          src={`${ASSET_BASE}/${file}?v=4`}
          className={styles.appScreen}
          alt=""
          width={1000}
          height={560}
          draggable={false}
          loading={eager && index < 3 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority="low"
        />
      ))}
    </div>
  );
}

export function BiomarkersHeroBanner() {
  return (
    <section className="bg-[#fdfbf7]" aria-labelledby="biomarker-marquee-title">
      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${ASSET_BASE}/hero-background.webp?v=3`}
          className={styles.heroBackground}
          alt=""
          aria-hidden
          fetchPriority="high"
          decoding="async"
        />

        <div className={styles.appMarquee} aria-hidden>
          <div className={styles.appMarqueeStage}>
            <div className={styles.appMarqueeTilt}>
              <div className={styles.appMarqueeTrack}>
                <ScreenGroup groupKey="a" eager />
                <ScreenGroup groupKey="b" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.backgroundWash} aria-hidden />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/membership/foreground-person.webp?v=5"
          className={styles.foregroundPerson}
          alt=""
          aria-hidden
          width={1024}
          height={1536}
          draggable={false}
          decoding="async"
          fetchPriority="high"
        />

        <div className={styles.heroCopy}>
          <h1 id="biomarker-marquee-title" className={styles.title}>
            Doctor-led care with
            <br />
            biomarker insight
          </h1>
          <p className={styles.subtitle}>
            Check-up as a foundation for any Sanative health program
          </p>
          <div className={styles.actions}>
            <Link href="/biomarker-intake?package=advanced" className="btn-primary">
              Start my labs
            </Link>
            <Link href="/labs" className="btn-secondary">
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
