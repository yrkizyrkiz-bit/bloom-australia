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

function ScreenGroup({ groupKey }: { groupKey: string }) {
  return (
    <div className={styles.appScreenGroup}>
      {SCREENS.map((file) => (
        // eslint-disable-next-line @next/next/no-img-element -- marquee needs plain imgs for seamless CSS animation
        <img
          key={`${groupKey}-${file}`}
          src={`${ASSET_BASE}/${file}`}
          className={styles.appScreen}
          alt=""
          draggable={false}
          loading="eager"
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
        />

        <div className={styles.appMarquee} aria-hidden>
          <div className={styles.appMarqueeStage}>
            <div className={styles.appMarqueeTilt}>
              <div className={styles.appMarqueeTrack}>
                <ScreenGroup groupKey="a" />
                <ScreenGroup groupKey="b" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.backgroundWash} aria-hidden />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${ASSET_BASE}/foreground-person.png?v=2`}
          className={styles.foregroundPerson}
          alt=""
          aria-hidden
          draggable={false}
        />

        <div className={styles.heroCopy}>
          <h2 id="biomarker-marquee-title" className={styles.title}>
            Turn your biomarkers
            <br />
            into better health
          </h2>
          <p className={styles.subtitle}>
            Advanced biomarker testing and AI insights
            <br className={styles.desktopOnly} /> to help you live healthier, longer.
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
