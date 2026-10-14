import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/** Paths crawlers must not index (member portal, auth, admin, checkout). */
const DISALLOW = [
  "/api/",
  "/admin/",
  "/dashboard/",
  "/gp/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/",
  "/payment/",
  "/programs",
  "/select-plan",
  "/checkout",
  "/membership/checkout",
  "/biomarkers/checkout",
  "/biomarker-intake",
  "/invoices/",
  "/metabolic-care/fatty-liver/assessment",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
