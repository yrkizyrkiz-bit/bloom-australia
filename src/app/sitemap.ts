import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { sitemapPaths } from "@/lib/seo/public-page-meta";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return sitemapPaths.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.split("/").length <= 2 ? 0.8 : 0.6,
  }));
}
