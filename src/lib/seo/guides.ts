/**
 * Long-form SEO guides (server-rendered). Each guide targets a search intent that
 * competitors rank for (health check, fatty liver, heart health / CVD, weight loss
 * medications, ED medications, biomarkers, menopause, blood tests / pathology).
 *
 * Medication guides are educational only. In Australia, advertising prescription-only
 * medicines to the public is prohibited (Therapeutic Goods Act 1989 / TGA Advertising
 * Code). Keep copy balanced, name risks, never promote a product or price.
 */

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuideFaq = { question: string; answer: string };

export type SeoGuide = {
  slug: string;
  /** Canonical path. Most guides live under /guides; some map onto existing program URLs. */
  path: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  eyebrow: string;
  intro: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  related: { label: string; href: string }[];
  cta: { label: string; href: string; note: string };
  /** Shown prominently on medication guides. */
  regulatoryNote?: string;
  /**
   * "draft" guides are kept in the repo but NOT routed, linked or listed in the sitemap.
   * Medication-name guides are drafts until Sanative's legal/medical review signs off:
   * they conflict with BANNED_PUBLIC_MEDICATION_TERMS in src/lib/legal/marketing-compliance.ts.
   */
  status?: "published" | "draft";
  datePublished: string;
  dateModified: string;
};

const MEDICATION_NOTE =
  "This page is general health information, not medical advice and not an advertisement for any medicine. The medicines mentioned are prescription-only in Australia. Only a registered doctor can decide whether a medicine is appropriate for you after assessing your health, and they may recommend against it. Always read the Consumer Medicine Information and speak to your doctor or pharmacist about side effects.";

export const seoGuides: SeoGuide[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "health-check-australia",
    path: "/guides/health-check-australia",
    title: "Full Health Check in Australia: What to Test & When (2026 Guide)",
    h1: "Health check in Australia: what a complete check-up should include",
    description:
      "What a full health check in Australia should cover — blood tests, blood pressure, cancer screening and doctor review — plus how Medicare, GP and private health checks differ.",
    keywords: [
      "health check",
      "full health check Australia",
      "comprehensive health check",
      "health assessment",
      "preventive health check",
      "executive health check",
    ],
    eyebrow: "Preventive health",
    intro:
      "Most chronic disease — type 2 diabetes, fatty liver, cardiovascular disease, kidney disease — develops silently for years before symptoms appear. A structured health check is how you find those changes while they are still reversible. This guide explains what a complete health check should include, how often to do one, and what the Medicare, GP and private options look like in Australia.",
    sections: [
      {
        heading: "What should a full health check include?",
        paragraphs: [
          "A genuinely useful health check has three parts: measurements, pathology (blood and urine tests), and a doctor who interprets the results in the context of your history, family history and goals. A printout of numbers without interpretation is not a health check.",
        ],
        bullets: [
          "Measurements: blood pressure, weight, BMI and waist circumference, resting heart rate.",
          "Metabolic: fasting glucose, HbA1c, fasting insulin, lipid panel (total, LDL, HDL, triglycerides, non-HDL), ApoB and Lipoprotein(a) where appropriate.",
          "Organ function: liver (ALT, AST, GGT, albumin, bilirubin), kidney (creatinine, eGFR, urine albumin-creatinine ratio), thyroid (TSH ± free T4).",
          "Blood health: full blood count, iron studies and ferritin, vitamin B12, folate, vitamin D.",
          "Inflammation: high-sensitivity CRP.",
          "Hormones where indicated: testosterone (men), oestradiol/FSH (women under 45 with symptoms), cortisol.",
          "Age-appropriate cancer screening: bowel (45–74), breast (50–74, eligible from 40), cervical (25–74), skin checks.",
        ],
      },
      {
        heading: "Medicare, GP and private health checks — what's the difference?",
        paragraphs: [
          "Medicare subsidises specific health assessments through a GP, including the 45–49 year old health assessment for people at risk of chronic disease, the 75+ assessment, and the Heart Health Check. These are valuable but limited in scope, and the pathology ordered is usually restricted to what is clinically indicated and Medicare-rebatable.",
          "Private and membership-based health checks order a broader biomarker panel up front, then have a doctor review the whole picture. The trade-off is cost: self-requested or extended panels are generally not Medicare-rebated. The advantage is depth — markers like ApoB, Lp(a), fasting insulin or hs-CRP are rarely part of a standard GP check but change how early you can act.",
        ],
      },
      {
        heading: "How often should you have a health check?",
        paragraphs: [
          "For most adults a comprehensive baseline, then an annual re-test of the key metabolic and organ markers, is enough to see trends. Some markers only need testing once (Lipoprotein(a) is largely genetic), while others — HbA1c, liver enzymes, blood pressure — are most useful tracked over time. If you are changing medication, diet or training, re-testing at 3–6 months shows whether it is working.",
        ],
      },
      {
        heading: "How Sanative's health check works",
        paragraphs: [
          "Sanative membership starts with a doctor-ordered panel of 85+ biomarkers collected at a partner pathology lab near you, anywhere in Australia. An AHPRA-registered doctor reviews your results and your history, and you receive a plain-English report with every marker explained, trended, and linked to an action plan. Programs for weight, heart, liver, kidney, hormones and hair build on that baseline rather than treating symptoms in isolation.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is a full health check free in Australia?",
        answer:
          "Specific GP health assessments (for example the 45–49 year old assessment and the Heart Health Check) are Medicare-rebated for eligible people. Broader biomarker panels or self-requested tests are generally paid privately.",
      },
      {
        question: "Do I need to fast for a health check?",
        answer:
          "Fasting glucose and fasting insulin require 8–12 hours without food. Lipids can usually be done non-fasting, but your doctor may ask you to fast so every marker is comparable. Water is fine.",
      },
      {
        question: "What is the difference between a health check and an executive health check?",
        answer:
          "Executive health checks are typically a one-day, in-person package of tests and imaging. Membership models like Sanative spread the same depth of testing over the year with ongoing doctor follow-up, which is usually better for tracking change.",
      },
      {
        question: "What age should you start having health checks?",
        answer:
          "Risk factors begin accumulating in your 20s and 30s. A baseline panel by 30, then annually from 40, is a reasonable approach for most people; earlier if you have a family history of heart disease, diabetes or cancer.",
      },
    ],
    related: [
      { label: "Biomarkers explained", href: "/guides/biomarkers-explained" },
      { label: "Blood tests & pathology in Australia", href: "/guides/blood-tests-pathology-australia" },
      { label: "See the 85+ biomarkers Sanative tests", href: "/biomarkers" },
    ],
    cta: {
      label: "Start your doctor-led health check",
      href: "/labs",
      note: "Membership from $365/year includes your biomarker panel and doctor review.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "fatty-liver-blood-test",
    path: "/guides/fatty-liver-blood-test",
    title: "Fatty Liver (MASLD): Symptoms, Blood Tests & How to Reverse It | Sanative",
    h1: "Fatty liver disease: symptoms, blood tests and how it is reversed",
    description:
      "Fatty liver (MASLD/NAFLD) affects around 1 in 3 Australian adults and is often silent. Learn the liver function tests, FIB-4 score and metabolic markers that detect it — and how it is reversed.",
    keywords: [
      "fatty liver",
      "fatty liver blood test",
      "liver function test",
      "MASLD",
      "NAFLD Australia",
      "how to reverse fatty liver",
      "ALT AST GGT",
    ],
    eyebrow: "Metabolic liver health",
    intro:
      "Fatty liver disease — now called metabolic dysfunction-associated steatotic liver disease (MASLD), previously NAFLD — is the most common liver condition in Australia. It is strongly linked to insulin resistance, excess weight around the abdomen and type 2 diabetes, and most people have no symptoms until it is advanced. The good news: in its early stages fatty liver is one of the most reversible chronic conditions there is.",
    sections: [
      {
        heading: "What is fatty liver and why does it matter?",
        paragraphs: [
          "Fatty liver means more than about 5% of liver cells contain fat. On its own that is called simple steatosis. In a proportion of people the fat triggers inflammation (steatohepatitis, or MASH), which over years can scar the liver (fibrosis) and progress to cirrhosis or liver cancer. Fatty liver also roughly doubles cardiovascular risk — most people with MASLD die of heart disease, not liver disease — which is why it should be treated as a whole-body metabolic condition.",
        ],
      },
      {
        heading: "Symptoms of fatty liver",
        paragraphs: [
          "Early fatty liver is usually silent. When symptoms do occur they are vague: fatigue, discomfort in the upper right abdomen, or being told your liver enzymes are 'a bit high' on a routine test. Signs of advanced disease — jaundice, swelling of the legs or abdomen, easy bruising — mean significant damage has already happened, which is why screening matters for anyone with risk factors.",
        ],
        bullets: [
          "Waist circumference above 94 cm (men) or 80 cm (women)",
          "Type 2 diabetes or prediabetes (HbA1c 5.7–6.4%)",
          "High triglycerides or low HDL cholesterol",
          "High blood pressure",
          "Obstructive sleep apnoea or PCOS",
        ],
      },
      {
        heading: "Blood tests for fatty liver",
        paragraphs: [
          "No single blood test diagnoses fatty liver, but a panel of markers detects it, estimates scarring and shows the metabolic drivers behind it. Imaging (ultrasound or FibroScan) confirms fat and stiffness when indicated.",
        ],
        bullets: [
          "ALT and AST — liver enzymes released when liver cells are stressed. ALT is often mildly raised in fatty liver; normal ALT does not exclude it.",
          "GGT — sensitive to fat and alcohol-related liver stress.",
          "AST:ALT ratio — a ratio above 1 raises suspicion of more advanced fibrosis.",
          "FIB-4 score — calculated from age, AST, ALT and platelets; the recommended first-line test for ruling out significant fibrosis.",
          "Fasting insulin, HOMA-IR, HbA1c, triglycerides and TG:HDL ratio — measure the insulin resistance that drives fat deposition.",
          "Albumin, bilirubin and platelets — fall as liver function declines.",
        ],
      },
      {
        heading: "How fatty liver is reversed",
        paragraphs: [
          "Weight loss is the most effective treatment. Losing 5% of body weight reduces liver fat; 7–10% improves inflammation and can regress early fibrosis. How you get there matters less than sustaining it: reducing refined carbohydrates, added sugar and alcohol, increasing protein and fibre, resistance training, and treating sleep apnoea all improve liver fat independently of weight. Coffee is associated with lower fibrosis risk. For people with obesity or type 2 diabetes who cannot reach these targets with lifestyle alone, a doctor may discuss other clinically appropriate options as part of a supervised plan.",
          "Re-testing liver enzymes, FIB-4 and metabolic markers every 3–6 months shows whether the plan is working — and most people see ALT and GGT fall within months of meaningful change.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can fatty liver be detected in a blood test?",
        answer:
          "Blood tests detect the liver stress (ALT, AST, GGT), estimate scarring (FIB-4) and show the metabolic cause (insulin, HbA1c, triglycerides). Ultrasound or FibroScan confirms fat in the liver. Together they diagnose and stage fatty liver without a biopsy in most people.",
      },
      {
        question: "What ALT level indicates fatty liver?",
        answer:
          "Many labs quote an upper limit around 40–55 U/L, but research suggests healthy ALT is below about 30 U/L in men and 19–25 U/L in women. A mildly raised ALT in someone with abdominal weight, high triglycerides or prediabetes is the most common presentation of fatty liver.",
      },
      {
        question: "How long does it take to reverse fatty liver?",
        answer:
          "Liver fat begins falling within weeks of cutting sugar, alcohol and excess calories, and enzymes often normalise within 3–6 months of sustained 5–10% weight loss. Reversing fibrosis takes longer — usually a year or more.",
      },
      {
        question: "Is fatty liver serious?",
        answer:
          "Simple fatty liver is common and reversible. Left untreated, around one in four people progress to inflammation (MASH), and a smaller proportion develop cirrhosis. Fatty liver also significantly increases cardiovascular risk, so it should always prompt a metabolic review.",
      },
    ],
    related: [
      { label: "Sanative Fatty Liver program", href: "/metabolic-care/fatty-liver" },
      { label: "ALT blood test", href: "/biomarkers/alt" },
      { label: "FIB-4 score", href: "/biomarkers/fib4" },
      { label: "Doctor-led weight loss", href: "/weight-management" },
    ],
    cta: {
      label: "Check your liver with a doctor-reviewed panel",
      href: "/metabolic-care/fatty-liver",
      note: "Liver enzymes, FIB-4, insulin resistance and lipids — reviewed by an AHPRA doctor.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "heart-health-cardiovascular-disease-risk",
    path: "/guides/heart-health-cardiovascular-disease-risk",
    title: "Heart Health & Cardiovascular Disease Risk: Tests That Matter | Sanative",
    h1: "Heart health and cardiovascular disease risk: the blood tests that actually predict it",
    description:
      "Cardiovascular disease is Australia's leading cause of death and mostly preventable. Learn the heart health blood tests — LDL, ApoB, Lipoprotein(a), hs-CRP, HbA1c — and how your 5-year CVD risk is calculated.",
    keywords: [
      "heart health",
      "cardiovascular disease",
      "cardiovascular risk",
      "heart health check",
      "cholesterol test",
      "ApoB test",
      "lipoprotein a test Australia",
      "heart disease prevention",
    ],
    eyebrow: "Cardiovascular health",
    intro:
      "Cardiovascular disease — heart attack, stroke and the atherosclerosis behind them — remains the leading cause of death in Australia, and the majority of first heart attacks happen in people who were never told they were at high risk. Atherosclerosis builds over decades and is driven by measurable factors: the number of cholesterol-carrying particles in your blood, blood pressure, blood sugar, inflammation and genetics. All of these can be tested, and most can be changed.",
    sections: [
      {
        heading: "How cardiovascular risk is assessed in Australia",
        paragraphs: [
          "Australian guidelines (2023) recommend a formal cardiovascular risk assessment for adults aged 45–79, and from 30–35 for Aboriginal and Torres Strait Islander people and people with diabetes. The Australian CVD risk calculator combines age, sex, blood pressure, total and HDL cholesterol, smoking, diabetes status, kidney function and postcode to estimate 5-year risk. Medicare subsidises a Heart Health Check with a GP for eligible people.",
          "The calculator is a starting point, not the full picture. It does not include Lipoprotein(a), ApoB, family history detail, inflammation or coronary calcium — which is why a doctor-reviewed biomarker panel adds real information for people who score 'low' or 'intermediate' risk.",
        ],
      },
      {
        heading: "The heart health blood tests that matter",
        paragraphs: [],
        bullets: [
          "LDL cholesterol — the 'bad' cholesterol. Lower is better across the whole range; most guidelines target below 2.0 mmol/L in higher-risk people.",
          "Non-HDL cholesterol — total minus HDL; captures all the atherogenic particles including remnants.",
          "ApoB (apolipoprotein B) — counts the actual number of plaque-forming particles. It is a better predictor than LDL, especially if you have high triglycerides, diabetes or metabolic syndrome.",
          "Lipoprotein(a) — a largely inherited particle that raises heart attack and aortic stenosis risk. About 1 in 5 people have elevated Lp(a); it only needs to be tested once.",
          "Triglycerides and TG:HDL ratio — markers of insulin resistance and remnant cholesterol.",
          "HbA1c and fasting insulin — diabetes and pre-diabetes double to quadruple cardiovascular risk long before glucose is 'abnormal'.",
          "hs-CRP — high-sensitivity C-reactive protein; chronic low-grade inflammation that predicts events independently of cholesterol.",
          "eGFR and urine ACR — kidney function; chronic kidney disease is a major cardiovascular risk multiplier.",
          "Homocysteine, uric acid, ferritin — secondary markers that refine the picture.",
        ],
      },
      {
        heading: "Reducing your cardiovascular risk",
        paragraphs: [
          "The hierarchy is well established: don't smoke, keep blood pressure below 130/80, lower LDL and ApoB, keep HbA1c in the normal range, stay physically active (150+ minutes a week plus resistance training), and sleep well. Diet patterns rich in vegetables, legumes, fish, olive oil and whole grains lower LDL and inflammation. For people whose LDL or Lp(a) stays high despite lifestyle change, or whose calculated risk is elevated, doctors may discuss cholesterol-lowering or blood-pressure medicines — decisions that should be made with your full biomarker picture and preferences in front of you.",
        ],
      },
      {
        heading: "Erectile dysfunction is a heart health warning",
        paragraphs: [
          "The arteries supplying the penis are narrower than the coronary arteries, so they are affected by atherosclerosis first. Erectile dysfunction frequently appears two to five years before a cardiac event. Any man with new ED should have a cardiovascular and metabolic assessment — not just a prescription.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best blood test for heart health?",
        answer:
          "There is no single test. A lipid panel with ApoB and a one-off Lipoprotein(a) gives the particle picture; HbA1c, fasting insulin and hs-CRP add metabolic and inflammatory risk; eGFR and urine ACR cover the kidney contribution. Together with blood pressure they define most of your modifiable risk.",
      },
      {
        question: "What cholesterol level is dangerous?",
        answer:
          "Risk rises continuously with LDL and ApoB rather than at a threshold. Australian guidelines generally aim for LDL below 2.0 mmol/L (and below 1.8 in people with established disease). Lipoprotein(a) above about 100 nmol/L (or 50 mg/dL) is considered elevated.",
      },
      {
        question: "Should I get a Lipoprotein(a) test?",
        answer:
          "Most experts recommend every adult be tested once. Lp(a) is about 90% genetic, does not respond to diet or most cholesterol medicines, and identifies people who need more aggressive control of their other risk factors.",
      },
      {
        question: "Is a Heart Health Check covered by Medicare?",
        answer:
          "Yes — Medicare subsidises a Heart Health Check with a GP for eligible Australians, which includes the standard risk calculator and basic lipids and glucose. Extended markers such as ApoB, Lp(a) and hs-CRP are usually arranged privately.",
      },
    ],
    related: [
      { label: "Sanative Heart Health program", href: "/metabolic-care/heart-health" },
      { label: "ApoB and lipid biomarkers", href: "/biomarkers#heart" },
      { label: "Erectile dysfunction and heart health", href: "/mens-health/erectile-dysfunction" },
      { label: "Organ Care: heart, liver, kidney", href: "/organ-care" },
    ],
    cta: {
      label: "Get your heart risk markers reviewed by a doctor",
      href: "/metabolic-care/heart-health",
      note: "Full lipid panel, ApoB, Lp(a), hs-CRP, HbA1c and kidney markers in one membership.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "weight-loss-medications-australia",
    path: "/guides/weight-loss-medications-australia",
    title: "Weight Loss Medications in Australia: Ozempic, Wegovy, Mounjaro & Saxenda Explained",
    h1: "Weight loss medications in Australia: how Ozempic, Wegovy, Mounjaro and Saxenda work, who they suit, and the risks",
    description:
      "An independent, doctor-reviewed guide to prescription weight loss medications in Australia — semaglutide (Ozempic, Wegovy), tirzepatide (Mounjaro), liraglutide (Saxenda), phentermine — how they work, eligibility, side effects and PBS status.",
    keywords: [
      "weight loss medication Australia",
      "weight loss drugs",
      "Ozempic Australia",
      "Wegovy Australia",
      "Mounjaro Australia",
      "Saxenda",
      "semaglutide weight loss",
      "tirzepatide",
      "GLP-1 Australia",
      "medical weight loss",
    ],
    eyebrow: "Medical weight management",
    status: "draft",
    regulatoryNote: MEDICATION_NOTE,
    intro:
      "A new class of medicines has changed what medical weight management can achieve. GLP-1 receptor agonists such as semaglutide (sold as Ozempic and Wegovy) and the dual GIP/GLP-1 agonist tirzepatide (Mounjaro) produce average weight loss in clinical trials far beyond earlier medicines — but they are prescription-only, not suitable for everyone, carry side effects, and work best inside a structured program with blood test monitoring. This guide explains the options available in Australia so you can have an informed conversation with a doctor.",
    sections: [
      {
        heading: "How GLP-1 medicines work",
        paragraphs: [
          "GLP-1 (glucagon-like peptide-1) is a gut hormone released after eating. GLP-1 receptor agonists mimic it: they slow stomach emptying, increase the feeling of fullness, act on appetite centres in the brain to reduce food noise and cravings, and improve the body's insulin response. Tirzepatide additionally activates the GIP receptor, which appears to amplify these effects. They are given as a once-weekly (semaglutide, tirzepatide) or daily (liraglutide) injection under the skin, starting at a low dose and increasing gradually to limit nausea.",
        ],
      },
      {
        heading: "Weight loss medicines available in Australia",
        paragraphs: [
          "The following medicines are registered by the Therapeutic Goods Administration (TGA). Registration and indication determine how a doctor may prescribe them; 'off-label' use means prescribing outside the registered indication, which doctors may do with appropriate clinical judgement and informed consent.",
        ],
        bullets: [
          "Semaglutide — Ozempic: registered for type 2 diabetes. Widely used off-label for weight loss, which contributed to the supply shortages of 2022–2024. PBS-subsidised only for type 2 diabetes.",
          "Semaglutide — Wegovy: the higher-dose formulation registered for chronic weight management in adults with obesity, or overweight with a weight-related condition. Not PBS-subsidised; private script.",
          "Tirzepatide — Mounjaro: registered for type 2 diabetes and for chronic weight management. Trials reported the largest average weight loss of any current medicine. Not PBS-subsidised for weight.",
          "Liraglutide — Saxenda: a daily GLP-1 injection registered for weight management. Generally less weight loss than weekly agents.",
          "Phentermine — Duromine, Metermine: a stimulant appetite suppressant registered for short-term use. Not suitable with high blood pressure, heart disease or anxiety disorders.",
          "Orlistat — Xenical: blocks fat absorption; available through a pharmacist. Modest effect with gastrointestinal side effects.",
          "Naltrexone/bupropion — Contrave: an oral combination acting on appetite and reward pathways.",
        ],
      },
      {
        heading: "How much weight do people lose?",
        paragraphs: [
          "In the registration trials, average weight loss over roughly 68–72 weeks was around 15% of body weight with semaglutide 2.4 mg (STEP trials) and around 20% with tirzepatide at the highest dose (SURMOUNT trials), compared with 2–3% on placebo alongside the same lifestyle program. Individual results vary widely — some people lose far more, around one in ten lose little. Weight regain after stopping is common, which is why these medicines are considered long-term treatments for a chronic condition, and why the lifestyle, protein intake and resistance training components of a program matter so much for preserving muscle.",
        ],
      },
      {
        heading: "Who is eligible — and who should not take them",
        paragraphs: [
          "Weight-management indications generally require a BMI of 30 or above, or 27 and above with a weight-related condition such as prediabetes, high blood pressure, sleep apnoea or fatty liver. A doctor will also check kidney and liver function, pancreatic history, thyroid history and medications before prescribing.",
        ],
        bullets: [
          "Do not use in pregnancy, when planning pregnancy or while breastfeeding.",
          "Contraindicated with a personal or family history of medullary thyroid cancer or MEN2 syndrome.",
          "Caution with a history of pancreatitis, gallbladder disease, severe gastrointestinal disease or diabetic retinopathy.",
          "Not appropriate for people with a history of eating disorders without specialist input.",
          "Not a substitute for addressing sleep, stress, alcohol and movement — which drive weight independently.",
        ],
      },
      {
        heading: "Side effects and monitoring",
        paragraphs: [
          "Most people experience some nausea, reflux, constipation or diarrhoea, especially in the first weeks and after dose increases; these usually settle. Less common but serious effects include pancreatitis, gallstones, kidney injury from dehydration, and — a concern with rapid weight loss of any kind — loss of muscle and bone. Blood tests before starting and during treatment (liver and kidney function, HbA1c, lipids, lipase if symptomatic, ferritin and B12, vitamin D) are how a doctor confirms the medicine is helping metabolic health rather than just the number on the scale.",
        ],
      },
      {
        heading: "How Sanative approaches medical weight loss",
        paragraphs: [
          "Sanative's weight management program begins with an 85+ biomarker panel and a doctor consultation, so decisions about any treatment — lifestyle, dietitian support, or medication where clinically appropriate — are based on your actual metabolic picture: insulin resistance, liver fat, lipids, thyroid and inflammation. Whether a medicine is prescribed is entirely the treating doctor's clinical decision after assessing you individually. Repeat testing tracks what is changing beneath the surface.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Ozempic approved for weight loss in Australia?",
        answer:
          "Ozempic is TGA-registered for type 2 diabetes. Wegovy — the same active ingredient, semaglutide, at a higher dose — is the formulation registered for chronic weight management. Doctors may prescribe off-label with appropriate judgement, but this is their clinical decision.",
      },
      {
        question: "Are weight loss injections covered by the PBS?",
        answer:
          "No GLP-1 medicine is PBS-subsidised for weight management. Ozempic is subsidised only for type 2 diabetes. Wegovy, Mounjaro and Saxenda for weight are private prescriptions.",
      },
      {
        question: "Can I get weight loss medication online in Australia?",
        answer:
          "Prescription medicines require a consultation with a registered doctor, which can be done by telehealth. Any service that supplies without a genuine medical assessment, or that advertises specific prescription medicines to the public, is operating outside Australian law.",
      },
      {
        question: "What is the difference between Mounjaro and Ozempic?",
        answer:
          "Ozempic contains semaglutide, a GLP-1 receptor agonist. Mounjaro contains tirzepatide, which activates both GLP-1 and GIP receptors. In head-to-head and registration trials tirzepatide produced greater average weight loss and HbA1c reduction. Side-effect profiles are similar.",
      },
      {
        question: "Do you regain weight after stopping Ozempic or Mounjaro?",
        answer:
          "Trials that withdrew the medicine showed most participants regained a large proportion of lost weight within a year. Ongoing treatment, or a structured plan for coming off with dietitian support and resistance training, is needed to maintain results.",
      },
    ],
    related: [
      { label: "Sanative doctor-led weight management", href: "/weight-management" },
      { label: "Dietitian support", href: "/weight-management/dietitian-support" },
      { label: "Fatty liver and weight", href: "/guides/fatty-liver-blood-test" },
      { label: "HbA1c blood test", href: "/biomarkers/hba1c" },
    ],
    cta: {
      label: "Talk to a doctor about your weight — starting with your biomarkers",
      href: "/weight-management",
      note: "Doctor consultation and 85+ biomarker panel included in membership. Treatment decisions are made by your doctor.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "erectile-dysfunction-treatment-australia",
    path: "/guides/erectile-dysfunction-treatment-australia",
    title: "Erectile Dysfunction Treatment in Australia: Causes, Tests & ED Medications (Viagra, Cialis)",
    h1: "Erectile dysfunction in Australia: causes, the tests you should have, and how ED medications work",
    description:
      "A doctor-reviewed guide to erectile dysfunction: why ED is an early sign of cardiovascular and metabolic disease, the blood tests to ask for, and how PDE5 inhibitors — sildenafil (Viagra), tadalafil (Cialis), vardenafil, avanafil — work, including risks.",
    keywords: [
      "erectile dysfunction",
      "erectile dysfunction treatment Australia",
      "ED treatment",
      "ED medication",
      "Viagra Australia",
      "Cialis Australia",
      "sildenafil",
      "tadalafil",
      "erectile dysfunction causes",
      "ED blood test",
    ],
    eyebrow: "Men's health",
    status: "draft",
    regulatoryNote: MEDICATION_NOTE,
    intro:
      "Erectile dysfunction (ED) affects around 40% of Australian men over 40 and becomes more common with age — but it is not an inevitable part of ageing, and it is rarely 'just psychological'. In most men over 40, ED is the first visible sign of a vascular or metabolic problem: narrowed arteries, insulin resistance, low testosterone or medication side effects. Treating only the symptom with a tablet misses the warning. This guide covers causes, the tests a thorough doctor orders, and how the medications work.",
    sections: [
      {
        heading: "What causes erectile dysfunction?",
        paragraphs: [
          "An erection requires healthy blood vessels, nerves, hormones and a mind that is not in fight-or-flight. Anything that damages the lining of small arteries — high blood pressure, high LDL/ApoB, high blood sugar, smoking, inactivity — reduces blood flow to the penis years before it affects the heart. Other common causes:",
        ],
        bullets: [
          "Cardiovascular disease and atherosclerosis — the most common organic cause over 40",
          "Type 2 diabetes and insulin resistance — damages both vessels and nerves",
          "Low testosterone (hypogonadism) — reduces libido and erectile quality",
          "Obesity, sleep apnoea and fatty liver — all lower testosterone and impair vascular function",
          "Medications — some blood pressure tablets, antidepressants (SSRIs), finasteride, opioids",
          "Alcohol, smoking, recreational drugs",
          "Depression, anxiety and performance anxiety — often alongside a physical cause",
          "Pelvic surgery, prostate treatment, spinal or nerve injury",
        ],
      },
      {
        heading: "Blood tests for erectile dysfunction",
        paragraphs: [
          "Because ED is a marker of cardiovascular and metabolic disease, guidelines recommend every man presenting with ED has a metabolic work-up — not just a prescription.",
        ],
        bullets: [
          "Fasting glucose and HbA1c — undiagnosed diabetes is common in men with ED",
          "Lipid panel including ApoB and Lipoprotein(a) — cardiovascular risk",
          "Morning total testosterone (ideally two samples before 10 am), SHBG and calculated free testosterone",
          "Prolactin and LH/FSH if testosterone is low — to find the cause",
          "TSH — thyroid dysfunction affects libido and energy",
          "Full blood count, liver and kidney function",
          "hs-CRP, fasting insulin — inflammation and insulin resistance",
          "PSA where age-appropriate and before any testosterone treatment",
        ],
      },
      {
        heading: "How ED medications (PDE5 inhibitors) work",
        paragraphs: [
          "Phosphodiesterase-5 (PDE5) inhibitors increase blood flow into the penis in response to sexual stimulation by preventing the breakdown of a signalling molecule (cGMP) that relaxes smooth muscle. They do not cause an erection on their own and do not increase desire. All are prescription-only in Australia.",
        ],
        bullets: [
          "Sildenafil (Viagra and generics) — onset 30–60 minutes, lasts about 4–6 hours; absorption slowed by fatty meals.",
          "Tadalafil (Cialis and generics) — onset 30–60 minutes, lasts up to 36 hours; also available as a low daily dose. Less affected by food.",
          "Vardenafil — similar profile to sildenafil.",
          "Avanafil (Spedra) — faster onset (around 15–30 minutes).",
        ],
      },
      {
        heading: "Risks and who must not take ED medication",
        paragraphs: [
          "Common side effects include headache, flushing, nasal congestion, indigestion and visual disturbance (blue tinge with sildenafil); back and muscle pain with tadalafil. PDE5 inhibitors are absolutely contraindicated with nitrate medicines (such as glyceryl trinitrate spray or isosorbide for angina) and with some recreational 'poppers' — the combination can cause a dangerous fall in blood pressure. They need caution with certain heart conditions, very low blood pressure, severe liver or kidney disease, retinal disease and some alpha-blocker prostate medicines. A doctor must assess your cardiovascular fitness for sexual activity before prescribing. Buying ED tablets online without a prescription risks counterfeit products — a well-documented problem in Australia.",
        ],
      },
      {
        heading: "Treating the cause, not just the symptom",
        paragraphs: [
          "Improving the underlying drivers improves erectile function and protects your heart: weight loss (particularly visceral fat), regular aerobic exercise, stopping smoking, limiting alcohol, treating sleep apnoea, managing blood pressure and lipids, and correcting genuinely low testosterone where indicated. Many men find that as metabolic markers improve, their need for medication falls. Sanative's men's health program starts with the full biomarker panel and a doctor consultation, so any treatment — including medication where appropriate — is prescribed in the context of your whole health, and tracked.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I buy Viagra over the counter in Australia?",
        answer:
          "No. Sildenafil and all other PDE5 inhibitors are prescription-only medicines in Australia. A doctor must assess you first, which can be done by telehealth. Unregulated online sellers frequently supply counterfeit tablets.",
      },
      {
        question: "Is erectile dysfunction a sign of heart disease?",
        answer:
          "Often, yes. The penile arteries are smaller than the coronary arteries, so atherosclerosis affects them first. ED commonly precedes a heart attack or stroke by two to five years, which is why a cardiovascular and metabolic check is recommended for any man with new ED.",
      },
      {
        question: "What blood tests should I have for erectile dysfunction?",
        answer:
          "At minimum: HbA1c or fasting glucose, a lipid panel, and a morning testosterone. A thorough assessment adds ApoB, Lipoprotein(a), SHBG, prolactin, TSH, hs-CRP, fasting insulin, liver and kidney function.",
      },
      {
        question: "Does low testosterone cause erectile dysfunction?",
        answer:
          "Low testosterone reduces libido and can contribute to ED, but most ED in men over 40 is vascular. Testosterone should be measured properly (morning, repeated) and treated only when genuinely low with symptoms, after excluding reversible causes like obesity and sleep apnoea.",
      },
      {
        question: "What is the difference between Viagra and Cialis?",
        answer:
          "Viagra (sildenafil) works for about 4–6 hours and is best taken on an empty stomach. Cialis (tadalafil) lasts up to 36 hours, is less affected by food and can be taken as a low daily dose. Both require sexual stimulation to work and have similar contraindications.",
      },
    ],
    related: [
      { label: "Sanative Erectile Dysfunction care", href: "/mens-health/erectile-dysfunction" },
      { label: "Men's sexual health", href: "/mens-health/sexual-health" },
      { label: "Testosterone blood test", href: "/biomarkers/testosterone-total" },
      { label: "Heart health and cardiovascular risk", href: "/guides/heart-health-cardiovascular-disease-risk" },
    ],
    cta: {
      label: "Start a confidential, doctor-led ED assessment",
      href: "/mens-health/erectile-dysfunction",
      note: "Full metabolic and hormone panel plus doctor consultation. Any treatment is your doctor's clinical decision.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "biomarkers-explained",
    path: "/guides/biomarkers-explained",
    title: "Biomarkers Explained: What Blood Biomarkers Reveal About Your Health | Sanative",
    h1: "Biomarkers explained: what they are, which ones matter, and how to read your results",
    description:
      "What is a biomarker? A plain-English guide to blood biomarkers — metabolic, cardiovascular, liver, kidney, hormone, thyroid, inflammation and nutrient markers — reference vs optimal ranges, and why trends matter.",
    keywords: [
      "biomarkers",
      "what are biomarkers",
      "blood biomarkers",
      "biomarker testing Australia",
      "biomarker test",
      "optimal range vs reference range",
      "longevity biomarkers",
    ],
    eyebrow: "Biomarker science",
    intro:
      "A biomarker is any measurable indicator of what is happening inside your body — a blood glucose level, a cholesterol particle count, a liver enzyme, a hormone. Tracked properly, biomarkers show disease developing years before symptoms, tell you whether a change in diet, training or medication is actually working, and give your doctor an objective basis for decisions. This guide explains the main categories, how to interpret ranges, and why a single result is less important than its trajectory.",
    sections: [
      {
        heading: "What is a biomarker?",
        paragraphs: [
          "Biomarkers are objective, measurable signals of a biological state. In practice most are blood tests, but blood pressure, waist circumference, VO2 max and bone density are biomarkers too. A good biomarker is reliably measurable, changes meaningfully with health or disease, and gives you something you can act on. HbA1c, for example, reflects average blood sugar over three months and predicts diabetes complications — and it falls when diet, weight and activity improve.",
        ],
      },
      {
        heading: "The main categories of blood biomarkers",
        paragraphs: [],
        bullets: [
          "Metabolic — fasting glucose, HbA1c, fasting insulin, HOMA-IR, triglycerides: insulin resistance and diabetes risk.",
          "Cardiovascular — LDL, HDL, non-HDL, ApoB, Lipoprotein(a), remnant cholesterol, hs-CRP: atherosclerosis risk.",
          "Liver — ALT, AST, GGT, ALP, bilirubin, albumin, FIB-4: fatty liver and liver function.",
          "Kidney — creatinine, eGFR, urea, urine albumin-creatinine ratio, electrolytes: filtration and early kidney damage.",
          "Thyroid — TSH, free T4, free T3, thyroid antibodies: metabolism, energy, weight and mood.",
          "Hormones — testosterone, SHBG, free androgen index, oestradiol, progesterone, FSH, LH, DHEA-S, cortisol, prolactin.",
          "Blood health — full blood count, haemoglobin, ferritin, iron studies, transferrin saturation, B12, folate.",
          "Vitamins and minerals — vitamin D, B12, folate, magnesium, zinc, calcium.",
          "Inflammation and immunity — hs-CRP, ESR, neutrophil-lymphocyte ratio, fibrinogen, homocysteine, uric acid.",
          "Derived indices — ratios and scores (TG:HDL, FIB-4, HOMA-IR, phenotypic age) that combine markers into a more predictive signal.",
        ],
      },
      {
        heading: "Reference range vs optimal range",
        paragraphs: [
          "The 'normal' range printed on a pathology report is a statistical reference interval — typically the middle 95% of results from the lab's population. Because that population includes many people with undiagnosed metabolic disease, 'normal' is not the same as healthy. Fasting insulin, triglycerides, ALT, ferritin and vitamin D are classic examples where the reference range is wide but the research-supported optimal range is narrower. Reference ranges also differ between laboratories and by age and sex, so comparing results from different labs needs care. A doctor interpreting your markers together, against evidence-based optimal targets, is what turns data into a plan.",
        ],
      },
      {
        heading: "Why trends beat single results",
        paragraphs: [
          "Most biomarkers vary day to day with sleep, food, hydration, exercise, illness and time of day. A single reading can mislead; two or three readings over months show direction. Rising HbA1c within the normal range, falling eGFR, or creeping ALT are far more informative than any one number. Sanative tracks every marker over time and flags the direction of change — so you and your doctor are managing trajectory, not snapshots.",
        ],
      },
    ],
    faqs: [
      {
        question: "How many biomarkers should a health check include?",
        answer:
          "A comprehensive baseline covers metabolic, cardiovascular, liver, kidney, thyroid, blood, nutrient and inflammation markers — typically 60–90 individual results including derived indices. Sanative's standard panel reviews 85+.",
      },
      {
        question: "What are the most important biomarkers for longevity?",
        answer:
          "The markers most strongly linked to healthy lifespan are ApoB (or LDL), blood pressure, HbA1c and fasting insulin, hs-CRP, eGFR, ALT/GGT, and measures of fitness and muscle. Lipoprotein(a) identifies inherited risk once.",
      },
      {
        question: "Can I get biomarker testing without a GP referral in Australia?",
        answer:
          "Yes, through services that have their own doctors order the tests — such as a Sanative membership — or by paying privately. Self-requested tests are not Medicare-rebated. Having a doctor interpret the results is the part that makes the data useful.",
      },
      {
        question: "How often should I re-test my biomarkers?",
        answer:
          "Annually for a stable baseline; every 3–6 months for markers you are actively trying to change (HbA1c, lipids, liver enzymes, ferritin, vitamin D). Some, like Lipoprotein(a), need only be measured once.",
      },
    ],
    related: [
      { label: "Browse all 85+ biomarkers", href: "/biomarkers" },
      { label: "Biomarker Labs", href: "/labs" },
      { label: "Health check in Australia", href: "/guides/health-check-australia" },
    ],
    cta: {
      label: "See every biomarker Sanative tests and what it means",
      href: "/biomarkers",
      note: "Each marker explained in plain English with optimal ranges and what to do about it.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "menopause",
    path: "/womens-health/menopause",
    title: "Menopause & Perimenopause: Symptoms, Blood Tests & Treatment in Australia | Sanative",
    h1: "Menopause and perimenopause: symptoms, the blood tests that help, and treatment options",
    description:
      "Doctor-led menopause and perimenopause care in Australia. Understand symptoms, which blood tests are useful (and which aren't), the cardiometabolic changes of menopause, and MHT and non-hormonal treatment options.",
    keywords: [
      "menopause",
      "perimenopause",
      "menopause symptoms",
      "menopause blood test",
      "perimenopause test",
      "menopause treatment Australia",
      "MHT HRT Australia",
      "menopause doctor telehealth",
    ],
    eyebrow: "Women's health",
    intro:
      "Menopause — twelve months after the final period, at an average age of 51 in Australia — is preceded by perimenopause, a transition of four to eight years during which fluctuating oestrogen and progesterone produce the symptoms most women recognise: hot flushes, night sweats, broken sleep, mood change, brain fog, joint pain, weight shifting to the abdomen and irregular cycles. It is also a period of significant metabolic change: cholesterol, blood pressure, insulin resistance and liver fat all tend to rise, and bone density falls. Good menopause care addresses both the symptoms and the long-term health shift.",
    sections: [
      {
        heading: "Symptoms of perimenopause and menopause",
        paragraphs: [],
        bullets: [
          "Vasomotor: hot flushes, night sweats, palpitations",
          "Sleep: difficulty falling or staying asleep, 3 am waking",
          "Mood and cognition: anxiety, low mood, irritability, brain fog, poor concentration",
          "Cycle: shorter, longer, heavier or skipped periods",
          "Body: joint and muscle aches, weight gain around the middle, dry skin, hair thinning, headaches",
          "Genitourinary: vaginal dryness, pain with sex, urinary urgency or infections, low libido",
        ],
      },
      {
        heading: "Which blood tests are useful for menopause — and which aren't",
        paragraphs: [
          "For women over 45 with typical symptoms, menopause is a clinical diagnosis: Australian and international guidelines say hormone tests are not needed to confirm it, because FSH and oestradiol swing so widely during perimenopause that one result proves little. Hormone testing is useful in women under 45 (to investigate early menopause or premature ovarian insufficiency), when periods have stopped for other reasons such as contraception or hysterectomy, or when the picture is unclear.",
          "What is highly useful at this stage is a metabolic and general health panel — because menopause changes cardiovascular and bone risk, and because thyroid disease and iron deficiency mimic menopausal symptoms.",
        ],
        bullets: [
          "TSH and free T4 — thyroid dysfunction causes fatigue, weight gain, mood and cycle changes",
          "Ferritin and iron studies, full blood count — heavy perimenopausal bleeding commonly causes iron deficiency",
          "Lipid panel, ApoB, Lipoprotein(a) — LDL typically rises 10–15% through menopause",
          "HbA1c and fasting insulin — insulin resistance increases with falling oestrogen",
          "Liver enzymes — fatty liver risk rises after menopause",
          "Vitamin D, calcium, kidney function — bone health and MHT safety",
          "FSH, oestradiol, AMH — only where clinically indicated (under 45, unclear diagnosis)",
          "Testosterone and SHBG — if low libido is a prominent symptom and testosterone therapy is being considered",
        ],
      },
      {
        heading: "Treatment options",
        paragraphs: [
          "Menopausal hormone therapy (MHT, previously HRT) is the most effective treatment for hot flushes, night sweats and sleep disturbance, and it protects bone. Modern body-identical oestrogen through the skin (patch or gel) with micronised progesterone has a better safety profile than older oral regimens; for most healthy women under 60 or within ten years of menopause, benefits outweigh risks. Local vaginal oestrogen treats genitourinary symptoms with minimal absorption. Non-hormonal prescription options exist for women who cannot or prefer not to use MHT, including certain antidepressants and newer neurokinin-receptor antagonists. Lifestyle — resistance training, protein intake, alcohol reduction, sleep and stress management — meaningfully improves symptoms and counters the metabolic shift. Whether MHT or any medicine is appropriate is an individual decision made with your doctor after reviewing your history and risk factors.",
        ],
      },
      {
        heading: "How Sanative supports women through menopause",
        paragraphs: [
          "Sanative's women's health program begins with a confidential assessment and an 85+ biomarker panel covering thyroid, iron, lipids, glucose and insulin, liver, kidney and — where indicated — hormones. An AHPRA-registered doctor reviews your symptoms and results together via telehealth, discusses treatment options including MHT where appropriate, and your markers are tracked over time so the metabolic and bone changes of menopause are managed, not just the flushes.",
        ],
      },
    ],
    faqs: [
      {
        question: "What blood test confirms menopause?",
        answer:
          "In women over 45 with typical symptoms, none is required — menopause is diagnosed clinically. FSH and oestradiol fluctuate too much in perimenopause to be reliable. Hormone testing is reserved for women under 45 or when the diagnosis is unclear.",
      },
      {
        question: "What age does perimenopause start?",
        answer:
          "Most commonly in the mid-to-late 40s, but it can begin in the late 30s. It typically lasts four to eight years before the final period. Menopause before 45 is 'early'; before 40 is premature ovarian insufficiency and warrants investigation.",
      },
      {
        question: "Is HRT (MHT) safe?",
        answer:
          "For most healthy women who start within ten years of menopause or before 60, current evidence shows benefits outweigh risks, particularly with transdermal oestrogen and micronised progesterone. Individual history — breast cancer, clots, liver disease, migraine with aura — changes the assessment, which is why a doctor review is essential.",
      },
      {
        question: "Can menopause cause high cholesterol and weight gain?",
        answer:
          "Yes. Falling oestrogen shifts fat storage to the abdomen, reduces insulin sensitivity and raises LDL cholesterol and blood pressure. This is why a metabolic panel is more useful than a hormone panel at this stage.",
      },
    ],
    related: [
      { label: "Women's health program", href: "/womens-health" },
      { label: "Start a women's health assessment", href: "/womens-health/assessment" },
      { label: "PCOS care", href: "/metabolic-care/pcos" },
      { label: "TSH thyroid test", href: "/biomarkers/tsh" },
    ],
    cta: {
      label: "Start your menopause assessment with a doctor",
      href: "/womens-health/assessment",
      note: "Confidential telehealth consultation and full biomarker panel included in membership.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "blood-tests-pathology-australia",
    path: "/guides/blood-tests-pathology-australia",
    title: "Blood Tests in Australia: Pathology Labs, Fasting, Costs & What to Ask For | Sanative",
    h1: "Blood tests in Australia: how pathology works, what it costs, and how to get the tests you actually need",
    description:
      "How to get a blood test in Australia — GP referral vs private pathology, Medicare rebates, fasting rules, collection centres, turnaround times, and the comprehensive blood test panel worth asking for.",
    keywords: [
      "blood test",
      "blood tests Australia",
      "pathology lab",
      "pathology test",
      "comprehensive blood test",
      "full blood test",
      "blood test without referral",
      "how much does a blood test cost Australia",
      "fasting blood test",
    ],
    eyebrow: "Pathology",
    intro:
      "Blood tests are the foundation of preventive medicine, yet most Australians only have them when something is wrong, and then only the handful their GP can justify to Medicare. This guide explains how pathology works in Australia — who can order tests, what Medicare covers, where samples are collected, how to prepare — and what a genuinely comprehensive blood test panel looks like.",
    sections: [
      {
        heading: "How pathology works in Australia",
        paragraphs: [
          "A doctor (GP, specialist, or a telehealth doctor) writes a pathology request. You take it to a collection centre — Australia's large pathology providers such as Sonic Healthcare (Douglass Hanly Moir, Melbourne Pathology, Sullivan Nicolaides and others), Healius (QML, Laverty, Dorevitch) and Australian Clinical Labs run thousands of collection rooms in GP clinics, shopping centres and hospitals. The sample goes to an accredited laboratory, and results return to the requesting doctor, typically within one to three business days for routine tests. Doctors, not the lab, interpret and communicate the results.",
        ],
      },
      {
        heading: "Medicare rebates vs private blood tests",
        paragraphs: [
          "When a GP orders a test that is clinically indicated and listed on the Medicare Benefits Schedule, it is usually bulk-billed. The limitation is scope: Medicare has rules about which tests can be ordered, how often, and for what reason — a GP cannot order a broad preventive panel 'just to check' without the indications. Markers such as ApoB, Lipoprotein(a), fasting insulin, hs-CRP, extended hormone panels or repeated vitamin D testing frequently fall outside those rules.",
          "Private pathology — ordered by a doctor but paid by you — removes those limits. Costs vary with the number of tests; a comprehensive 80+ marker panel purchased test-by-test typically runs into several hundred dollars, which is why membership models that bundle the panel with doctor review are often better value than piecemeal testing.",
        ],
      },
      {
        heading: "Can you get a blood test without a GP referral?",
        paragraphs: [
          "Every pathology test in Australia must be requested by a registered medical practitioner, but that practitioner does not have to be your regular GP. Services like Sanative have their own AHPRA-registered doctors who order a comprehensive panel for members, review the results, and then work with you — and with your GP if you wish — on a plan. This is different from direct-to-consumer kits that return numbers without a doctor.",
        ],
      },
      {
        heading: "How to prepare for a blood test",
        paragraphs: [],
        bullets: [
          "Fasting: 8–12 hours with water only for fasting glucose and insulin; your doctor will tell you if required. Lipids may be done non-fasting.",
          "Timing: hormone tests (testosterone, cortisol) are best collected before 10 am; iron and B12 can be affected by recent supplements — ask whether to pause.",
          "Hydration: drink water; it makes collection easier and does not affect most results.",
          "Exercise: avoid heavy training in the 24–48 hours before — it transiently raises CK, ALT, AST and creatinine.",
          "Alcohol: avoid for 48–72 hours; it raises GGT and triglycerides.",
          "Illness: a cold or infection raises CRP, white cells and ferritin — reschedule if unwell.",
          "Biotin supplements can interfere with thyroid and hormone assays; stop 48 hours prior.",
        ],
      },
      {
        heading: "What a comprehensive blood test panel should include",
        paragraphs: [
          "A true baseline covers metabolism (glucose, HbA1c, insulin), lipids (including ApoB and a one-off Lp(a)), liver, kidney, thyroid, full blood count, iron studies, key vitamins (D, B12, folate), electrolytes and minerals, inflammation (hs-CRP), and sex hormones where relevant. Derived indices — HOMA-IR, FIB-4, TG:HDL ratio, eGFR — add predictive value at no extra cost. Sanative's standard membership panel reviews 85+ markers in exactly this structure, explained individually in plain English.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much does a blood test cost in Australia?",
        answer:
          "Tests ordered by a GP for a clinical reason and listed on Medicare are usually bulk-billed. Private tests range from about $20–$40 for a single common marker to several hundred dollars for a comprehensive panel. Sanative membership from $365/year includes an 85+ biomarker panel and doctor review.",
      },
      {
        question: "Can I order my own blood tests in Australia?",
        answer:
          "Not directly — a registered doctor must request pathology. You can, however, use a service whose doctors order a comprehensive panel for you, such as a Sanative membership, without going through your GP.",
      },
      {
        question: "How long do blood test results take?",
        answer:
          "Routine chemistry and haematology usually return within 1–3 business days. Some hormone, antibody and specialised tests take up to a week or two. Your doctor receives the results and reviews them with you.",
      },
      {
        question: "Do I need to fast for a full blood test?",
        answer:
          "Fasting (8–12 hours, water only) is needed for fasting glucose and fasting insulin and is often requested for lipids so results are comparable over time. Most other tests do not require fasting. A morning appointment makes fasting easiest.",
      },
    ],
    related: [
      { label: "Sanative Biomarker Labs", href: "/labs" },
      { label: "Browse all biomarkers", href: "/biomarkers" },
      { label: "Health check in Australia", href: "/guides/health-check-australia" },
    ],
    cta: {
      label: "Get an 85+ biomarker panel ordered and reviewed by a doctor",
      href: "/labs",
      note: "Collected at a partner pathology centre near you. Available Australia-wide.",
    },
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
  },
];

/** Guides that are live (routed, linked, in sitemap). */
export const publishedGuides = seoGuides.filter((g) => g.status !== "draft");

/** Drafts awaiting legal/medical sign-off — never routed. */
export const draftGuides = seoGuides.filter((g) => g.status === "draft");

export const guideBySlug = new Map(publishedGuides.map((g) => [g.slug, g]));
export const guideByPath = new Map(publishedGuides.map((g) => [g.path, g]));

/** Guides served from /guides/[slug] (others map onto existing program URLs). */
export const guidesUnderGuidesRoute = publishedGuides.filter((g) => g.path.startsWith("/guides/"));
