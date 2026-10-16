import { biomarkerDefinitions, categoryInfo, getBiomarkerById } from "@/data/biomarkers";
import type { BiomarkerCategory, BiomarkerDefinition } from "@/types";

/** URL slug for a biomarker id (ldl_cholesterol → ldl-cholesterol). */
export function biomarkerSlug(id: string): string {
  return id.replace(/_/g, "-");
}

export function biomarkerIdFromSlug(slug: string): string {
  return slug.replace(/-/g, "_");
}

export function getBiomarkerBySlug(slug: string): BiomarkerDefinition | undefined {
  return getBiomarkerById(biomarkerIdFromSlug(slug));
}

export const biomarkerCategoryOrder: BiomarkerCategory[] = [
  "heart",
  "metabolic",
  "liver",
  "kidney",
  "thyroid",
  "hormones",
  "blood",
  "vitamins",
  "minerals",
  "inflammation",
  "immunity",
];

/** Conditions each category helps assess — used for MedicalTest.usedToDiagnose and copy. */
export const biomarkerCategoryConditions: Record<BiomarkerCategory, string[]> = {
  heart: ["Cardiovascular disease", "Atherosclerosis", "Dyslipidaemia"],
  metabolic: ["Type 2 diabetes", "Insulin resistance", "Metabolic syndrome"],
  liver: ["Fatty liver disease (MASLD)", "Liver fibrosis", "Hepatitis"],
  kidney: ["Chronic kidney disease", "Dehydration", "Electrolyte imbalance"],
  thyroid: ["Hypothyroidism", "Hyperthyroidism", "Hashimoto's thyroiditis"],
  hormones: ["Hypogonadism", "Menopause", "PCOS", "Adrenal dysfunction"],
  blood: ["Anaemia", "Iron deficiency", "Infection"],
  vitamins: ["Vitamin D deficiency", "Vitamin B12 deficiency", "Folate deficiency"],
  minerals: ["Mineral deficiency", "Electrolyte imbalance"],
  inflammation: ["Chronic inflammation", "Cardiovascular risk", "Autoimmune disease"],
  immunity: ["Immune dysfunction", "Infection", "Allergy"],
};

export function biomarkersGroupedByCategory() {
  return biomarkerCategoryOrder.map((category) => ({
    category,
    label: categoryInfo[category].name,
    biomarkers: biomarkerDefinitions.filter((b) => b.category === category),
  }));
}

export function formatRange(def: BiomarkerDefinition, sex: "male" | "female"): string {
  const r = def.ranges[sex];
  return `${r.optimal_low}–${r.optimal_high} ${r.unit}`;
}

/** Same optimal range for both sexes → show once. */
export function rangesAreIdentical(def: BiomarkerDefinition): boolean {
  const m = def.ranges.male;
  const f = def.ranges.female;
  return m.optimal_low === f.optimal_low && m.optimal_high === f.optimal_high && m.unit === f.unit;
}

export function biomarkerSeoTitle(def: BiomarkerDefinition): string {
  const short = def.shortName && def.shortName !== def.name ? ` (${def.shortName})` : "";
  return `${def.name}${short} Blood Test: Normal Range & What It Means | Sanative`;
}

export function biomarkerSeoDescription(def: BiomarkerDefinition): string {
  const base = `${def.name} blood test explained: what it measures, optimal range (${formatRange(def, "male")}), why it matters and how to improve it. Doctor-reviewed in Australia.`;
  return base.length > 158 ? `${base.slice(0, 155).trimEnd()}…` : base;
}

export function biomarkerFaqs(def: BiomarkerDefinition) {
  const identical = rangesAreIdentical(def);
  const rangeText = identical
    ? `Sanative's optimal range for ${def.name} is ${formatRange(def, "male")}.`
    : `Sanative's optimal range for ${def.name} is ${formatRange(def, "male")} for men and ${formatRange(def, "female")} for women.`;
  return [
    {
      question: `What is a normal ${def.name} level?`,
      answer: `${rangeText} Laboratory reference ranges can be wider and vary between labs; your doctor interprets your result alongside your other biomarkers and history.`,
    },
    {
      question: `What does ${def.name} measure?`,
      answer: def.description,
    },
    {
      question: `Why does ${def.name} matter?`,
      answer: def.whyItMatters,
    },
    {
      question: `How can I improve my ${def.name}?`,
      answer:
        def.improvementTips.length > 0
          ? `${def.improvementTips.slice(0, 3).join(". ")}. Always discuss changes with your doctor, especially if you take medication.`
          : "Your doctor will recommend changes based on your result and overall health picture.",
    },
  ];
}
