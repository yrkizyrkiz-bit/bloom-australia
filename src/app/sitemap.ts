import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { sitemapPaths } from "@/lib/seo/public-page-meta";
import { publishedGuides as seoGuides } from "@/lib/seo/guides";
import { biomarkerDefinitions } from "@/data/biomarkers";
import { biomarkerSlug } from "@/lib/seo/biomarker-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const toUrl = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);

  const marketing: MetadataRoute.Sitemap = sitemapPaths.map((path) => ({
    url: toUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.split("/").length <= 2 ? 0.8 : 0.6,
  }));

  const guides: MetadataRoute.Sitemap = [
    { url: toUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...seoGuides
      .filter((g) => g.path.startsWith("/guides/"))
      .map((g) => ({
        url: toUrl(g.path),
        lastModified: new Date(g.dateModified),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];

  const biomarkers: MetadataRoute.Sitemap = [
    { url: toUrl("/biomarkers"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...biomarkerDefinitions.map((b) => ({
      url: toUrl(`/biomarkers/${biomarkerSlug(b.id)}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  const seen = new Set<string>();
  return [...marketing, ...guides, ...biomarkers].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
