import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

/** Match Netlify production viewport — do not add maximumScale/userScalable overrides. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Geometric sans close to Hers CareSans (custom; not licensable). */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sanative Health | Biomarker Tracking Portal",
  description: "Track your biomarkers, understand your health, and optimize your wellbeing with Sanative Health.",
  // Prevent search engine indexing - private deployment
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${cormorant.variable} ${outfit.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
