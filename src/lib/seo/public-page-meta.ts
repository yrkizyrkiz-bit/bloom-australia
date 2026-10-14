import { buildPageMetadata } from "@/lib/seo/site";

/** Unique SEO copy for public marketing and funnel routes. */
export const publicPageMeta = {
  home: buildPageMetadata({
    title: "Sanative | Doctor-Led Biomarker Care Australia",
    description:
      "Australian doctor-led membership from $365/year: 85+ biomarkers, AHPRA doctor review, and personalised care for weight, hormones, hair, and organ health.",
    path: "/",
  }),
  about: buildPageMetadata({
    title: "About Sanative | Doctor-Led Metabolic Care",
    description:
      "Sanative is an Australian doctor-led clinic. Membership starts with a health check and results reviewed by an AHPRA-registered doctor.",
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
    title: "Labs & Biomarker Testing | Sanative",
    description:
      "Doctor-ordered biomarker panels with clear results and a care plan. Pathology partners across Australia.",
    path: "/labs",
  }),
  labsBiomarkers: buildPageMetadata({
    title: "Biomarker Panels | Sanative Labs",
    description:
      "See which biomarkers Sanative reviews — metabolic, hormonal, cardiovascular, and organ health markers in one clear panel.",
    path: "/labs/biomarkers",
  }),
  labsActionPlan: buildPageMetadata({
    title: "Your Action Plan | Sanative Labs",
    description:
      "How Sanative turns biomarker results into a doctor-reviewed action plan you can follow.",
    path: "/labs/action-plan",
  }),
  weightManagement: buildPageMetadata({
    title: "Weight Management Program | Sanative",
    description:
      "Doctor-led weight management with biomarkers, personalised care planning, and ongoing support across Australia.",
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
    title: "Men’s Health | Energy, Vitality & Sexual Health | Sanative",
    description:
      "Doctor-led men’s health for energy, vitality, hair, and sexual health — with biomarker-guided care where appropriate.",
    path: "/mens-health",
  }),
  mensAssessment: buildPageMetadata({
    title: "Men’s Health Assessment | Sanative",
    description:
      "Complete a confidential men’s health assessment and take the first step toward doctor-led care.",
    path: "/mens-health/assessment",
  }),
  sexualHealth: buildPageMetadata({
    title: "Men’s Sexual Health | Sanative",
    description:
      "Confidential, doctor-led men’s sexual health care in Australia. Clinical assessment and personalised planning.",
    path: "/mens-health/sexual-health",
  }),
  erectileDysfunction: buildPageMetadata({
    title: "Erectile Dysfunction Care | Sanative",
    description:
      "Private, doctor-led erectile dysfunction assessment and care planning with Sanative.",
    path: "/mens-health/erectile-dysfunction",
  }),
  womensHealth: buildPageMetadata({
    title: "Women’s Health | Hormones & Metabolic Care | Sanative",
    description:
      "Doctor-led women’s health for menopause, hormones, PCOS, and metabolic wellbeing — with biomarkers where appropriate.",
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
    title: "Menopause & Perimenopause Care | Sanative",
    description:
      "Doctor-led menopause and perimenopause care with personalised assessment and ongoing support.",
    path: "/womens-health/menopause",
  }),
  hairHealth: buildPageMetadata({
    title: "Hair Health & Hair Loss Care | Sanative",
    description:
      "Doctor-led hair health assessment and care planning for thinning and hormone-related hair loss.",
    path: "/hair-health",
  }),
  hairAssessment: buildPageMetadata({
    title: "Hair Loss Assessment | Sanative",
    description:
      "Complete Sanative’s hair assessment to understand contributing factors and next clinical steps.",
    path: "/hair-assessment",
  }),
  metabolicCare: buildPageMetadata({
    title: "Metabolic Care | Sanative",
    description:
      "Doctor-led metabolic care for heart, liver, kidney, PCOS, and related conditions — guided by biomarkers.",
    path: "/metabolic-care",
  }),
  fattyLiver: buildPageMetadata({
    title: "Fatty Liver Care | Metabolic Health | Sanative",
    description:
      "Doctor-reviewed fatty liver and metabolic liver care with biomarker insights and a personalised plan.",
    path: "/metabolic-care/fatty-liver",
  }),
  heartHealth: buildPageMetadata({
    title: "Heart Health | Metabolic Care | Sanative",
    description:
      "Doctor-led heart and cardiovascular risk care using lipids, inflammation, and metabolic biomarkers.",
    path: "/metabolic-care/heart-health",
  }),
  kidneyHealth: buildPageMetadata({
    title: "Kidney Health | Metabolic Care | Sanative",
    description:
      "Doctor-reviewed kidney health insights and metabolic care planning with Sanative.",
    path: "/metabolic-care/kidney-health",
  }),
  pcos: buildPageMetadata({
    title: "PCOS Care | Metabolic & Hormonal Health | Sanative",
    description:
      "Doctor-led PCOS care with hormonal and metabolic assessment, biomarkers, and personalised planning.",
    path: "/metabolic-care/pcos",
  }),
  pcosBook: buildPageMetadata({
    title: "Book PCOS Assessment | Sanative",
    description:
      "Book a Sanative PCOS assessment for hormonal and metabolic review with an Australian doctor.",
    path: "/metabolic-care/pcos/book",
  }),
  organCare: buildPageMetadata({
    title: "Organ Care | Heart, Liver & Kidney | Sanative",
    description:
      "Doctor-reviewed organ care for heart, liver and kidney. Essential panel markers your Sanative doctor reviews in context.",
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
  }),
  privacy: buildPageMetadata({
    title: "Privacy Policy | Sanative",
    description:
      "How Sanative collects, uses, and protects your personal and health information.",
    path: "/privacy",
  }),
  refundPolicy: buildPageMetadata({
    title: "Refunds & Cancellations | Sanative",
    description:
      "Sanative membership and program refund, cancellation and payment terms.",
    path: "/refund-policy",
  }),
  subscriptionTerms: buildPageMetadata({
    title: "Subscription Terms | Sanative",
    description:
      "Subscription billing and cancellation terms for Sanative programs.",
    path: "/subscription-terms",
  }),
  telehealthConsent: buildPageMetadata({
    title: "Telehealth Consent | Sanative",
    description: "Consent information for Sanative telehealth consultations.",
    path: "/telehealth-consent",
  }),
  medicalDisclaimer: buildPageMetadata({
    title: "Medical Disclaimer | Sanative",
    description:
      "Important medical disclaimer for Sanative health information and assessments.",
    path: "/medical-disclaimer",
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
