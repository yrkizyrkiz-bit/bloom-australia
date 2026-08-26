/** Australian pathology panel grouping (QML / Sonic / Healius nomenclature). */
export type AustralianPathologyPanelGroup =
  | "Full Blood Examination"
  | "Iron Studies"
  | "Vitamins"
  | "Serum Chemistry"
  | "Thyroid Function"
  | "Hormones"
  | "Inflammation"
  | "Trace Elements"
  | "Other";

export type BloodTestCatalogEntry = {
  name: string;
  description: string;
  reason: string;
  fasting?: boolean;
  /** MBS item number(s) for Medicare pathology requests. */
  mbsItems?: string[];
  /** Panel heading on Australian pathology reports. */
  panelGroup: AustralianPathologyPanelGroup;
  /** Request line label (analytes / panel name on lab forms). */
  requestLabel: string;
  /** PDF label excluding calculated/derived analytes (eGFR, LDL, HOMA-IR, etc.). */
  pdfRequestLabel?: string;
};

const PANEL_GROUP_ORDER: AustralianPathologyPanelGroup[] = [
  "Full Blood Examination",
  "Iron Studies",
  "Vitamins",
  "Serum Chemistry",
  "Thyroid Function",
  "Hormones",
  "Inflammation",
  "Trace Elements",
  "Other",
];

export const BLOOD_TEST_CATALOG: Record<string, BloodTestCatalogEntry> = {
  hba1c: {
    name: "HbA1c",
    description: "Glycated haemoglobin",
    reason: "Assess diabetes risk/control",
    mbsItems: ["66551"],
    panelGroup: "Serum Chemistry",
    requestLabel: "HbA1c (glycated haemoglobin)",
  },
  fasting_glucose: {
    name: "Fasting Glucose",
    description: "Fasting blood glucose",
    reason: "Assess insulin resistance",
    fasting: true,
    mbsItems: ["66507"],
    panelGroup: "Serum Chemistry",
    requestLabel: "Glucose (fasting)",
  },
  fasting_insulin: {
    name: "Fasting Insulin",
    description: "Fasting insulin level",
    reason: "Calculate HOMA-IR",
    fasting: true,
    panelGroup: "Serum Chemistry",
    requestLabel: "Insulin (fasting), usually private",
  },
  lipid_panel: {
    name: "Lipid Panel",
    description: "Total cholesterol, LDL, HDL, triglycerides",
    reason: "Cardiovascular risk assessment",
    fasting: true,
    mbsItems: ["66503", "66597"],
    panelGroup: "Serum Chemistry",
    requestLabel: "Lipids, cholesterol, HDL, triglycerides, LDL",
    pdfRequestLabel: "Lipids, total cholesterol, HDL, triglycerides",
  },
  liver_function: {
    name: "Liver Function Tests",
    description: "ALT, AST, GGT, ALP, bilirubin",
    reason: "Assess liver health/fatty liver",
    mbsItems: ["66548"],
    panelGroup: "Serum Chemistry",
    requestLabel: "LFT, ALT, AST, GGT, ALP, bilirubin",
  },
  kidney_function: {
    name: "Kidney Function",
    description: "eGFR, creatinine, urea",
    reason: "Assess renal function before medication",
    mbsItems: ["66572"],
    panelGroup: "Serum Chemistry",
    requestLabel: "U&E, sodium, potassium, urea, creatinine, eGFR",
    pdfRequestLabel: "U&E, sodium, potassium, urea, creatinine",
  },
  thyroid: {
    name: "Thyroid Panel",
    description: "TSH, Free T4, Free T3",
    reason: "Rule out thyroid dysfunction",
    mbsItems: ["66732", "66733"],
    panelGroup: "Thyroid Function",
    requestLabel: "TSH ± free T4 / free T3",
  },
  full_blood_count: {
    name: "Full Blood Count",
    description: "CBC with differential",
    reason: "General health screening",
    mbsItems: ["65070"],
    panelGroup: "Full Blood Examination",
    requestLabel: "FBE, haemoglobin, RBC, Hct, MCV, platelets, WCC differential",
  },
  iron_studies: {
    name: "Iron Studies",
    description: "Ferritin, iron, TIBC",
    reason: "Assess iron status",
    mbsItems: ["66596"],
    panelGroup: "Iron Studies",
    requestLabel: "Serum iron, transferrin/IBC, saturation, ferritin",
    pdfRequestLabel: "Serum iron, transferrin/IBC, ferritin",
  },
  vitamin_d: {
    name: "Vitamin D",
    description: "25-OH Vitamin D",
    reason: "Check vitamin D status",
    mbsItems: ["66839"],
    panelGroup: "Vitamins",
    requestLabel: "Vitamin D3 (25-OH vitamin D)",
  },
  cortisol: {
    name: "Cortisol",
    description: "Morning cortisol",
    reason: "Rule out Cushing's / assess stress axis",
    mbsItems: ["66695"],
    panelGroup: "Hormones",
    requestLabel: "Serum cortisol",
  },
  crp: {
    name: "CRP",
    description: "C-Reactive Protein",
    reason: "Assess systemic inflammation",
    panelGroup: "Inflammation",
    requestLabel: "CRP (C-reactive protein), usually private",
  },
  male_hormone_panel: {
    name: "Male Hormone Panel",
    description: "Total & free testosterone, SHBG, free androgen index",
    reason: "Assess androgen status and vitality",
    mbsItems: ["66695"],
    panelGroup: "Hormones",
    requestLabel: "Testosterone (total & free), SHBG, free androgen index",
    pdfRequestLabel: "Testosterone (total & free), SHBG",
  },
  female_hormone_panel: {
    name: "Female Hormone Panel",
    description: "Estradiol, progesterone, FSH, LH, prolactin, testosterone, SHBG",
    reason: "Assess reproductive and hormonal balance",
    mbsItems: ["66695"],
    panelGroup: "Hormones",
    requestLabel: "Estradiol, progesterone, FSH, LH, prolactin, testosterone, SHBG",
  },
  vitamin_b12_folate: {
    name: "Vitamin B12 & Folate",
    description: "Serum B12 and red cell folate",
    reason: "Assess nutrient status affecting energy and hair",
    mbsItems: ["66680", "66659"],
    panelGroup: "Vitamins",
    requestLabel: "Serum vitamin B12 & folate",
  },
  zinc: {
    name: "Zinc",
    description: "Serum zinc",
    reason: "Assess zinc status for hair and immune health",
    panelGroup: "Trace Elements",
    requestLabel: "Serum zinc, usually private",
  },
  dhea_s: {
    name: "DHEA-S",
    description: "Dehydroepiandrosterone sulphate",
    reason: "Assess adrenal androgen production",
    mbsItems: ["66695"],
    panelGroup: "Hormones",
    requestLabel: "DHEA-S (dehydroepiandrosterone sulphate)",
  },
};

export function getBloodTestLabel(testId: string): string {
  const test = BLOOD_TEST_CATALOG[testId];
  return test ? `${test.name}, ${test.description}` : testId;
}

export function catalogTestsRequireFasting(testIds: string[]): boolean {
  return testIds.some((id) => BLOOD_TEST_CATALOG[id]?.fasting);
}

export function listBloodTestsForApi() {
  return Object.entries(BLOOD_TEST_CATALOG).map(([id, test]) => ({
    id,
    name: test.name,
    description: test.description,
    reason: test.reason,
    fasting: Boolean(test.fasting),
  }));
}

export function buildClinicalIndicationFromTests(
  testIds: string[],
  customTests?: string
): string {
  const lines = testIds
    .map((id) => BLOOD_TEST_CATALOG[id])
    .filter(Boolean)
    .map((test) => `${test.name}: ${test.reason}`);

  if (customTests?.trim()) {
    lines.push(`Additional tests: ${customTests.trim()}`);
  }

  return lines.join("\n");
}

/** Calculated/derived analytes, not ordered as separate pathology tests on referrals. */
const CALCULATED_MARKER_PHRASES = [
  /\bHOMA-?IR\b/gi,
  /\beGFR\b/gi,
  /\bfree androgen index\b/gi,
  /\btransferrin saturation\b/gi,
  /\bTyG index\b/gi,
  /\bestimated average glucose\b/gi,
  /\bnon-?HDL cholesterol\b/gi,
  /\bVLDL cholesterol\b/gi,
  /\batherogenic index\b/gi,
  /\banion gap\b/gi,
  /\bNLR\b/g,
  /\bplatelet[–-]lymphocyte ratio\b/gi,
  /\bLDL[–-]HDL ratio\b/gi,
  /\bTC[–-]HDL ratio\b/gi,
  /\bTG[–-]HDL ratio\b/gi,
  /\bAST[–-]ALT ratio\b/gi,
  /\balbumin[–-]globulin ratio\b/gi,
  /\burea[–-]creatinine ratio\b/gi,
  /\bfree T3[–-]T4 ratio\b/gi,
];

export function stripCalculatedMarkerPhrases(text: string): string {
  let cleaned = text;
  for (const pattern of CALCULATED_MARKER_PHRASES) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned
    .replace(/\s*&\s*$/g, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/,\s*and\s*,/gi, ",")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*$/g, "")
    .trim();
}

function formatMbsCode(mbsItems?: string[]): string {
  if (!mbsItems?.length) return "Pvt";
  return mbsItems.join("/");
}

type GroupedPathologyLine = {
  panelGroup: AustralianPathologyPanelGroup;
  code: string;
  label: string;
  fasting?: boolean;
};

function pathologyPdfLabel(test: BloodTestCatalogEntry): string {
  return test.pdfRequestLabel ?? test.requestLabel;
}

function buildGroupedPathologyLines(testIds: string[]): GroupedPathologyLine[] {
  const lines: GroupedPathologyLine[] = [];

  for (const testId of testIds) {
    const test = BLOOD_TEST_CATALOG[testId];
    if (!test) {
      lines.push({
        panelGroup: "Other",
        code: "Pvt",
        label: getBloodTestLabel(testId),
      });
      continue;
    }

    lines.push({
      panelGroup: test.panelGroup,
      code: formatMbsCode(test.mbsItems),
      label: pathologyPdfLabel(test),
      fasting: test.fasting,
    });
  }

  return lines.sort(
    (a, b) =>
      PANEL_GROUP_ORDER.indexOf(a.panelGroup) - PANEL_GROUP_ORDER.indexOf(b.panelGroup)
  );
}

/**
 * Australian pathology request format grouped by panel (QML-style nomenclature + MBS codes).
 */
export function formatAustralianPathologyTestsForPdf(
  testIds: string[],
  customTests?: string
): string {
  const grouped = buildGroupedPathologyLines(testIds);
  const output: string[] = [];
  let currentGroup: AustralianPathologyPanelGroup | null = null;

  for (const line of grouped) {
    if (line.panelGroup !== currentGroup) {
      if (currentGroup !== null) output.push("");
      output.push(line.panelGroup.toUpperCase());
      currentGroup = line.panelGroup;
    }

    const fastingSuffix = line.fasting ? "  (fasting)" : "";
    output.push(`X  ${line.code}  ${line.label}${fastingSuffix}`);
  }

  if (customTests?.trim()) {
    const cleanedCustom = stripCalculatedMarkerPhrases(customTests.trim());
    if (cleanedCustom) {
      if (output.length) output.push("");
      output.push("OTHER");
      output.push(`X  Pvt  ${cleanedCustom}`);
    }
  }

  return output.join("\n");
}
