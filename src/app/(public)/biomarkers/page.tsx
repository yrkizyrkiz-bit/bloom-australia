import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { biomarkersGroupedByCategory, biomarkerSlug, formatRange } from "@/lib/seo/biomarker-seo";
import { buildPageMetadata } from "@/lib/seo/site";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";

export const metadata = buildPageMetadata({
  title: "Blood Biomarkers A–Z: 85+ Tests Explained with Optimal Ranges | Sanative",
  description:
    "Every blood biomarker Sanative tests, explained in plain English: cholesterol, ApoB, HbA1c, insulin, liver and kidney function, thyroid, hormones, iron, vitamins and inflammation — with optimal ranges.",
  path: "/biomarkers",
});

export default function BiomarkersIndexPage() {
  const groups = biomarkersGroupedByCategory();
  const total = groups.reduce((n, g) => n + g.biomarkers.length, 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Biomarkers", path: "/biomarkers" },
            ])
          ),
        }}
      />
      <Header />
      <main className="bg-[#f4f7f2] text-[#1c1c1c]">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6038]">
            Biomarker library
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {total} blood biomarkers, explained
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#3f4a38]">
            What each blood test measures, Sanative&apos;s optimal range, why it matters and how to
            improve it. Every marker is reviewed by an AHPRA-registered doctor as part of membership.
          </p>

          <nav aria-label="Categories" className="mt-8 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a
                key={g.category}
                href={`#${g.category}`}
                className="rounded-full border border-[#c9d6c0] bg-white px-4 py-1.5 text-sm text-[#34412f] hover:border-[#4f6038] hover:bg-[#eef4e6]"
              >
                {g.label} ({g.biomarkers.length})
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-14">
            {groups.map((g) => (
              <section key={g.category} id={g.category} className="scroll-mt-28">
                <h2 className="text-2xl font-semibold tracking-tight">{g.label} biomarkers</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.biomarkers.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/biomarkers/${biomarkerSlug(b.id)}`}
                        className="flex h-full flex-col rounded-2xl border border-[#d6e0cf] bg-white p-4 transition hover:border-[#4f6038] hover:shadow-sm"
                      >
                        <span className="font-semibold text-[#1c1c1c]">{b.name}</span>
                        {b.commonName && (
                          <span className="mt-0.5 text-sm text-[#5f6d55]">{b.commonName}</span>
                        )}
                        <span className="mt-2 text-xs text-[#4f6038]">
                          Optimal: {formatRange(b, "male")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-16 rounded-3xl bg-[#34412f] p-8 text-white sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">
              Get all {total} markers tested and reviewed by a doctor
            </h2>
            <p className="mt-3 text-[#cdd8c6]">
              Membership from $365/year. Collected at a partner pathology centre near you, anywhere in
              Australia.
            </p>
            <Link
              href="/labs"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#34412f] hover:bg-[#eef4e6]"
            >
              See how Sanative Labs works
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
