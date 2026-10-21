import { buildPageMetadata, SANATIVE_DEFINITION_SNIPPET } from "@/lib/seo/site";

/** Unique SEO copy for public marketing and funnel routes. */
export const publicPageMeta = {
  home: buildPageMetadata({
    title: "Sanative | Doctor-Led Health Check Australia",
    description: SANATIVE_DEFINITION_SNIPPET,
    path: "/",
  }),
  about: buildPageMetadata({
    title: "About Sanative | Doctor-Led Metabolic Care",
    description: SANATIVE_DEFINITION_SNIPPET,
    path: "/about",
  }),
  contact: buildPageMetadata({
    title: "Contact | Sanative",
    description:
      "Talk to Sanative’s care team or AI care companion, or log in to your member portal for support.",
    path: "/contact",
  }),
  faqs: buildPageMetadata({
    title: "FAQs | Sanative Membership & Care",
    description:
      "Answers about Sanative membership, doctor-led care, biomarkers, billing, privacy, and how our Australian telehealth programs work.",
    path: "/faqs",
  }),
  pricing: buildPageMetadata({
    title: "Pricing & Membership | Sanative",
    description:
      "See Sanative membership pricing for doctor-led biomarker care, weight management, men’s and women’s health, and organ care programs.",
    path: "/pricing",
    index: false,
  }),
  services: buildPageMetadata({
    title: "Our Services | Sanative",
    description:
      "Explore Sanative’s doctor-led services: metabolic care, weight management, men’s health, women’s health, hair health, and biomarker labs.",
    path: "/services",
  }),
  join: buildPageMetadata({
    title: "Join Sanative | Start Your Membership",
    description:
      "Join Sanative for doctor-reviewed biomarkers and a personalised care pathway. Available across Australia.",
    path: "/join",
    index: false,
  }),
  labs: buildPageMetadata({
    title: "Blood Tests & Biomarker Testing Australia | 85+ Markers, Doctor-Reviewed | Sanative",
    description:
      "Comprehensive blood tests in Australia: 85+ biomarkers ordered by AHPRA doctors, collected at a pathology lab near you, explained in plain English. From $365/year.",
    path: "/labs",
  }),
  labsBiomarkers: buildPageMetadata({
    title: "Biomarker Panels: Heart, Metabolic, Liver, Kidney, Thyroid & Hormone Blood Tests | Sanative",
    description:
      "See every biomarker panel Sanative tests — cholesterol & ApoB, HbA1c & insulin, liver and kidney function, thyroid, hormones, iron, vitamins and inflammation.",
    path: "/labs/biomarkers",
  }),
  labsActionPlan: buildPageMetadata({
    title: "Your Action Plan | Sanative Labs",
    description:
      "How Sanative turns biomarker results into a doctor-reviewed action plan you can follow.",
    path: "/labs/action-plan",
  }),
  weightManagement: buildPageMetadata({
    title: "Medical Weight Loss Program Australia | Doctor-Led, Biomarker-Guided | Sanative",
    description:
      "Doctor-led weight loss in Australia. Start with 85+ biomarkers, get a personalised plan, dietitian support and ongoing doctor review. Telehealth nationwide.",
    path: "/weight-management",
  }),
  weightAssessment: buildPageMetadata({
    title: "Weight Management Assessment | Sanative",
    description:
      "Start your Sanative weight management assessment. Share your goals and history so a doctor can review your pathway.",
    path: "/weight-management/assessment",
  }),
  dietitianSupport: buildPageMetadata({
    title: "Dietitian Support | Weight Management | Sanative",
    description:
      "Nutrition support as part of Sanative’s doctor-led weight management program.",
    path: "/weight-management/dietitian-support",
  }),
  mensHealth: buildPageMetadata({
    title: "Men's Health Clinic Online Australia | Testosterone, Energy, Sexual Health | Sanative",
    description:
      "Doctor-led men's health in Australia: testosterone and metabolic blood tests, energy, hair, erectile dysfunction and sexual health — confidential telehealth care.",
    path: "/mens-health",
  }),
  mensAssessment: buildPageMetadata({
    title: "Men’s Health Assessment | Sanative",
    description:
      "Complete a confidential men’s health assessment and take the first step toward doctor-led care.",
    path: "/mens-health/assessment",
  }),
  sexualHealth: buildPageMetadata({
    title: "Men's Sexual Health & Erectile Dysfunction Clinic Online | Sanative",
    description:
      "Confidential, doctor-led men's sexual health care in Australia. Blood tests for testosterone, diabetes and heart risk, with a personalised, doctor-led care plan.",
    path: "/mens-health/sexual-health",
  }),
  erectileDysfunction: buildPageMetadata({
    title: "Erectile Dysfunction Care Australia | Doctor-Led ED Assessment Online | Sanative",
    description:
      "Private, doctor-led erectile dysfunction care in Australia. AHPRA doctors assess the cause — heart, metabolic, hormonal — with blood tests and a personalised plan. Telehealth nationwide.",
    path: "/mens-health/erectile-dysfunction",
  }),
  womensHealth: buildPageMetadata({
    title: "Women's Health Clinic Online Australia | Menopause, Hormones, PCOS | Sanative",
    description:
      "Doctor-led women's health in Australia: menopause and perimenopause, hormone and thyroid blood tests, PCOS and metabolic care via confidential telehealth.",
    path: "/womens-health",
  }),
  womensAssessment: buildPageMetadata({
    title: "Women’s Health Assessment | Sanative",
    description:
      "Start a confidential women’s health assessment with Sanative and connect with doctor-led care.",
    path: "/womens-health/assessment",
  }),
  womensBook: buildPageMetadata({
    title: "Book Women’s Health Care | Sanative",
    description:
      "Book your Sanative women’s health pathway and doctor review.",
    path: "/womens-health/book",
  }),
  menopause: buildPageMetadata({
    title: "Menopause & Perimenopause: Symptoms, Blood Tests & Treatment in Australia | Sanative",
    description:
      "Doctor-led menopause and perimenopause care in Australia. Understand symptoms, which blood tests are useful (and which aren't), the cardiometabolic changes of menopause, and MHT and non-hormonal treatment options.",
    path: "/womens-health/menopause",
  }),
  hairHealth: buildPageMetadata({
    title: "Hair Loss Treatment Australia | Doctor-Led Hair Health Program | Sanative",
    description:
      "Doctor-led hair loss care in Australia. Blood tests for iron, thyroid and hormones, clinical assessment and personalised treatment planning for thinning hair.",
    path: "/hair-health",
  }),
  hairAssessment: buildPageMetadata({
    title: "Hair Loss Assessment | Sanative",
    description:
      "Complete Sanative’s hair assessment to understand contributing factors and next clinical steps.",
    path: "/hair-assessment",
  }),
  metabolicCare: buildPageMetadata({
    title: "Metabolic Health Program Australia | Heart, Liver, Kidney & PCOS | Sanative",
    description:
      "Doctor-led metabolic care in Australia: insulin resistance, fatty liver, heart health, kidney function and PCOS — guided by 85+ biomarkers.",
    path: "/metabolic-care",
  }),
  fattyLiver: buildPageMetadata({
    title: "Fatty Liver Treatment Australia | Liver Function Tests & Doctor-Led Care | Sanative",
    description:
      "Fatty liver (MASLD/NAFLD) care in Australia: liver function tests, FIB-4 fibrosis score, insulin resistance markers and a doctor-led plan to reverse it.",
    path: "/metabolic-care/fatty-liver",
  }),
  heartHealth: buildPageMetadata({
    title: "Heart Health Check Australia | Cholesterol, ApoB, Lp(a) & Cardiovascular Risk | Sanative",
    description:
      "Doctor-led heart health check in Australia: full lipid panel, ApoB, Lipoprotein(a), hs-CRP, HbA1c and kidney markers to assess and lower cardiovascular disease risk.",
    path: "/metabolic-care/heart-health",
  }),
  kidneyHealth: buildPageMetadata({
    title: "Kidney Health Check Australia | eGFR, Creatinine & Urine ACR | Sanative",
    description:
      "Doctor-reviewed kidney function tests in Australia — eGFR, creatinine, urine albumin-creatinine ratio — with metabolic care to protect kidney health.",
    path: "/metabolic-care/kidney-health",
  }),
  pcos: buildPageMetadata({
    title: "PCOS Treatment Australia | Hormone & Metabolic Blood Tests, Doctor-Led Care | Sanative",
    description:
      "Doctor-led PCOS care in Australia: androgen, insulin resistance and thyroid blood tests with a personalised metabolic and hormonal plan via telehealth.",
    path: "/metabolic-care/pcos",
  }),
  pcosBook: buildPageMetadata({
    title: "Book PCOS Assessment | Sanative",
    description:
      "Book a Sanative PCOS assessment for hormonal and metabolic review with an Australian doctor.",
    path: "/metabolic-care/pcos/book",
  }),
  organCare: buildPageMetadata({
    title: "Organ Health Check Australia | Heart, Liver & Kidney Blood Tests | Sanative",
    description:
      "Doctor-reviewed heart, liver and kidney health check in Australia. Essential organ biomarkers tested together and explained in one clear picture.",
    path: "/organ-care",
  }),
  forDoctors: buildPageMetadata({
    title: "For Doctors | Partner with Sanative",
    description:
      "Learn how AHPRA-registered doctors work with Sanative’s biomarker-guided care programs.",
    path: "/for-doctors",
  }),
  forDoctorsRegister: buildPageMetadata({
    title: "Doctor Registration | Sanative",
    description:
      "Register your interest in joining Sanative as a consulting doctor.",
    path: "/for-doctors/register",
    index: false,
  }),
  terms: buildPageMetadata({
    title: "Terms & Conditions | Sanative",
    description: "Terms and conditions for using Sanative services and website.",
    path: "/terms",
    maxSnippet: 50,
  }),
  privacy: buildPageMetadata({
    title: "Privacy Policy | Sanative",
    description:
      "How Sanative collects, uses, and protects your personal and health information.",
    path: "/privacy",
    maxSnippet: 50,
  }),
  refundPolicy: buildPageMetadata({
    title: "Refunds & Cancellations | Sanative",
    description:
      "Sanative membership and program refund, cancellation and payment terms.",
    path: "/refund-policy",
    maxSnippet: 50,
  }),
  subscriptionTerms: buildPageMetadata({
    title: "Subscription Terms | Sanative",
    description:
      "Subscription billing and cancellation terms for Sanative programs.",
    path: "/subscription-terms",
    maxSnippet: 50,
  }),
  telehealthConsent: buildPageMetadata({
    title: "Telehealth Consent | Sanative",
    description: "Consent information for Sanative telehealth consultations.",
    path: "/telehealth-consent",
    maxSnippet: 50,
  }),
  medicalDisclaimer: buildPageMetadata({
    title: "Medical Disclaimer | Sanative",
    description:
      "Important medical disclaimer for Sanative health information and assessments.",
    path: "/medical-disclaimer",
    maxSnippet: 50,
  }),
  // Transactional / private-ish — unique titles but noindex
  checkout: buildPageMetadata({
    title: "Checkout | Sanative",
    description: "Complete your Sanative membership checkout securely.",
    path: "/checkout",
    index: false,
  }),
  membershipCheckout: buildPageMetadata({
    title: "Membership Checkout | Sanative",
    description: "Complete your Sanative membership payment.",
    path: "/membership/checkout",
    index: false,
  }),
  biomarkersCheckout: buildPageMetadata({
    title: "Biomarkers Checkout | Sanative",
    description: "Complete your Sanative biomarker panel checkout.",
    path: "/biomarkers/checkout",
    index: false,
  }),
  biomarkerIntake: buildPageMetadata({
    title: "Biomarker Intake | Sanative",
    description: "Complete your Sanative biomarker intake questionnaire.",
    path: "/biomarker-intake",
    index: false,
  }),
  invoiceSample: buildPageMetadata({
    title: "Sample Tax Invoice | Sanative",
    description: "Sample Sanative tax invoice.",
    path: "/invoices/sample",
    index: false,
  }),
  invoice: buildPageMetadata({
    title: "Tax Invoice | Sanative",
    description: "Your Sanative tax invoice.",
    path: "/invoices",
    index: false,
  }),
} as const;

/** Paths included in sitemap (indexable marketing pages only). */
export const sitemapPaths: string[] = Object.values(publicPageMeta)
  .filter((meta) => {
    const robots = meta.robots;
    if (robots && typeof robots === "object" && "index" in robots) {
      return robots.index !== false;
    }
    return true;
  })
  .map((meta) => {
    const canonical = meta.alternates?.canonical;
    if (typeof canonical === "string") {
      return canonical.replace("https://sanative.com.au", "") || "/";
    }
    return "/";
  })
  .filter((path, i, arr) => arr.indexOf(path) === i);
