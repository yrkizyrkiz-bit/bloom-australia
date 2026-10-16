import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { publishedGuides as seoGuides } from "@/lib/seo/guides";
import { buildPageMetadata } from "@/lib/seo/site";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";

export const metadata = buildPageMetadata({
  title: "Health Guides: Health Checks, Biomarkers, Heart, Liver, Weight & Hormones | Sanative",
  description:
    "Doctor-reviewed guides for Australians on health checks, blood tests, biomarkers, fatty liver, heart health, weight loss medications, erectile dysfunction and menopause.",
  path: "/guides",
});

export default function GuidesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Health guides", path: "/guides" },
            ])
          ),
        }}
      />
      <Header />
      <main className="bg-[#f4f7f2] text-[#1c1c1c]">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6038]">
            Health guides
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Doctor-reviewed health guides for Australians
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#3f4a38]">
            Plain-English explanations of health checks, blood tests, biomarkers and the conditions
            Sanative&apos;s programs address — written and reviewed by AHPRA-registered doctors.
          </p>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {seoGuides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={g.path}
                  className="flex h-full flex-col rounded-3xl border border-[#d6e0cf] bg-white p-6 transition hover:border-[#4f6038] hover:shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f6038]">
                    {g.eyebrow}
                  </span>
                  <span className="mt-2 text-xl font-semibold leading-snug text-[#1c1c1c]">
                    {g.h1}
                  </span>
                  <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#3f4a38]">
                    {g.description}
                  </span>
                  <span className="mt-auto pt-4 text-sm font-medium text-[#34412f]">Read guide →</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-3xl bg-white p-8 ring-1 ring-[#d6e0cf]">
            <h2 className="text-2xl font-semibold tracking-tight">Every biomarker, explained</h2>
            <p className="mt-2 text-[#3f4a38]">
              Browse the 85+ blood biomarkers Sanative reviews — what each one measures, its optimal
              range, and how to improve it.
            </p>
            <Link
              href="/biomarkers"
              className="mt-5 inline-flex rounded-full bg-[#34412f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a3526]"
            >
              Browse biomarkers
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
