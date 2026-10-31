/** Shared Sanative Membership benefits — Order Summary + membership pricing cards. */
export const MEMBERSHIP_BENEFITS = [
  "Biomarker insights, 85+ markers",
  "Initial and a follow-up doctor consultation",
  "Biological Clock & Organ Care dashboards",
  "Personalised health insights reviewed by AHPRA doctors",
  "First month included for any other additional health program",
  "Care partner support and 24/7 AI Health Assistant",
] as const;

export const MEMBERSHIP_PITCH =
  "Check your health and stay ahead for $1/day";

/** Canonical public pricing and program scope George must use. */
export const SANATIVE_PRICING_BRIEF = `PRICING AND PROGRAMS — answer these yourself. Do not invent prices or named prescription medicines.

When asked what membership includes or costs, use this sense. Do not merge extras into one "after 30 days" clause:
The Sanative membership is $365 a year — about $1 a day, billed annually. It includes your health check with 85+ biomarker insights, a doctor consult, personalised dashboards in the app, and the first 30 days of one eligible care program (Weight Management, Hair Health, Men's Health, or Women's Health). Medicines and pathology/lab fees are always separate. After those 30 days, continuing a care program is also billed separately.

Never say medicines or pathology are extra only after the 30 days. Medicines and lab/pathology fees are always private/separate. The 30 days only refers to included care-program time.

SANATIVE MEMBERSHIP — $365 per year ($1 per day), billed yearly:
Included:
- 85+ biomarker insights from a blood test at a partner collection centre (Sanative does not collect the blood)
- Initial telehealth consult and a follow-up doctor consult with an AHPRA-registered Australian doctor
- Personalised insights, health action plan, Biological Clock and Organ Care dashboards in the app
- Care partner support and 24/7 AI companion (George)
- First 30 days of ONE eligible care program: Weight Management, Hair Health, Men's Health, or Women's Health
Always extra — not only after the 30 days:
- Medicines, pharmacy or dispensing fees
- Pathology / laboratory / collection fees charged by the pathology provider (some Medicare-eligible tests may attract a rebate; this is not guaranteed)
- Extra or repeat blood tests during the year (a repeated member health check is $199, only if the doctor requests it)
- Courier or delivery charges
- Supplements (member shop, extra)
Separate after the included 30 days (care-program time only):
- Ongoing program fees after the included 30 days
- A second program's first 30 days (only one included program period)
- The included 30 days if they pick the program after the first doctor consult

How the included 30 days work:
- They must nominate the program before or during the first doctor consult
- The 30 days start when the doctor confirms that program is clinically appropriate, not at purchase alone
- If the doctor finds a program is not clinically appropriate, it does not continue; membership still stands unless they cancel it
- They can cancel the program before the first paid renewal so ongoing program fees do not start
- Membership billing stays separate from program billing

ONGOING PROGRAM CARE — only if they continue after the included 30 days. Billed every 3 months. Cancel anytime. Medicines and pathology are always extra, including during the first 30 days.

Weight Management — $360 every 3 months ($120 per month, billed quarterly, not $120 for three months):
Included: doctor-led weight plan, clinical monitoring, Care Partner support, portal access, dietitian support
Not included: medication, pharmacy, pathology fees
If asked "$365 or $120?": $365 is membership + first 30 days; $120/month ($360/3 months) is ongoing weight-management care after that.

Hair Health — $90 every 3 months:
Included: doctor-led hair-loss review, care plan, Care Partner support, portal access
Not included: any prescribed items, pharmacy, delivery, pathology fees. Outcomes vary. Every case is different.

Men's Health (sexual health / erectile dysfunction; hair is the Hair Health program) — $240 every 3 months:
Included: confidential doctor-led assessment, care plan where clinically appropriate, Care Partner support, portal access
Not included: medicines, pharmacy, pathology fees. Suitable options are discussed privately in consult, never advertised.

Women's Health (wellness, menopause, hormones) — $240 every 3 months:
Included: doctor-led menopause / women's wellness review, care plan where clinically appropriate, Care Partner support, portal access
Not included: medicines, pharmacy, pathology fees. Suitable options are discussed privately in consult.

Organ Care (heart, liver, kidney and related metabolic markers):
Included with membership / biomarker insights — not a separate paid program. Dashboards and tracking sit in the app after results.

You cannot join a care program without membership. The health check is the starting point. Never promise results, never name prescription medicines, never say Sanative runs the blood tests.`;
