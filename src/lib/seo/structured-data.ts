import { SITE_URL } from "@/lib/seo/site";

const ORG_ID = `${SITE_URL}/#organization`;

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path === "/" ? SITE_URL : `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** MedicalWebPage + Article pair: Google reads Article for rich results, MedicalWebPage for health E-E-A-T. */
export function medicalArticleJsonLd(input: {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  keywords?: string[];
  about?: string[];
}) {
  const url = `${SITE_URL}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalWebPage", "Article"],
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: url,
    headline: input.headline,
    description: input.description,
    inLanguage: "en-AU",
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    keywords: input.keywords?.join(", "),
    about: input.about?.map((name) => ({ "@type": "MedicalCondition", name })),
    audience: { "@type": "MedicalAudience", audienceType: "Patient", geographicArea: { "@type": "Country", name: "Australia" } },
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    reviewedBy: {
      "@type": "Organization",
      name: "Sanative medical team (AHPRA-registered doctors)",
      url: `${SITE_URL}/about`,
    },
    lastReviewed: input.dateModified,
  };
}

export function medicalTestJsonLd(input: {
  path: string;
  name: string;
  alternateName?: string;
  description: string;
  usedToDiagnose?: string[];
  normalRange?: string;
}) {
  const url = `${SITE_URL}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    "@id": `${url}#test`,
    url,
    name: input.name,
    alternateName: input.alternateName,
    description: input.description,
    normalRange: input.normalRange,
    usedToDiagnose: input.usedToDiagnose?.map((name) => ({ "@type": "MedicalCondition", name })),
    availableService: {
      "@type": "MedicalTherapy",
      name: "Doctor-reviewed biomarker panel",
      provider: { "@id": ORG_ID },
    },
  };
}
