/**
 * Long-form SEO guides (server-rendered). Each guide targets a search intent that
 * competitors rank for (health check, fatty liver, heart health / CVD, biomarkers,
 * menopause, blood tests / pathology).
 *
 * Do not publish guides that name prescription medicines. Advertising prescription-only
 * medicines to the public is prohibited in Australia (Therapeutic Goods Act 1989 /
 * TGA Advertising Code).
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
   * "draft" guides stay in the repo but are not routed, linked, or listed in the sitemap.
   * Published guides omit status, or set status to "published".
   */
  status?: "published" | "draft";
  datePublished: string;
  dateModified: string;
};

export const seoGuides: SeoGuide[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "health-check-australia",
    path: "/guides/health-check-australia",
    status: "draft",
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
      "Most chronic disease — type 2 diabetes, fatty liver, cardiovascular disease, kidney disease — develops silently for years before symptoms appear. A structured health check is how you find those changes, and those results are discussed with a medical practitioner. This guide explains what a complete health check should include, how often to do one, and what the Medicare, GP and private options look like in Australia.",
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
          "Risk factors begin accumulating in your 20s and 30s.",
      },
    ],
    related: [
      { label: "Biomarkers explained", href: "/labs" },
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
    title: "Fatty Liver (MASLD): Symptoms, Blood Tests & How It Is Managed | Sanative",
    h1: "Fatty liver disease: symptoms, blood tests and how it is managed",
    description:
      "Fatty liver (MASLD/NAFLD) affects around 1 in 3 Australian adults and is often silent. Learn the liver function tests, FIB-4 score and metabolic markers that detect it — and how it is managed.",
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
        heading: "How fatty liver is managed",
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
    h1: "Heart health and cardiovascular disease risk: the blood tests that can detect early signs of heart disease",
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
    slug: "biomarkers-explained",
    path: "/guides/biomarkers-explained",
    status: "draft",
    title: "Biomarkers Explained: What Blood Biomarkers Reveal About Your Health | Sanative",
    h1: "Biomarkers explained: what they are, which ones matter, and how to read your results",
    description:
      "What is a biomarker? A plain-English guide to blood biomarkers — metabolic, cardiovascular, liver, kidney, hormone, thyroid, inflammation and nutrient markers — reference vs optimal ranges, and why trends matter.",
    keywords: [
      "biomarkers",
      "what are biomarkers",
      "blood biomarkers",
      "biomarker testing Australia",
      "biomarkers insights",
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
      { label: "Health check in Australia", href: "/labs" },
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
          "Menopausal hormone therapy (MHT, previously HRT) is a treatment a doctor may discuss for hot flushes, night sweats and sleep disturbance. Body-identical oestrogen through the skin (patch or gel) with micronised progesterone is one form a doctor may consider. Local vaginal oestrogen treats genitourinary symptoms with minimal absorption. Non-hormonal prescription options exist for women who cannot or prefer not to use MHT, including certain antidepressants and newer neurokinin-receptor antagonists. Lifestyle — resistance training, protein intake, alcohol reduction, sleep and stress management — meaningfully improves symptoms and counters the metabolic shift. Whether MHT or any medicine is appropriate is an individual decision made with your doctor after reviewing your history and risk factors.",
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
          "Whether HRT (MHT) is appropriate is a decision for your doctor. Individual history — breast cancer, clots, liver disease, migraine with aura — changes the assessment, which is why a doctor review is essential.",
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
];

/** Guides that are live (routed, linked, in sitemap). */
export const publishedGuides = seoGuides.filter((g) => g.status !== "draft");

/** Guides with status "draft" — never routed, linked, or listed in the sitemap. */
export const draftGuides = seoGuides.filter((g) => g.status === "draft");

export const guideBySlug = new Map(publishedGuides.map((g) => [g.slug, g]));
export const guideByPath = new Map(publishedGuides.map((g) => [g.path, g]));

/**
 * Retired /guides articles. Each slug has a static redirect page, so it is
 * omitted from the article route and the sitemap.
 */
export const redirectedGuideSlugs = new Set([
  "fatty-liver-blood-test",
  "heart-health-cardiovascular-disease-risk",
  "blood-tests-pathology-australia",
]);

/** Guides served from /guides/[slug] (others map onto existing program URLs). */
export const guidesUnderGuidesRoute = publishedGuides.filter(
  (g) => g.path.startsWith("/guides/") && !redirectedGuideSlugs.has(g.slug),
);
