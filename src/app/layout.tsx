import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { inter, playfair } from "@/lib/fonts";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
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
    default: "Sanative | Doctor-Led Health Check Australia",
    template: "%s",
  },
  description:
    "Sanative health check in Australia: doctor-led membership from $365/year, 85+ biomarkers, pathology near you, and review by an AHPRA-registered doctor.",
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
    title: "Sanative | Doctor-Led Health Check Australia",
    description:
      "Sanative health check in Australia: doctor-led membership from $365/year, 85+ biomarkers, pathology near you, and review by an AHPRA-registered doctor.",
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
    title: "Sanative | Doctor-Led Health Check Australia",
    description:
      "Sanative health check in Australia: doctor-led membership from $365/year, 85+ biomarkers, pathology near you, and review by an AHPRA-registered doctor.",
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
      "@type": ["Organization", "MedicalOrganization"],
      "@id": "https://sanative.com.au/#organization",
      name: "Sanative",
      url: "https://sanative.com.au",
      logo: "https://sanative.com.au/icons/sanative-512.png",
      description:
        "Sanative is an Australian doctor-led health check. Membership includes 85+ biomarkers, pathology collection near you, and review by an AHPRA-registered doctor.",
      areaServed: {
        "@type": "Country",
        name: "Australia",
      },
      medicalSpecialty: ["Metabolic health", "Preventive medicine"],
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
        <Suspense fallback={null}>
          <MetaPixel />
          <GoogleAnalytics />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
