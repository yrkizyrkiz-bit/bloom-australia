import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/seo/GuideArticle";
import { guideBySlug, guidesUnderGuidesRoute } from "@/lib/seo/guides";
import { buildPageMetadata } from "@/lib/seo/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return guidesUnderGuidesRoute.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug.get(slug);
  if (!guide || !guide.path.startsWith("/guides/")) return {};
  const meta = buildPageMetadata({
    title: guide.title,
    description: guide.description,
    path: guide.path,
  });
  return {
    ...meta,
    keywords: guide.keywords,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideBySlug.get(slug);
  if (!guide || !guide.path.startsWith("/guides/")) notFound();

  return (
    <GuideArticle
      guide={guide}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Health guides", path: "/guides" },
        { name: guide.eyebrow, path: guide.path },
      ]}
    />
  );
}
