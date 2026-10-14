import { Cormorant_Garamond, Inter, Outfit, Playfair_Display } from "next/font/google";

/**
 * Site-wide fonts (loaded from root layout).
 * Inter = body/UI; Playfair = serif headings (font-serif).
 * Only Inter is preloaded — it is on the critical path for every page.
 */
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

/**
 * Marketing-only display fonts (loaded from (public)/layout).
 * Keeps portal/admin pages from downloading Cormorant + Outfit.
 */
export const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

/** Geometric sans close to Hers CareSans (custom; not licensable). */
export const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});
