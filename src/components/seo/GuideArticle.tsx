import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import type { SeoGuide } from "@/lib/seo/guides";
import { breadcrumbJsonLd, faqJsonLd, medicalArticleJsonLd } from "@/lib/seo/structured-data";

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

/** Server-rendered long-form guide with Article/MedicalWebPage, FAQ and Breadcrumb schema. */
export function GuideArticle({
  guide,
  breadcrumbs,
}: {
  guide: SeoGuide;
  breadcrumbs: { name: string; path: string }[];
}) {
  const faqs = guide.faqs;

  return (
    <>
      <JsonLd
        data={medicalArticleJsonLd({
          path: guide.path,
          headline: guide.h1,
          description: guide.description,
          datePublished: guide.datePublished,
          dateModified: guide.dateModified,
          keywords: guide.keywords,
        })}
      />
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />

      <Header />
      <main className="bg-[#f4f7f2] text-[#1c1c1c]">
        <article className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#5f6d55]">
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumbs.map((b, i) => (
                <li key={b.path} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span aria-current="page" className="text-[#34412f]">
                      {b.name}
                    </span>
                  ) : (
                    <Link href={b.path} className="hover:text-[#34412f] hover:underline">
                      {b.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <header className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6038]">
              {guide.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#1c1c1c] sm:text-4xl lg:text-[2.6rem]">
              {guide.h1}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#3f4a38]">{guide.intro}</p>
            <p className="mt-5 text-xs text-[#5f6d55]">
              For educational purposes only. This should not be used or considered as medical
              advice. · Updated{" "}
              <time dateTime={guide.dateModified}>{formatDate(guide.dateModified)}</time>
            </p>
          </header>

          {guide.regulatoryNote && (
            <aside
              role="note"
              className="mb-10 rounded-2xl border border-[#d9c48a] bg-[#fbf6e6] p-5 text-sm leading-relaxed text-[#5a4a16]"
            >
              <strong className="mb-1 block font-semibold">Important</strong>
              {guide.regulatoryNote}
            </aside>
          )}

          <div className="space-y-12">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold tracking-tight text-[#1c1c1c]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="mt-4 text-[1.05rem] leading-relaxed text-[#2f382a]">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2.5 pl-1">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-[1.02rem] leading-relaxed text-[#2f382a]">
                        <span aria-hidden className="mt-[0.7rem] h-1.5 w-1.5 flex-none rounded-full bg-[#4f6038]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-14 rounded-3xl bg-[#34412f] p-8 text-white sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">{guide.cta.label}</h2>
            <p className="mt-3 text-[#cdd8c6]">{guide.cta.note}</p>
            <Link
              href={guide.cta.href}
              className="mt-6 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#34412f] transition hover:bg-[#eef4e6]"
            >
              Get started
            </Link>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight text-[#1c1c1c]">
              Frequently asked questions
            </h2>
            <dl className="mt-6 divide-y divide-[#d6e0cf]">
              {faqs.map((f) => (
                <div key={f.question} className="py-5">
                  <dt className="text-lg font-medium text-[#1c1c1c]">{f.question}</dt>
                  <dd className="mt-2 leading-relaxed text-[#2f382a]">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          {guide.related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6038]">
                Related
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {guide.related.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="inline-flex rounded-full border border-[#c9d6c0] bg-white px-4 py-2 text-sm text-[#34412f] transition hover:border-[#4f6038] hover:bg-[#eef4e6]"
                    >
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-12 text-xs leading-relaxed text-[#5f6d55]">
            This article is general information for Australian readers and does not replace a
            consultation with a registered health practitioner. See our{" "}
            <Link href="/medical-disclaimer" className="underline">
              medical disclaimer
            </Link>
            .
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
