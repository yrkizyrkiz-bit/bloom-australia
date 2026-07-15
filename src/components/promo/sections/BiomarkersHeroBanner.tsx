import Image from "next/image";
import Link from "next/link";

export function BiomarkersHeroBanner() {
  return (
    <section className="bg-[#fdfbf7]">
      <Link
        href="/labs"
        className="group relative block w-full overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#5c7a52]"
        aria-label="Start my labs — turn your biomarkers into better health"
      >
        <Image
          src="/images/biomarkers-hero.webp"
          alt="Turn your biomarkers into better health — Advanced biomarker testing and AI insights with the Sanative health dashboard"
          width={1024}
          height={576}
          className="h-auto w-full object-cover object-center"
          sizes="100vw"
          priority={false}
        />
      </Link>
    </section>
  );
}
