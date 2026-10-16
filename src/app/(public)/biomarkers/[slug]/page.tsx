import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { biomarkerDefinitions, categoryInfo, getBiomarkerById } from "@/data/biomarkers";
import {
  biomarkerCategoryConditions,
  biomarkerFaqs,
  biomarkerSeoDescription,
  biomarkerSeoTitle,
  biomarkerSlug,
  formatRange,
  getBiomarkerBySlug,
  rangesAreIdentical,
} from "@/lib/seo/biomarker-seo";
import { buildPageMetadata } from "@/lib/seo/site";
import { breadcrumbJsonLd, faqJsonLd, medicalTestJsonLd } from "@/lib/seo/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return biomarkerDefinitions.map((b) => ({ slug: biomarkerSlug(b.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const def = getBiomarkerBySlug(slug);
  if (!def) return {};
  return buildPageMetadata({
    title: biomarkerSeoTitle(def),
    description: biomarkerSeoDescription(def),
    path: `/biomarkers/${slug}`,
  });
}

function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export default async function BiomarkerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getBiomarkerBySlug(slug);
  if (!def) notFound();

  const path = `/biomarkers/${slug}`;
  const category = categoryInfo[def.category];
  const identical = rangesAreIdentical(def);
  const faqs = biomarkerFaqs(def);
  const related = def.relatedBiomarkers
    .map((id) => getBiomarkerById(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const normalRange = identical
    ? formatRange(def, "male")
    : `Men ${formatRange(def, "male")}; women ${formatRange(def, "female")}`;

  return (
    <>
      <JsonLd
        data={medicalTestJsonLd({
          path,
          name: `${def.name} blood test`,
          alternateName: def.shortName !== def.name ? def.shortName : undefined,
          description: def.description,
          usedToDiagnose: biomarkerCategoryConditions[def.category],
          normalRange,
        })}
      />
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Biomarkers", path: "/biomarkers" },
          { name: category.name, path: `/biomarkers#${def.category}` },
          { name: def.name, path },
        ])}
      />

      <Header />
      <main className="bg-[#f4f7f2] text-[#1c1c1c]">
        <article className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#5f6d55]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:underline">Home</Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/biomarkers" className="hover:underline">Biomarkers</Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/biomarkers#${def.category}`} className="hover:underline">{category.name}</Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-[#34412f]">{def.name}</li>
            </ol>
          </nav>

          <header>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6038]">
              {category.name} biomarker
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {def.name} blood test{def.shortName !== def.name ? ` (${def.shortName})` : ""}
            </h1>
            {def.commonName && <p className="mt-2 text-lg text-[#5f6d55]">{def.commonName}</p>}
            <p className="mt-5 text-lg leading-relaxed text-[#3f4a38]">{def.description}</p>
          </header>

          <section className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-[#d6e0cf] sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">Optimal range for {def.name}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {identical ? (
                <div className="rounded-2xl bg-[#eef4e6] p-4 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[#4f6038]">Adults</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#1c1c1c]">{formatRange(def, "male")}</dd>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-[#eef4e6] p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#4f6038]">Men</dt>
                    <dd className="mt-1 text-2xl font-semibold text-[#1c1c1c]">{formatRange(def, "male")}</dd>
                  </div>
                  <div className="rounded-2xl bg-[#eef4e6] p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#4f6038]">Women</dt>
                    <dd className="mt-1 text-2xl font-semibold text-[#1c1c1c]">{formatRange(def, "female")}</dd>
                  </div>
                </>
              )}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-[#5f6d55]">
              Sanative&apos;s optimal range is based on current evidence and is often narrower than the
              laboratory reference interval printed on a pathology report. Ranges vary between labs,
              assays, age and context — your doctor interprets your result alongside your other markers.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight">Why {def.name} matters</h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-[#2f382a]">{def.whyItMatters}</p>
          </section>

          {def.improvementTips.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">How to improve your {def.name}</h2>
              <ul className="mt-4 space-y-2.5">
                {def.improvementTips.map((tip) => (
                  <li key={tip} className="flex gap-3 text-[1.02rem] leading-relaxed text-[#2f382a]">
                    <span aria-hidden className="mt-[0.7rem] h-1.5 w-1.5 flex-none rounded-full bg-[#4f6038]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[#5f6d55]">
                General information only. Discuss changes with your doctor, particularly if you take
                medication or have an existing condition.
              </p>
            </section>
          )}

          <section className="mt-14 rounded-3xl bg-[#34412f] p-8 text-white sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">
              Test your {def.name} with a doctor-reviewed panel
            </h2>
            <p className="mt-3 text-[#cdd8c6]">
              {def.name} is one of 85+ biomarkers in Sanative membership — ordered by our doctors,
              collected at a pathology centre near you, explained in plain English and tracked over time.
            </p>
            <Link
              href="/labs"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#34412f] hover:bg-[#eef4e6]"
            >
              See Sanative Labs
            </Link>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
            <dl className="mt-6 divide-y divide-[#d6e0cf]">
              {faqs.map((f) => (
                <div key={f.question} className="py-5">
                  <dt className="text-lg font-medium">{f.question}</dt>
                  <dd className="mt-2 leading-relaxed text-[#2f382a]">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6038]">
                Related biomarkers
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/biomarkers/${biomarkerSlug(r.id)}`}
                      className="inline-flex rounded-full border border-[#c9d6c0] bg-white px-4 py-2 text-sm text-[#34412f] hover:border-[#4f6038] hover:bg-[#eef4e6]"
                    >
                      {r.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={`/biomarkers#${def.category}`}
                    className="inline-flex rounded-full border border-[#c9d6c0] bg-white px-4 py-2 text-sm text-[#34412f] hover:border-[#4f6038] hover:bg-[#eef4e6]"
                  >
                    All {category.name.toLowerCase()} biomarkers
                  </Link>
                </li>
              </ul>
            </section>
          )}

          <p className="mt-12 text-xs leading-relaxed text-[#5f6d55]">
            General information for Australian readers; not a substitute for advice from a registered
            health practitioner. See our{" "}
            <Link href="/medical-disclaimer" className="underline">medical disclaimer</Link>.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
