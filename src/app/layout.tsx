import type { Metadata, Viewport } from "next";
import { inter, playfair } from "@/lib/fonts";
import "./globals.css";

/** Match Netlify production viewport — do not add maximumScale/userScalable overrides. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#34412f",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sanative.com.au"),
  title: {
    default: "Sanative | Doctor-Led Biomarker Care Australia",
    template: "%s",
  },
  description:
    "From biomarkers to doctor-led care plans, Sanative helps Australians understand their health and act on it. AHPRA-registered doctors. Available across Australia.",
  applicationName: "Sanative",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sanative",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/sanative-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/sanative-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/sanative-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://sanative.com.au",
    siteName: "Sanative",
    title: "Sanative | Doctor-Led Biomarker Care Australia",
    description:
      "From biomarkers to doctor-led care plans, Sanative helps Australians understand their health and act on it.",
    images: [
      {
        url: "/images/tablet-slider/sanative-hero-clean.webp",
        width: 1200,
        height: 630,
        alt: "Sanative doctor-led biomarker care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanative | Doctor-Led Biomarker Care Australia",
    description:
      "From biomarkers to doctor-led care plans, Sanative helps Australians understand their health and act on it.",
    images: ["/images/tablet-slider/sanative-hero-clean.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://sanative.com.au/#organization",
      name: "Sanative",
      url: "https://sanative.com.au",
      logo: "https://sanative.com.au/icons/sanative-512.png",
      description:
        "Doctor-led biomarker care and metabolic health programs across Australia.",
      areaServed: "AU",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://sanative.com.au/#website",
      url: "https://sanative.com.au",
      name: "Sanative",
      publisher: { "@id": "https://sanative.com.au/#organization" },
      inLanguage: "en-AU",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
