/**
 * Pricing / CTA band, lifestyle image with left-side slogan.
 * Mobile: inset 9:16 portrait (same treatment as the biomarker lifestyle banner).
 */
export function PricingSection({
  variant = "default",
}: {
  variant?: "default" | "men";
}) {
  const isMen = variant === "men";
  const desktopSrc = isMen
    ? "/images/membership/Wm_man_LI.webp"
    : "/images/weight-management/cta-hero.webp";
  const mobileStem = isMen
    ? "/images/membership/Wm_man_LI-mobile"
    : "/images/weight-management/cta-hero-mobile";
  const alt = isMen
    ? "Sanative member walking outdoors, we're behind you all the way"
    : "Sanative member outdoors, we're behind you all the way";
  const sloganClass = isMen
    ? "text-[#10241c] [text-shadow:0_0_14px_rgba(255,255,255,0.9),0_1px_2px_rgba(255,255,255,0.85)]"
    : "text-white drop-shadow-[0_2px_16px_rgba(30,40,25,0.4)]";
  const sloganItalicClass = isMen ? "italic text-[#10241c]" : "italic text-white/95";
  const mobileSrcVersion = isMen ? "v=6" : "v=2";

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#e6ebe3] max-md:px-[22px] max-md:py-6"
    >
      <div className="relative w-full overflow-hidden max-md:aspect-[9/16] max-md:rounded-[30px]">
        <h2 className="sr-only">We&apos;re behind you all the way</h2>
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={[
              `${mobileStem}-480.webp?${mobileSrcVersion} 480w`,
              `${mobileStem}-768.webp?${mobileSrcVersion} 768w`,
              `${mobileStem}-960.webp?${mobileSrcVersion} 960w`,
              `${mobileStem}-1280.webp?${mobileSrcVersion} 1280w`,
            ].join(", ")}
            sizes="(max-width: 767px) calc(100vw - 44px), 100vw"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={desktopSrc}
            alt={alt}
            width={isMen ? 1672 : 1024}
            height={isMen ? 941 : 576}
            className="block h-auto w-full object-cover object-center max-md:absolute max-md:inset-0 max-md:h-full max-md:w-full"
            decoding="async"
            loading="lazy"
          />
        </picture>

        {!isMen && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-[32%] bg-gradient-to-b from-black/28 to-transparent max-md:block"
            aria-hidden
          />
        )}

        <p
          className={`pointer-events-none absolute z-20 m-0 max-w-[14ch] font-serif leading-[1.1] tracking-tight max-md:top-5 max-md:right-5 max-md:left-5 max-md:text-[clamp(1.65rem,7vw,2.2rem)] md:hidden ${sloganClass}`}
        >
          We&apos;re behind you
          <br />
          <span className={sloganItalicClass}>all the way</span>
        </p>

        <p
          className={`pointer-events-none absolute z-20 m-0 hidden max-w-[14ch] font-serif text-[clamp(1.4rem,4.3vw,5.1rem)] leading-[1.1] tracking-tight md:block md:top-[22%] md:left-[calc(13%-2ch)] ${sloganClass}`}
        >
          We&apos;re behind you
          <br />
          <span className={sloganItalicClass}>all the way</span>
        </p>
      </div>
    </section>
  );
}
