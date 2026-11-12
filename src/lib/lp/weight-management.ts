export const ASSESSMENT_PATH = "/weight-management/assessment";

export const LP_PATH = "/lp/weight-management";

/** Isolated LP-only funnel. Does not create an account. */
export const FUNNEL_PATH = "/lp/weight-management/start";

export const PRICING = {
  /** Clinical assessment with a Sanative doctor. */
  assessmentFee: 49,
  /** Value of the 85+ biomarker comprehensive health check (complimentary during the offer). */
  healthCheckValue: 365,
  biomarkerCount: 85,
  /** Ongoing weight management care. */
  carePerQuarter: 360,
} as const;

/**
 * End-of-year offer: weight loss members who sign up before the end of 2026
 * get the 85+ biomarker health check free. Deadline is midnight Sydney time.
 */
export const OFFER = {
  endsLabel: "31 December 2026",
  endsShort: "31 Dec",
  endsAt: new Date("2027-01-01T00:00:00+11:00"),
} as const;

export function isHealthCheckOfferActive(now: Date): boolean {
  return now.getTime() < OFFER.endsAt.getTime();
}

export const BMI_ELIGIBILITY_THRESHOLD = 27;

export const LP_FUNNEL_SOURCE = "lp_weight_management";

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Quick online intake assessment",
    body: "Start by telling us a little about your health, weight journey and goals. It's simple, private and only takes a few minutes.",
  },
  {
    title: "Consultation with a Sanative doctor",
    body: "Based on your assessment result and goals, a Sanative doctor will answer all your questions and make recommendations on which plan suits you best.",
  },
  {
    title: "Join the program",
    body: "If the program is right for you, start your journey, plans start from $247.50/month.",
  },
  {
    title: "Start your personalised program",
    body: "Everything required to get started is delivered directly to you in a compact, discreet pack. Enjoy your progress towards your goals with ongoing care, coaching and Care Partner support.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "How does the assessment work?",
    answer: `Answer a few questions about your health and goals online, then meet a Sanative doctor for your $${PRICING.assessmentFee} clinical assessment. If the program suits you.`,
  },
  {
    question: "What medical treatments are available for weight loss?",
    answer:
      "Treatment depends on your individual health assessment and biomarker results. Australian regulations prevent us from discussing specific treatments outside a consultation. If clinically appropriate, your doctor will talk you through all options, alongside nutrition, activity and lifestyle support.",
  },
  {
    question: "How much does the program cost?",
    answer: `Your clinical assessment with a Sanative doctor is $${PRICING.assessmentFee}. Program costs range from $247.50 to $330 per month depending on the treatment and plan selected. Weight loss members who sign up before ${OFFER.endsLabel} also receive a complimentary ${PRICING.biomarkerCount}+ biomarker comprehensive health check, valued at $${PRICING.healthCheckValue}.`,
  },
  {
    question: "What's in the free health check?",
    answer: `It's comprehensive biomarker insights covering ${PRICING.biomarkerCount}+ biomarkers — including blood sugar, insulin, thyroid, hormones, liver, kidney, heart and nutrient markers. It's normally valued at $${PRICING.healthCheckValue} and is included for weight loss members who join a weight loss program before ${OFFER.endsLabel}. T&Cs apply.`,
  },
  {
    question: "Who is eligible?",
    answer:
      "Our program is designed for adults who meet specific health criteria. Most eligible members have a BMI of 27 or more. Your doctor will confirm whether the program is right for you.",
  },
  {
    question: "How is this different from diets?",
    answer:
      "Diets treat everyone the same. Sanative starts with your biomarkers and medical history, so your plan addresses the factors that may be making weight loss harder for you — with a doctor, health coach and Care Partner supporting you. Where clinically appropriate, medical weight loss options may also be available.",
  },
  {
    question: "What is a Care Partner?",
    answer:
      "Your Care Partner is your go-to person between consults. They help you understand your results, keep you on track and answer questions about your program.",
  },
  {
    question: "Is Sanative private and discreet?",
    answer: "Yes. Your care happens online and your health data is encrypted and securely protected.",
  },
] as const;

/**
 * Carries the ad click's query params (gclid, utm_*, etc.) through to the
 * assessment so Google Ads attribution survives the hand-off.
 */
function withLpSource(pathname: string, search: string): string {
  const url = new URL(pathname, "https://sanative.com.au");
  const incoming = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  incoming.forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });
  if (!url.searchParams.has("source")) {
    url.searchParams.set("source", LP_FUNNEL_SOURCE);
  }
  return `${url.pathname}${url.search}`;
}

export function buildAssessmentUrl(search: string): string {
  return withLpSource(ASSESSMENT_PATH, search);
}

export function buildFunnelUrl(search: string): string {
  return withLpSource(FUNNEL_PATH, search);
}

export function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  if (heightCm < 100 || heightCm > 250 || weightKg < 30 || weightKg > 350) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function isLikelyEligibleBmi(bmi: number): boolean {
  return bmi >= BMI_ELIGIBILITY_THRESHOLD;
}

export const lpImages = {
  womanWaist: "/images/lp/weight-management/sanative-membership_WM_4.webp",
  manWaist: "/images/membership/wm_3_male.webp",
  biomarkerTube:
    "/images/lp/weight-management/sanative-membership_sanative-biomarker-test-tube.webp",
  doctorScreens:
    "/images/lp/weight-management/sanative-membership_sanative-doctor-screens.webp",
  ctaHero: "/images/lp/weight-management/sanative-weight-management_cta-hero.webp",
  ctaHeroMale: "/images/membership/Wm_man_LI.webp",
  treatment: "/images/lp/weight-management/treatment.jpg",
  inApp: "/images/lp/weight-management/in-app.jpg",
  resultsApp: "/images/membership/results_app.webp",
  ongoingCare: "/images/lp/weight-management/ongoing-care.webp",
  ongoingCareMale: "/images/lp/weight-management/ongoing-care-male.webp",
  welcomeFemale: "/images/lp/weight-management/welcome-female.webp",
  welcomeMale: "/images/lp/weight-management/welcome-male.webp",
  phillipSeeley: "/images/lp/weight-management/sanative-team_phillip-seeley.webp",
  kathEdwards: "/images/lp/weight-management/sanative-team_kath-edwards.webp",
  miaDavies: "/images/lp/weight-management/sanative-team_mia.webp",
  olfatZekry: "/images/lp/weight-management/sanative-team_olfat-zekry.webp",
} as const;
