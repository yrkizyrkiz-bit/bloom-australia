import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-center px-6 md:h-14">
        <Link
          href="/"
          className="font-serif text-3xl leading-none tracking-tight text-forest"
          aria-label="Sanative home"
        >
          sanative
        </Link>
      </div>
    </header>
  );
}
