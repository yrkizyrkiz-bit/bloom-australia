import type { Metadata } from "next";
import { GuideArticle } from "@/components/seo/GuideArticle";
import { guideByPath } from "@/lib/seo/guides";
import { buildPageMetadata } from "@/lib/seo/site";

const guide = guideByPath.get("/womens-health/menopause")!;

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: guide.title,
    description: guide.description,
    path: guide.path,
  }),
  keywords: guide.keywords,
};

export default function MenopausePage() {
  return (
    <GuideArticle
      guide={guide}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Women's health", path: "/womens-health" },
        { name: "Menopause", path: guide.path },
      ]}
    />
  );
}
