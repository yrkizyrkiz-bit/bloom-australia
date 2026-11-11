import Link from "next/link";

import { LEGAL_LINKS } from "@/lib/legal/constants";

export function SiteFooter() {
  return (
    <footer className="bg-forest pb-28 text-forest-foreground md:pb-10">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <Link href="/" className="font-serif text-3xl leading-none">
            sanative
          </Link>
          <p className="font-serif italic text-forest-foreground/80">
            Preventative medicine + precise care = longevity built for Australians
          </p>
        </div>
        <div className="mt-8 space-y-3 border-t border-forest-foreground/15 pt-8 text-xs leading-relaxed text-forest-foreground/65">
          <p id="lp-guarantee-terms">
            *{" "}
            <Link href={LEGAL_LINKS.terms} className="underline underline-offset-2">
              Terms and conditions
            </Link>
          </p>
          <p>© {new Date().getFullYear()} Sanative. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
