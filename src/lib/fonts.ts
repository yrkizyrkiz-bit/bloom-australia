import localFont from "next/font/local";

/**
 * Site-wide fonts (loaded from root layout).
 * Inter = body/UI; Playfair = serif headings (font-serif).
 * Only Inter is preloaded — it is on the critical path for every page.
 *
 * Self-hosted so `next build` does not fetch Google Fonts. next/font/google
 * crashes when Google returns extensionless `/l/font?kit=` URLs
 * (vercel/next.js#99114), which is what failed the Netlify production build.
 */
export const inter = localFont({
  src: "../app/fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  preload: true,
  weight: "100 900",
  adjustFontFallback: "Arial",
});

export const playfair = localFont({
  src: "../app/fonts/playfair-display-latin-wght-normal.woff2",
  variable: "--font-playfair",
  display: "swap",
  preload: false,
  weight: "400 700",
  adjustFontFallback: "Times New Roman",
});

/**
 * Marketing-only display fonts (loaded from (public)/layout).
 * Keeps portal/admin pages from downloading Cormorant + Outfit.
 */
export const cormorant = localFont({
  src: [
    {
      path: "../app/fonts/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../app/fonts/cormorant-garamond-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../app/fonts/cormorant-garamond-latin-500-italic.woff2",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

/** Geometric sans close to Hers CareSans (custom; not licensable). */
export const outfit = localFont({
  src: "../app/fonts/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  display: "swap",
  preload: false,
  weight: "400 600",
  adjustFontFallback: "Arial",
});
