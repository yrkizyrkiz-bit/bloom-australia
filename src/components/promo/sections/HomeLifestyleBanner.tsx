/**
 * Mid-page lifestyle banner, former homepage hero image + slogan.
 * Mobile: inset 9:16 portrait, 30px corners, runner in front of a
 * very transparent app layer, copy at the top.
 */
export function HomeLifestyleBanner() {
  return (
    <section
      className="bg-[#fdfbf7] max-md:px-[22px] max-md:py-6"
      aria-label="Advanced biomarker reporting and AI insights to help you live healthier, longer"
    >
      <div className="relative w-full overflow-hidden max-md:aspect-[9/16] max-md:rounded-[30px]">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={[
              "/images/membership/Main_running-mobile-480.webp?v=5 480w",
              "/images/membership/Main_running-mobile-768.webp?v=5 768w",
              "/images/membership/Main_running-mobile-960.webp?v=5 960w",
              "/images/membership/Main_running-mobile-1280.webp?v=5 1280w",
            ].join(", ")}
            sizes="(max-width: 767px) calc(100vw - 44px), 100vw"
          />
          <source
            media="(min-width: 768px)"
            srcSet={[
              "/images/membership/Main_running-768.webp?v=2 768w",
              "/images/membership/Main_running-1200.webp?v=2 1200w",
              "/images/membership/Main_running-1600.webp?v=2 1600w",
              "/images/membership/Main_running-2160.webp?v=2 2160w",
              "/images/membership/Main_running.webp?v=2 2172w",
            ].join(", ")}
            sizes="100vw"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/membership/Main_running.webp?v=2"
            alt="Runner on Sydney Harbour foreshore with Sanative health insights"
            width={2172}
            height={724}
            className="block h-auto w-full object-cover object-center max-md:absolute max-md:inset-0 max-md:h-full max-md:w-full"
            decoding="async"
            loading="lazy"
          />
        </picture>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-[32%] bg-gradient-to-b from-black/28 to-transparent max-md:block"
          aria-hidden
        />

        <p
          className="promo-heading-hers pointer-events-none absolute z-20 m-0 leading-[1.1] text-[#fff4e6] max-md:top-3 max-md:right-5 max-md:left-5 max-md:max-w-[90%] max-md:text-left md:hidden"
          style={{
            fontSize: "clamp(1.65rem, 7vw, 2.2rem)",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            textShadow: "0 1px 3px rgba(40, 22, 10, 0.4)",
          }}
        >
          <span className="text-[#2c3628] [text-shadow:none] text-[0.9em]">Live healthier, longer</span>
        </p>

        <p
          className="promo-heading-hers pointer-events-none absolute z-20 m-0 hidden leading-[1.1] text-[#fff4e6] md:block md:top-[8%] md:right-[3%] md:left-auto md:text-right"
          style={{
            fontSize: "clamp(1.65rem, 7vw, 2.2rem)",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            textShadow: "0 1px 3px rgba(40, 22, 10, 0.4)",
          }}
        >
          <span className="block whitespace-nowrap">Advanced biomarker</span>
          <span className="block whitespace-nowrap">reporting and AI insights</span>
          <span className="block whitespace-nowrap text-[#2c3628] [text-shadow:none] text-[0.9em]">
            to help you live healthier, longer.
          </span>
        </p>
      </div>
    </section>
  );
}
