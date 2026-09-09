// Blood Panel Configuration - Australian SI Units
// NSW Health Pathology Adult Reference Intervals (2019) for lab RIs;
// optimal band = NSW RI where the marker appears in that document.

import {
  Heart,
  Flame,
  Sparkles,
  Activity,
  Bean,
  Droplets,
  Droplet,
  Sun,
  Zap,
  type LucideIcon
} from "lucide-react";

// Gender-specific range structure
export interface GenderRange {
  optimalLow: number;
  optimalHigh: number;
  normalLow: number;
  normalHigh: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface BloodPanelBiomarker {
  id: string;
  name: string;
  shortName: string;
  unit: string;
  // Default ranges (used when no gender-specific ranges or for unisex biomarkers)
  optimalLow: number;
  optimalHigh: number;
  normalLow: number;
  normalHigh: number;
  criticalLow?: number;
  criticalHigh?: number;
  // Gender-specific ranges (optional - when present, override defaults)
  maleRange?: GenderRange;
  femaleRange?: GenderRange;
  note?: string;
}

export interface BloodPanelCategory {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  biomarkers: BloodPanelBiomarker[];
}

export type BloodPanelCategoryKey =
  | "heart"
  | "metabolism"
  | "thyroid"
  | "hormones"
  | "nutrients"
  | "liver"
  | "kidney"
  | "blood"
  | "inflammation";

export type Gender = "male" | "female";

// Full Blood Panel Configuration with Australian SI Units
export const bloodPanelConfig: Record<BloodPanelCategoryKey, BloodPanelCategory> = {
  heart: {
    name: "Heart Health",
    description: "Cardiovascular risk markers",
    icon: Heart,
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    biomarkers: [
      {
        id: "ldl_cholesterol",
        name: "LDL Cholesterol",
        shortName: "LDL",
        unit: "mmol/L",
        optimalLow: 0, optimalHigh: 3.5, normalLow: 0, normalHigh: 5, criticalHigh: 7
      },
      {
        id: "hdl_cholesterol",
        name: "HDL Cholesterol",
        shortName: "HDL",
        unit: "mmol/L",
        optimalLow: 0.7, optimalHigh: 1.9, normalLow: 0.7, normalHigh: 3, criticalLow: 0, criticalHigh: 3.92,
        maleRange: { optimalLow: 0.7, optimalHigh: 1.9, normalLow: 0.7, normalHigh: 3, criticalLow: 0, criticalHigh: 3.92 },
        femaleRange: { optimalLow: 0.9, optimalHigh: 2.4, normalLow: 0.9, normalHigh: 3.5, criticalLow: 0, criticalHigh: 4.54 },
        note: "Women typically have higher HDL levels"
      },
      {
        id: "total_cholesterol",
        name: "Total Cholesterol",
        shortName: "TC",
        unit: "mmol/L",
        optimalLow: 3, optimalHigh: 5.5, normalLow: 3, normalHigh: 7, criticalLow: 1.6, criticalHigh: 8.6
      },
      {
        id: "triglycerides",
        name: "Triglycerides",
        shortName: "TG",
        unit: "mmol/L",
        optimalLow: 0, optimalHigh: 2, normalLow: 0, normalHigh: 5, criticalHigh: 7
      },
      {
        id: "crp",
        name: "C-Reactive Protein",
        shortName: "CRP",
        unit: "mg/L",
        optimalLow: 0, optimalHigh: 3, normalLow: 0, normalHigh: 10, criticalHigh: 14,
        note: "NSW HP adult RI <3 mg/L (standard CRP)."
      },
      // Calculated/Derived markers
      { id: "non_hdl_cholesterol", name: "Non-HDL Cholesterol", shortName: "Non-HDL", unit: "mmol/L", optimalLow: 0, optimalHigh: 3.4, normalLow: 0, normalHigh: 4.9, criticalHigh: 6.0 },
      {
        id: "tc_hdl_ratio",
        name: "TC/HDL Ratio",
        shortName: "TC/HDL",
        unit: "",
        optimalLow: 2.0, optimalHigh: 4.0, normalLow: 1.0, normalHigh: 6.0, criticalHigh: 8.0,
        maleRange: { optimalLow: 2.0, optimalHigh: 4.0, normalLow: 1.5, normalHigh: 6.0, criticalHigh: 8.0 },
        femaleRange: { optimalLow: 2.0, optimalHigh: 3.5, normalLow: 1.5, normalHigh: 5.0, criticalHigh: 7.0 },
        note: "Lower is better for cardiovascular health"
      },
      { id: "ldl_hdl_ratio", name: "LDL/HDL Ratio", shortName: "LDL/HDL", unit: "", optimalLow: 1.0, optimalHigh: 2.5, normalLow: 0.5, normalHigh: 4.0, criticalHigh: 5.0 },
      { id: "tg_hdl_ratio", name: "TG/HDL Ratio", shortName: "TG/HDL", unit: "", optimalLow: 0.5, optimalHigh: 2.0, normalLow: 0.3, normalHigh: 4.0, criticalHigh: 6.0 },
      { id: "atherogenic_index_plasma", name: "Atherogenic Index of Plasma", shortName: "AIP", unit: "", optimalLow: -0.5, optimalHigh: 0.11, normalLow: -0.5, normalHigh: 0.21, criticalHigh: 0.35, note: "Calculated as log10(triglycerides / HDL). Lower is better." },
      { id: "vldl_cholesterol", name: "VLDL Cholesterol", shortName: "VLDL", unit: "mmol/L", optimalLow: 0, optimalHigh: 1.0, normalLow: 0, normalHigh: 1.5, criticalHigh: 2.5, note: "Calculated from triglycerides (÷ 2.2) when TG < 4.5 mmol/L" },
      { id: "remnant_cholesterol", name: "Remnant Cholesterol", shortName: "Remnant", unit: "mmol/L", optimalLow: 0, optimalHigh: 0.7, normalLow: 0, normalHigh: 1.0, criticalHigh: 1.4, note: "Calculated as total cholesterol − HDL − LDL. Score: <0.7 optimal, 0.7–1.0 elevated, >1.0 high risk." },
      { id: "atherogenic_coefficient", name: "Atherogenic Coefficient", shortName: "AC", unit: "", optimalLow: 0, optimalHigh: 2.0, normalLow: 0, normalHigh: 3.0, criticalHigh: 4.0, note: "(TC − HDL) / HDL. Score: <2 optimal, 2–3 borderline, >3 high risk." },
    ]
  },
  metabolism: {
    name: "Metabolism",
    description: "Blood sugar & metabolic health",
    icon: Flame,
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    biomarkers: [
      {
        id: "hba1c",
        name: "HbA1c",
        shortName: "HbA1c",
        unit: "%",
        optimalLow: 4, optimalHigh: 5.6, normalLow: 0, normalHigh: 6.5, criticalHigh: 9.1
      },
      {
        id: "glucose",
        name: "Fasting Glucose",
        shortName: "Gluc",
        unit: "mmol/L",
        optimalLow: 3, optimalHigh: 5.5, normalLow: 3, normalHigh: 7, criticalLow: 1.6, criticalHigh: 8.6
      },
      { id: "insulin", name: "Fasting Insulin", shortName: "Ins", unit: "mIU/L", optimalLow: 2.0, optimalHigh: 8.0, normalLow: 2.0, normalHigh: 12.0, criticalHigh: 25.0 },
      { id: "homa_ir", name: "HOMA-IR", shortName: "HOMA", unit: "", optimalLow: 0, optimalHigh: 1.0, normalLow: 0, normalHigh: 2.5, criticalHigh: 4.0 },
      { id: "tyg_index", name: "TyG Index", shortName: "TyG", unit: "", optimalLow: 0, optimalHigh: 8.5, normalLow: 0, normalHigh: 9.5, criticalHigh: 10.5, note: "Calculated from fasting triglycerides and glucose (mmol/L → mg/dL)" },
      { id: "estimated_average_glucose", name: "Estimated Average Glucose", shortName: "eAG", unit: "mmol/L", optimalLow: 3.9, optimalHigh: 5.5, normalLow: 3.5, normalHigh: 6.0, criticalHigh: 7.8, note: "Calculated from HbA1c (%)" },
      { id: "homa_b", name: "HOMA-B", shortName: "HOMA-B", unit: "%", optimalLow: 70, optimalHigh: 200, normalLow: 40, normalHigh: 250, criticalLow: 20, criticalHigh: 350, note: "Beta-cell output. Score: <70 low, 70–200 adequate, >200 compensating." },
      { id: "quicki", name: "QUICKI", shortName: "QUICKI", unit: "", optimalLow: 0.357, optimalHigh: 0.45, normalLow: 0.33, normalHigh: 0.45, criticalLow: 0.3, note: "Higher is more insulin-sensitive. Score: <0.33 resistant, 0.33–0.357 borderline, >0.357 sensitive." },
      { id: "mcauley_index", name: "McAuley Index", shortName: "McAuley", unit: "", optimalLow: 6.3, optimalHigh: 12, normalLow: 5.8, normalHigh: 12, criticalLow: 4.5, note: "Higher is more insulin-sensitive. Score: <5.8 resistant, 5.8–6.3 borderline, >6.3 sensitive." },
      { id: "uric_acid_hdl_ratio", name: "Uric Acid / HDL Ratio", shortName: "UA/HDL", unit: "", optimalLow: 0, optimalHigh: 0.3, normalLow: 0, normalHigh: 0.45, criticalHigh: 0.6, note: "Score: <0.30 optimal, 0.30–0.45 elevated, >0.45 high." },
      {
        id: "uric_acid",
        name: "Uric Acid",
        shortName: "UA",
        unit: "mmol/L",
        optimalLow: 0.2, optimalHigh: 0.42, normalLow: 0.2, normalHigh: 0.55, criticalLow: 0.078, criticalHigh: 0.69,
        maleRange: { optimalLow: 0.2, optimalHigh: 0.42, normalLow: 0.2, normalHigh: 0.55, criticalLow: 0.078, criticalHigh: 0.69 },
        femaleRange: { optimalLow: 0.14, optimalHigh: 0.34, normalLow: 0.14, normalHigh: 0.45, criticalLow: 0.032, criticalHigh: 0.574 },
        note: "Men typically have higher uric acid levels"
      },
    ]
  },
  thyroid: {
    name: "Thyroid Function",
    description: "Thyroid hormone balance",
    icon: Activity,
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    biomarkers: [
      {
        id: "tsh",
        name: "TSH",
        shortName: "TSH",
        unit: "mIU/L",
        optimalLow: 0.27, optimalHigh: 4.2, normalLow: 0.27, normalHigh: 10, criticalLow: 0, criticalHigh: 13.892
      },
      {
        id: "free_t4",
        name: "Free T4",
        shortName: "fT4",
        unit: "pmol/L",
        optimalLow: 12, optimalHigh: 22, normalLow: 12, normalHigh: 28, criticalLow: 6.4, criticalHigh: 34.4
      },
      {
        id: "free_t3",
        name: "Free T3",
        shortName: "fT3",
        unit: "pmol/L",
        optimalLow: 3.1, optimalHigh: 6.8, normalLow: 3.1, normalHigh: 8.5, criticalLow: 1.21, criticalHigh: 10.66
      },
      { id: "tpo_antibodies", name: "TPO Antibodies", shortName: "TPO-Ab", unit: "IU/mL", optimalLow: 0, optimalHigh: 35, normalLow: 0, normalHigh: 60, criticalHigh: 500 },
      { id: "tg_antibodies", name: "Thyroglobulin Antibodies", shortName: "TG-Ab", unit: "IU/mL", optimalLow: 0, optimalHigh: 40, normalLow: 0, normalHigh: 115, criticalHigh: 500 },
      { id: "free_t3_t4_ratio", name: "Free T3/T4 Ratio", shortName: "fT3/fT4", unit: "", optimalLow: 0.28, optimalHigh: 0.45, normalLow: 0.22, normalHigh: 0.55, criticalLow: 0.15, criticalHigh: 0.65, note: "Calculated from free T3 and free T4" },
      { id: "tsh_index", name: "TSH Index", shortName: "TSHI", unit: "", optimalLow: 1.3, optimalHigh: 4.1, normalLow: 1.0, normalHigh: 4.5, criticalLow: 0.5, criticalHigh: 5.5, note: "Jostel index from TSH + FT4. Score: 1.3–4.1 euthyroid." },
    ]
  },
  hormones: {
    name: "Hormones",
    description: "Reproductive & stress hormones",
    icon: Sparkles,
    color: "#a855f7",
    bgColor: "bg-purple-500/10",
    biomarkers: [
      {
        id: "cortisol",
        name: "Cortisol (AM)",
        shortName: "Cortisol",
        unit: "nmol/L",
        optimalLow: 200, optimalHigh: 450, normalLow: 140, normalHigh: 690, criticalLow: 80, criticalHigh: 800
      },
      {
        id: "dhea_s",
        name: "DHEA-S",
        shortName: "DHEA-S",
        unit: "µmol/L",
        optimalLow: 4.0, optimalHigh: 10.0, normalLow: 2.0, normalHigh: 15.0, criticalLow: 1.0,
        maleRange: { optimalLow: 5.0, optimalHigh: 12.0, normalLow: 2.5, normalHigh: 16.0, criticalLow: 1.5 },
        femaleRange: { optimalLow: 3.0, optimalHigh: 9.0, normalLow: 1.5, normalHigh: 12.0, criticalLow: 0.8 },
        note: "Declines with age in both sexes"
      },
      {
        id: "testosterone_total",
        name: "Total Testosterone",
        shortName: "TT",
        unit: "nmol/L",
        optimalLow: 12.0, optimalHigh: 25.0, normalLow: 8.0, normalHigh: 35.0,
        maleRange: { optimalLow: 14.0, optimalHigh: 28.0, normalLow: 8.0, normalHigh: 35.0, criticalLow: 6.0 },
        femaleRange: { optimalLow: 0.5, optimalHigh: 2.0, normalLow: 0.3, normalHigh: 2.8, criticalHigh: 4.0 },
        note: "Significantly different between sexes"
      },
      {
        id: "testosterone_free",
        name: "Free Testosterone",
        shortName: "Free T",
        unit: "pmol/L",
        optimalLow: 250, optimalHigh: 500, normalLow: 170, normalHigh: 700,
        maleRange: { optimalLow: 250, optimalHigh: 500, normalLow: 170, normalHigh: 700, criticalLow: 100 },
        femaleRange: { optimalLow: 5, optimalHigh: 25, normalLow: 2, normalHigh: 40, criticalHigh: 60 },
        note: "Much lower in females"
      },
      {
        id: "estradiol",
        name: "Estradiol",
        shortName: "E2",
        unit: "pmol/L",
        optimalLow: 150, optimalHigh: 500, normalLow: 70, normalHigh: 1100,
        maleRange: { optimalLow: 40, optimalHigh: 150, normalLow: 20, normalHigh: 200, criticalHigh: 250 },
        femaleRange: { optimalLow: 150, optimalHigh: 750, normalLow: 70, normalHigh: 1500 },
        note: "Female ranges vary by menstrual cycle phase"
      },
      {
        id: "progesterone",
        name: "Progesterone",
        shortName: "Prog",
        unit: "nmol/L",
        optimalLow: 0.5, optimalHigh: 5.0, normalLow: 0.3, normalHigh: 80.0,
        maleRange: { optimalLow: 0.3, optimalHigh: 1.5, normalLow: 0.2, normalHigh: 2.5 },
        femaleRange: { optimalLow: 1.0, optimalHigh: 30.0, normalLow: 0.5, normalHigh: 90.0 },
        note: "Female ranges vary by menstrual cycle phase"
      },
      {
        id: "fsh",
        name: "FSH",
        shortName: "FSH",
        unit: "IU/L",
        optimalLow: 2.0, optimalHigh: 10.0, normalLow: 1.5, normalHigh: 15.0,
        maleRange: { optimalLow: 1.5, optimalHigh: 10.0, normalLow: 1.0, normalHigh: 12.0 },
        femaleRange: { optimalLow: 3.0, optimalHigh: 12.0, normalLow: 1.5, normalHigh: 25.0 },
        note: "Female values vary by cycle phase and menopausal status"
      },
      {
        id: "lh",
        name: "LH",
        shortName: "LH",
        unit: "IU/L",
        optimalLow: 2.0, optimalHigh: 9.0, normalLow: 1.0, normalHigh: 12.0,
        maleRange: { optimalLow: 1.5, optimalHigh: 9.0, normalLow: 1.0, normalHigh: 12.0 },
        femaleRange: { optimalLow: 2.0, optimalHigh: 15.0, normalLow: 1.0, normalHigh: 70.0 },
        note: "Female values vary by cycle phase"
      },
      {
        id: "shbg",
        name: "SHBG",
        shortName: "SHBG",
        unit: "nmol/L",
        optimalLow: 20.0, optimalHigh: 60.0, normalLow: 15.0, normalHigh: 80.0,
        maleRange: { optimalLow: 18.0, optimalHigh: 55.0, normalLow: 13.0, normalHigh: 70.0 },
        femaleRange: { optimalLow: 30.0, optimalHigh: 80.0, normalLow: 20.0, normalHigh: 130.0 },
        note: "Higher in females"
      },
      {
        id: "prolactin",
        name: "Prolactin",
        shortName: "PRL",
        unit: "mIU/L",
        optimalLow: 50, optimalHigh: 350, normalLow: 30, normalHigh: 500, criticalHigh: 1000,
        maleRange: { optimalLow: 50, optimalHigh: 280, normalLow: 30, normalHigh: 400, criticalHigh: 700 },
        femaleRange: { optimalLow: 60, optimalHigh: 400, normalLow: 40, normalHigh: 600, criticalHigh: 1200 },
        note: "Higher in females, increases during pregnancy/breastfeeding"
      },
      {
        id: "free_androgen_index",
        name: "Free Androgen Index",
        shortName: "FAI",
        unit: "",
        optimalLow: 30, optimalHigh: 150, normalLow: 15, normalHigh: 200,
        maleRange: { optimalLow: 30, optimalHigh: 150, normalLow: 15, normalHigh: 200, criticalHigh: 250 },
        femaleRange: { optimalLow: 0.5, optimalHigh: 5.0, normalLow: 0.3, normalHigh: 8.0, criticalHigh: 12.0 },
        note: "Calculated from total testosterone and SHBG. Sex-specific ranges apply."
      },
    ]
  },
  nutrients: {
    name: "Nutrients",
    description: "Essential vitamins & minerals",
    icon: Sun,
    color: "#eab308",
    bgColor: "bg-yellow-500/10",
    biomarkers: [
      // Vitamins
      { id: "vitamin_d", name: "Vitamin D (25-OH)", shortName: "Vit D", unit: "nmol/L", optimalLow: 75, optimalHigh: 150, normalLow: 50, normalHigh: 200, criticalLow: 25 },
      { id: "vitamin_b12", name: "Vitamin B12", shortName: "B12", unit: "pmol/L", optimalLow: 300, optimalHigh: 600, normalLow: 200, normalHigh: 900, criticalLow: 150 },
      { id: "folate", name: "Folate (Serum)", shortName: "Folate", unit: "nmol/L", optimalLow: 15.0, optimalHigh: 40.0, normalLow: 10.0, normalHigh: 45.0, criticalLow: 7.0 },
      { id: "active_b12", name: "Active B12", shortName: "Active B12", unit: "pmol/L", optimalLow: 70, optimalHigh: 150, normalLow: 35, normalHigh: 200, criticalLow: 25 },
      // Minerals
      {
        id: "iron",
        name: "Serum Iron",
        shortName: "Iron",
        unit: "µmol/L",
        optimalLow: 8.1, optimalHigh: 32.6, normalLow: 8.1, normalHigh: 40, criticalLow: 0, criticalHigh: 52.76,
        maleRange: { optimalLow: 8.1, optimalHigh: 32.6, normalLow: 8.1, normalHigh: 40, criticalLow: 0, criticalHigh: 52.76 },
        femaleRange: { optimalLow: 5, optimalHigh: 30.4, normalLow: 5, normalHigh: 38, criticalLow: 0, criticalHigh: 51.2 },
        note: "Women may have lower levels due to menstruation"
      },
      {
        id: "ferritin",
        name: "Ferritin",
        shortName: "Ferritin",
        unit: "µg/L",
        optimalLow: 20, optimalHigh: 300, normalLow: 20, normalHigh: 400, criticalLow: 0, criticalHigh: 552,
        maleRange: { optimalLow: 20, optimalHigh: 300, normalLow: 20, normalHigh: 400, criticalLow: 0, criticalHigh: 552 },
        femaleRange: { optimalLow: 15, optimalHigh: 200, normalLow: 15, normalHigh: 300, criticalLow: 0, criticalHigh: 414 },
        note: "Lower reference range for premenopausal women"
      },
      {
        id: "transferrin_saturation",
        name: "Transferrin Saturation",
        shortName: "TSAT",
        unit: "%",
        optimalLow: 20, optimalHigh: 45, normalLow: 15, normalHigh: 50, criticalLow: 10, criticalHigh: 60,
        maleRange: { optimalLow: 25, optimalHigh: 45, normalLow: 20, normalHigh: 55, criticalLow: 15, criticalHigh: 65 },
        femaleRange: { optimalLow: 18, optimalHigh: 40, normalLow: 12, normalHigh: 45, criticalLow: 8, criticalHigh: 55 }
      },
      { id: "tibc", name: "Total Iron Binding Capacity", shortName: "TIBC", unit: "µmol/L", optimalLow: 45, optimalHigh: 72, normalLow: 40, normalHigh: 80, criticalLow: 30, criticalHigh: 90 },
      {
        id: "magnesium",
        name: "Magnesium",
        shortName: "Mg",
        unit: "mmol/L",
        optimalLow: 0.7, optimalHigh: 1.1, normalLow: 0.7, normalHigh: 1.3, criticalLow: 0.49, criticalHigh: 1.54
      },
      {
        id: "zinc",
        name: "Zinc",
        shortName: "Zn",
        unit: "µmol/L",
        optimalLow: 10, optimalHigh: 18, normalLow: 9, normalHigh: 25, criticalLow: 3.4, criticalHigh: 31.4,
        note: "Australian SI units (µmol/L)."
      },
      { id: "selenium", name: "Selenium", shortName: "Se", unit: "µmol/L", optimalLow: 1.0, optimalHigh: 1.5, normalLow: 0.8, normalHigh: 2.0, criticalLow: 0.6 },
      { id: "copper", name: "Copper", shortName: "Cu", unit: "µmol/L", optimalLow: 12.0, optimalHigh: 20.0, normalLow: 10.0, normalHigh: 25.0 },
    ]
  },
  liver: {
    name: "Liver Function",
    description: "Hepatic health markers",
    icon: Bean,
    color: "#84cc16",
    bgColor: "bg-lime-500/10",
    biomarkers: [
      {
        id: "alt",
        name: "ALT (SGPT)",
        shortName: "ALT",
        unit: "U/L",
        optimalLow: 0, optimalHigh: 51, normalLow: 0, normalHigh: 100, criticalHigh: 140,
        maleRange: { optimalLow: 0, optimalHigh: 51, normalLow: 0, normalHigh: 100, criticalHigh: 140 },
        femaleRange: { optimalLow: 0, optimalHigh: 36, normalLow: 0, normalHigh: 80, criticalHigh: 112 },
        note: "Men typically have slightly higher ALT"
      },
      {
        id: "ast",
        name: "AST (SGOT)",
        shortName: "AST",
        unit: "U/L",
        optimalLow: 0, optimalHigh: 36, normalLow: 0, normalHigh: 80, criticalHigh: 112
      },
      {
        id: "ggt",
        name: "GGT",
        shortName: "GGT",
        unit: "U/L",
        optimalLow: 5, optimalHigh: 50, normalLow: 5, normalHigh: 80, criticalLow: 0, criticalHigh: 110,
        note: "Men typically have higher GGT levels"
      },
      {
        id: "alp",
        name: "Alkaline Phosphatase",
        shortName: "ALP",
        unit: "U/L",
        optimalLow: 30, optimalHigh: 110, normalLow: 30, normalHigh: 140, criticalLow: 0, criticalHigh: 184
      },
      {
        id: "bilirubin_total",
        name: "Total Bilirubin",
        shortName: "T.Bil",
        unit: "µmol/L",
        optimalLow: 0, optimalHigh: 20, normalLow: 0, normalHigh: 40, criticalHigh: 56
      },
      { id: "bilirubin_direct", name: "Direct Bilirubin", shortName: "D.Bil", unit: "µmol/L", optimalLow: 0, optimalHigh: 5, normalLow: 0, normalHigh: 8, criticalHigh: 20 },
      {
        id: "albumin",
        name: "Albumin",
        shortName: "Alb",
        unit: "g/L",
        optimalLow: 33, optimalHigh: 48, normalLow: 33, normalHigh: 55, criticalLow: 25.3, criticalHigh: 63.8
      },
      {
        id: "total_protein",
        name: "Total Protein",
        shortName: "TP",
        unit: "g/L",
        optimalLow: 60, optimalHigh: 80, normalLow: 60, normalHigh: 90, criticalLow: 49.5, criticalHigh: 102
      },
      { id: "globulin", name: "Globulin", shortName: "Glob", unit: "g/L", optimalLow: 23, optimalHigh: 35, normalLow: 20, normalHigh: 40, criticalHigh: 50 },
      { id: "albumin_globulin_ratio", name: "Albumin/Globulin Ratio", shortName: "A/G", unit: "", optimalLow: 1.0, optimalHigh: 2.0, normalLow: 0.8, normalHigh: 2.5, criticalLow: 0.6, criticalHigh: 3.0, note: "Calculated from albumin and globulin" },
      { id: "ast_alt_ratio", name: "AST/ALT Ratio (De Ritis)", shortName: "AST/ALT", unit: "", optimalLow: 0.8, optimalHigh: 1.2, normalLow: 0.6, normalHigh: 2.0, criticalHigh: 3.0, note: "Calculated from AST and ALT" },
      { id: "indirect_bilirubin", name: "Indirect Bilirubin", shortName: "Ind.Bil", unit: "µmol/L", optimalLow: 2, optimalHigh: 14, normalLow: 0, normalHigh: 17, criticalHigh: 25, note: "Calculated from total minus direct bilirubin" },
      { id: "bilirubin_albumin_ratio", name: "Bilirubin/Albumin Ratio", shortName: "BAR", unit: "", optimalLow: 0, optimalHigh: 0.4, normalLow: 0, normalHigh: 0.8, criticalHigh: 1.5, note: "Calculated from total bilirubin and albumin" },
      { id: "fib4", name: "FIB-4 Score", shortName: "FIB-4", unit: "", optimalLow: 0, optimalHigh: 1.3, normalLow: 0, normalHigh: 2.67, criticalHigh: 3.25, note: "Score: <1.3 low fibrosis risk, 1.3–2.67 indeterminate, >2.67 high risk." },
      { id: "apri", name: "APRI Score", shortName: "APRI", unit: "", optimalLow: 0, optimalHigh: 0.5, normalLow: 0, normalHigh: 1.5, criticalHigh: 2.0, note: "Score: <0.5 low, 0.5–1.5 indeterminate, >1.5 high fibrosis risk." },
    ]
  },
  kidney: {
    name: "Kidney Function",
    description: "Renal health markers",
    icon: Droplets,
    color: "#06b6d4",
    bgColor: "bg-cyan-500/10",
    biomarkers: [
      {
        id: "creatinine",
        name: "Creatinine",
        shortName: "Creat",
        unit: "µmol/L",
        optimalLow: 60, optimalHigh: 110, normalLow: 60, normalHigh: 130, criticalLow: 35.5, criticalHigh: 158,
        maleRange: { optimalLow: 60, optimalHigh: 110, normalLow: 60, normalHigh: 130, criticalLow: 35.5, criticalHigh: 158 },
        femaleRange: { optimalLow: 45, optimalHigh: 90, normalLow: 45, normalHigh: 115, criticalLow: 20.5, criticalHigh: 143 },
        note: "Men have higher creatinine due to greater muscle mass"
      },
      { id: "egfr", name: "eGFR", shortName: "eGFR", unit: "mL/min/1.73m²", optimalLow: 90, optimalHigh: 120, normalLow: 60, normalHigh: 120, criticalLow: 30 },
      {
        id: "bun",
        name: "Urea",
        shortName: "Urea",
        unit: "mmol/L",
        optimalLow: 3.5, optimalHigh: 8, normalLow: 3.5, normalHigh: 12, criticalLow: 0.525, criticalHigh: 15.4,
        maleRange: { optimalLow: 3.5, optimalHigh: 8, normalLow: 3.5, normalHigh: 12, criticalLow: 0.525, criticalHigh: 15.4 },
        femaleRange: { optimalLow: 3, optimalHigh: 7, normalLow: 3, normalHigh: 11, criticalLow: 0.2, criticalHigh: 14.2 }
      },
      {
        id: "uacr",
        name: "Urine Albumin/Creatinine",
        shortName: "UACR",
        unit: "mg/mmol",
        optimalLow: 0, optimalHigh: 2.5, normalLow: 0, normalHigh: 25, criticalHigh: 35,
        maleRange: { optimalLow: 0, optimalHigh: 2.5, normalLow: 0, normalHigh: 25, criticalHigh: 35 },
        femaleRange: { optimalLow: 0, optimalHigh: 3.5, normalLow: 0, normalHigh: 35, criticalHigh: 49 },
        note: "Tested on clinical indication of poor kidney function."
      },
      {
        id: "phosphorus",
        name: "Phosphate",
        shortName: "Phos",
        unit: "mmol/L",
        optimalLow: 0.75, optimalHigh: 1.5, normalLow: 0.75, normalHigh: 1.7, criticalLow: 0.419, criticalHigh: 2.08,
        note: "NSW HP adult RI 0.75–1.50 mmol/L (≥20y)."
      },
      {
        id: "sodium",
        name: "Sodium",
        shortName: "Na",
        unit: "mmol/L",
        optimalLow: 135, optimalHigh: 145, normalLow: 135, normalHigh: 150, criticalLow: 127.125, criticalHigh: 159
      },
      {
        id: "potassium",
        name: "Potassium",
        shortName: "K",
        unit: "mmol/L",
        optimalLow: 3.5, optimalHigh: 5.2, normalLow: 3.5, normalHigh: 5.8, criticalLow: 2.695, criticalHigh: 6.72
      },
      {
        id: "chloride",
        name: "Chloride",
        shortName: "Cl",
        unit: "mmol/L",
        optimalLow: 95, optimalHigh: 110, normalLow: 95, normalHigh: 115, criticalLow: 88, criticalHigh: 123
      },
      {
        id: "bicarbonate",
        name: "Bicarbonate",
        shortName: "HCO3",
        unit: "mmol/L",
        optimalLow: 22, optimalHigh: 32, normalLow: 22, normalHigh: 36, criticalLow: 17.1, criticalHigh: 41.6
      },
      { id: "urea_creatinine_ratio", name: "Urea/Creatinine Ratio", shortName: "Urea/Cr", unit: "", optimalLow: 40, optimalHigh: 80, normalLow: 30, normalHigh: 100, criticalLow: 15, criticalHigh: 150, note: "Calculated from urea (mmol/L) and creatinine (µmol/L)" },
      { id: "anion_gap", name: "Anion Gap", shortName: "AG", unit: "mmol/L", optimalLow: 8, optimalHigh: 16, normalLow: 6, normalHigh: 20, criticalLow: 3, criticalHigh: 25, note: "Calculated from sodium, chloride and bicarbonate" },
      {
        id: "calcium",
        name: "Calcium",
        shortName: "Ca",
        unit: "mmol/L",
        optimalLow: 2.1, optimalHigh: 2.6, normalLow: 2.1, normalHigh: 2.8, criticalLow: 1.855, criticalHigh: 3.08
      },
      {
        id: "corrected_calcium",
        name: "Corrected Calcium",
        shortName: "Corr Ca",
        unit: "mmol/L",
        optimalLow: 2.1, optimalHigh: 2.6, normalLow: 2.1, normalHigh: 2.8, criticalLow: 1.855, criticalHigh: 3.08,
        note: "Payne correction. Score: 2.15–2.55 optimal."
      },
      { id: "calculated_osmolality", name: "Calculated Osmolality", shortName: "Osm", unit: "mOsm/kg", optimalLow: 275, optimalHigh: 295, normalLow: 270, normalHigh: 300, criticalLow: 260, criticalHigh: 320, note: "2×Na + glucose + urea. Score: 275–295 optimal." },
      { id: "kdigo_risk", name: "KDIGO Kidney Risk", shortName: "KDIGO", unit: "", optimalLow: 1, optimalHigh: 1, normalLow: 1, normalHigh: 2, criticalHigh: 4, note: "Score: 1 low, 2 moderate, 3 high, 4 very high (eGFR + UACR)." },
    ]
  },
  blood: {
    name: "Complete Blood Count",
    description: "Blood cell markers",
    icon: Droplet,
    color: "#dc2626",
    bgColor: "bg-red-600/10",
    biomarkers: [
      {
        id: "wbc",
        name: "White Blood Cells",
        shortName: "WBC",
        unit: "x10⁹/L",
        optimalLow: 3.5, optimalHigh: 11, normalLow: 3.5, normalHigh: 15, criticalLow: 0, criticalHigh: 19.6
      },
      {
        id: "rbc",
        name: "Red Blood Cells",
        shortName: "RBC",
        unit: "x10¹²/L",
        optimalLow: 4.5, optimalHigh: 6.5, normalLow: 4.5, normalHigh: 7, criticalLow: 3.625, criticalHigh: 8,
        maleRange: { optimalLow: 4.5, optimalHigh: 6.5, normalLow: 4.5, normalHigh: 7, criticalLow: 3.625, criticalHigh: 8 },
        femaleRange: { optimalLow: 3.8, optimalHigh: 5.8, normalLow: 3.8, normalHigh: 6.3, criticalLow: 2.925, criticalHigh: 7.3 },
        note: "Men have higher RBC counts"
      },
      {
        id: "hemoglobin",
        name: "Hemoglobin",
        shortName: "Hgb",
        unit: "g/L",
        optimalLow: 130, optimalHigh: 180, normalLow: 130, normalHigh: 200, criticalLow: 105.5, criticalHigh: 228,
        maleRange: { optimalLow: 130, optimalHigh: 180, normalLow: 130, normalHigh: 200, criticalLow: 105.5, criticalHigh: 228 },
        femaleRange: { optimalLow: 115, optimalHigh: 165, normalLow: 115, normalHigh: 185, criticalLow: 90.5, criticalHigh: 213 },
        note: "Men have higher hemoglobin levels"
      },
      {
        id: "hematocrit",
        name: "Hematocrit",
        shortName: "Hct",
        unit: "L/L",
        optimalLow: 0.4, optimalHigh: 0.54, normalLow: 0.4, normalHigh: 0.58, criticalLow: 0.337, criticalHigh: 0.652,
        maleRange: { optimalLow: 0.4, optimalHigh: 0.54, normalLow: 0.4, normalHigh: 0.58, criticalLow: 0.337, criticalHigh: 0.652 },
        femaleRange: { optimalLow: 0.37, optimalHigh: 0.47, normalLow: 0.37, normalHigh: 0.51, criticalLow: 0.321, criticalHigh: 0.566 },
        note: "NSW HP adult RI in L/L (volume fraction)."
      },
      {
        id: "platelets",
        name: "Platelets",
        shortName: "Plt",
        unit: "x10⁹/L",
        optimalLow: 150, optimalHigh: 450, normalLow: 150, normalHigh: 600, criticalLow: 0, criticalHigh: 780
      },
      {
        id: "mcv",
        name: "Mean Cell Volume",
        shortName: "MCV",
        unit: "fL",
        optimalLow: 80, optimalHigh: 100, normalLow: 80, normalHigh: 110, criticalLow: 69.5, criticalHigh: 122
      },
      {
        id: "mch",
        name: "Mean Cell Hemoglobin",
        shortName: "MCH",
        unit: "pg",
        optimalLow: 26.5, optimalHigh: 33, normalLow: 26.5, normalHigh: 36, criticalLow: 23.175, criticalHigh: 39.8
      },
      {
        id: "mchc",
        name: "Mean Cell Hgb Concentration",
        shortName: "MCHC",
        unit: "g/L",
        optimalLow: 310, optimalHigh: 360, normalLow: 310, normalHigh: 380, criticalLow: 285.5, criticalHigh: 408
      },
      { id: "rdw", name: "Red Cell Distribution Width", shortName: "RDW", unit: "%", optimalLow: 11.5, optimalHigh: 14.0, normalLow: 11.0, normalHigh: 15.0, criticalHigh: 18.0 },
      {
        id: "neutrophils",
        name: "Neutrophils",
        shortName: "Neut",
        unit: "x10⁹/L",
        optimalLow: 1.7, optimalHigh: 7, normalLow: 1.7, normalHigh: 8.5, criticalLow: 0, criticalHigh: 11.22
      },
      { id: "neutrophil_percent", name: "Neutrophil %", shortName: "Neut%", unit: "%", optimalLow: 40, optimalHigh: 70, normalLow: 35, normalHigh: 80, criticalLow: 20, criticalHigh: 90 },
      {
        id: "lymphocytes",
        name: "Lymphocytes",
        shortName: "Lymph",
        unit: "x10⁹/L",
        optimalLow: 1.5, optimalHigh: 4, normalLow: 1.5, normalHigh: 5, criticalLow: 0.275, criticalHigh: 6.4
      },
      { id: "lymphocyte_percent", name: "Lymphocyte %", shortName: "Lymph%", unit: "%", optimalLow: 20, optimalHigh: 40, normalLow: 15, normalHigh: 45, criticalLow: 10, criticalHigh: 60 },
      {
        id: "monocytes",
        name: "Monocytes",
        shortName: "Mono",
        unit: "x10⁹/L",
        optimalLow: 0.1, optimalHigh: 0.8, normalLow: 0.1, normalHigh: 1.2, criticalLow: 0, criticalHigh: 1.64
      },
      { id: "monocyte_percent", name: "Monocyte %", shortName: "Mono%", unit: "%", optimalLow: 2, optimalHigh: 10, normalLow: 1, normalHigh: 15, criticalHigh: 20 },
      {
        id: "eosinophils",
        name: "Eosinophils",
        shortName: "Eos",
        unit: "x10⁹/L",
        optimalLow: 0.04, optimalHigh: 0.44, normalLow: 0.04, normalHigh: 0.7, criticalLow: 0, criticalHigh: 0.964
      },
      { id: "eosinophil_percent", name: "Eosinophil %", shortName: "Eos%", unit: "%", optimalLow: 1, optimalHigh: 5, normalLow: 0, normalHigh: 10, criticalHigh: 15 },
      {
        id: "basophils",
        name: "Basophils",
        shortName: "Baso",
        unit: "x10⁹/L",
        optimalLow: 0, optimalHigh: 0.2, normalLow: 0, normalHigh: 0.3, criticalHigh: 0.42
      },
      { id: "basophil_percent", name: "Basophil %", shortName: "Baso%", unit: "%", optimalLow: 0, optimalHigh: 2, normalLow: 0, normalHigh: 3, criticalHigh: 5 },
      { id: "mentzer_index", name: "Mentzer Index", shortName: "Mentzer", unit: "", optimalLow: 13, optimalHigh: 16, normalLow: 12, normalHigh: 18, criticalLow: 10, criticalHigh: 22, note: "MCV/RBC. Score: <13 thalassaemia pattern, >13 iron-deficiency pattern if anaemic." },
    ]
  },
  inflammation: {
    name: "Inflammation & Stress",
    description: "Inflammatory and stress-related markers",
    icon: Zap,
    color: "#f43f5e",
    bgColor: "bg-rose-500/10",
    biomarkers: [
      {
        id: "crp",
        name: "C-Reactive Protein",
        shortName: "CRP",
        unit: "mg/L",
        optimalLow: 0, optimalHigh: 3, normalLow: 0, normalHigh: 10, criticalHigh: 14,
        note: "NSW HP adult RI <3 mg/L (standard CRP)."
      },
      {
        id: "homocysteine",
        name: "Homocysteine",
        shortName: "Hcy",
        unit: "μmol/L",
        optimalLow: 5, optimalHigh: 15, normalLow: 5, normalHigh: 20, criticalHigh: 26,
        maleRange: { optimalLow: 5, optimalHigh: 15, normalLow: 5, normalHigh: 20, criticalHigh: 26 },
        femaleRange: { optimalLow: 5, optimalHigh: 12, normalLow: 5, normalHigh: 18, criticalHigh: 23.2 },
        note: "NSW HP adult RI: men 5–15, women 5–12 µmol/L."
      },
      {
        id: "esr",
        name: "ESR",
        shortName: "ESR",
        unit: "mm/hr",
        optimalLow: 0, optimalHigh: 10, normalLow: 0, normalHigh: 20, criticalHigh: 50,
        maleRange: { optimalLow: 0, optimalHigh: 10, normalLow: 0, normalHigh: 15, criticalHigh: 40 },
        femaleRange: { optimalLow: 0, optimalHigh: 12, normalLow: 0, normalHigh: 25, criticalHigh: 55 },
        note: "Women typically have slightly higher ESR"
      },
      { id: "fibrinogen", name: "Fibrinogen", shortName: "Fib", unit: "g/L", optimalLow: 2.0, optimalHigh: 3.5, normalLow: 1.5, normalHigh: 4.0, criticalHigh: 6.0 },
      {
        id: "ferritin_inflammation",
        name: "Ferritin (as inflammatory)",
        shortName: "Ferr",
        unit: "µg/L",
        optimalLow: 50, optimalHigh: 150, normalLow: 20, normalHigh: 300, criticalHigh: 500,
        maleRange: { optimalLow: 60, optimalHigh: 200, normalLow: 30, normalHigh: 400, criticalHigh: 600 },
        femaleRange: { optimalLow: 30, optimalHigh: 120, normalLow: 15, normalHigh: 200, criticalHigh: 400 },
        note: "Elevated ferritin can indicate inflammation"
      },
      { id: "crp_albumin_ratio", name: "CRP/Albumin Ratio", shortName: "CAR", unit: "", optimalLow: 0, optimalHigh: 0.06, normalLow: 0, normalHigh: 0.12, criticalHigh: 0.25, note: "Calculated from CRP (mg/L) and albumin (g/L). Lower is better." },
      { id: "ferritin_albumin_ratio", name: "Ferritin/Albumin Ratio", shortName: "FAR", unit: "", optimalLow: 0, optimalHigh: 10, normalLow: 0, normalHigh: 20, criticalHigh: 40, note: "Calculated from ferritin and albumin" },
      { id: "nlr", name: "Neutrophil/Lymphocyte Ratio", shortName: "NLR", unit: "", optimalLow: 0.5, optimalHigh: 2.5, normalLow: 0.5, normalHigh: 4.0, criticalHigh: 6.0, note: "Calculated from absolute neutrophil and lymphocyte counts" },
      { id: "platelet_lymphocyte_ratio", name: "Platelet/Lymphocyte Ratio", shortName: "PLR", unit: "", optimalLow: 50, optimalHigh: 150, normalLow: 30, normalHigh: 250, criticalHigh: 350, note: "Calculated from platelets and lymphocytes" },
      { id: "sii", name: "Systemic Immune-Inflammation Index", shortName: "SII", unit: "", optimalLow: 200, optimalHigh: 500, normalLow: 100, normalHigh: 1000, criticalHigh: 1500, note: "Score: <500 low, 500–1000 moderate, >1000 high inflammation." },
      { id: "siri", name: "Systemic Inflammation Response Index", shortName: "SIRI", unit: "", optimalLow: 0.2, optimalHigh: 1.0, normalLow: 0, normalHigh: 1.5, criticalHigh: 2.5, note: "Score: <1.0 low, 1.0–1.5 moderate, >1.5 high." },
      { id: "mlr", name: "Monocyte/Lymphocyte Ratio", shortName: "MLR", unit: "", optimalLow: 0.1, optimalHigh: 0.3, normalLow: 0.05, normalHigh: 0.4, criticalHigh: 0.6, note: "Score: <0.3 optimal, 0.3–0.4 elevated, >0.4 high." },
      { id: "nhr", name: "Neutrophil/HDL Ratio", shortName: "NHR", unit: "", optimalLow: 1, optimalHigh: 3.5, normalLow: 0.5, normalHigh: 5, criticalHigh: 8, note: "Score: <3.5 optimal, 3.5–5 elevated, >5 high." },
      { id: "phenotypic_age", name: "Phenotypic Age", shortName: "PhenoAge", unit: "years", optimalLow: 25, optimalHigh: 70, normalLow: 18, normalHigh: 85, criticalHigh: 100, note: "Levine PhenoAge. Compare with calendar age; use Age Acceleration as the score." },
      { id: "age_acceleration", name: "Age Acceleration", shortName: "Age Δ", unit: "years", optimalLow: -10, optimalHigh: 0, normalLow: -12, normalHigh: 3, criticalHigh: 8, note: "PhenoAge − calendar age. Score: <0 younger, 0–3 aligned, >3 older biologically." },
    ]
  }
};

// Category info for styling (matches the config above)
export const bloodPanelCategoryInfo: Record<BloodPanelCategoryKey, { name: string; color: string }> = {
  heart: { name: "Heart Health", color: "#ef4444" },
  metabolism: { name: "Metabolism", color: "#f97316" },
  thyroid: { name: "Thyroid Function", color: "#3b82f6" },
  hormones: { name: "Hormones", color: "#a855f7" },
  nutrients: { name: "Nutrients", color: "#eab308" },
  liver: { name: "Liver Function", color: "#84cc16" },
  kidney: { name: "Kidney Function", color: "#06b6d4" },
  blood: { name: "Complete Blood Count", color: "#dc2626" },
  inflammation: { name: "Inflammation & Stress", color: "#f43f5e" },
};

// Helper function to get the effective range for a biomarker based on gender
export function getEffectiveRange(biomarker: BloodPanelBiomarker, gender?: Gender): GenderRange {
  if (gender === "male" && biomarker.maleRange) {
    return biomarker.maleRange;
  }
  if (gender === "female" && biomarker.femaleRange) {
    return biomarker.femaleRange;
  }
  // Return default ranges
  return {
    optimalLow: biomarker.optimalLow,
    optimalHigh: biomarker.optimalHigh,
    normalLow: biomarker.normalLow,
    normalHigh: biomarker.normalHigh,
    criticalLow: biomarker.criticalLow,
    criticalHigh: biomarker.criticalHigh,
  };
}

// Helper function to get biomarker by ID across all categories
export function getBiomarkerFromPanel(id: string): { category: BloodPanelCategoryKey; biomarker: BloodPanelBiomarker } | undefined {
  for (const [category, config] of Object.entries(bloodPanelConfig)) {
    const biomarker = config.biomarkers.find(b => b.id === id);
    if (biomarker) {
      return { category: category as BloodPanelCategoryKey, biomarker };
    }
  }
  return undefined;
}

// Get all biomarker IDs
export function getAllBiomarkerIds(): string[] {
  const ids = new Set<string>();
  for (const config of Object.values(bloodPanelConfig)) {
    for (const biomarker of config.biomarkers) {
      ids.add(biomarker.id);
    }
  }
  return [...ids];
}

// Check if biomarker has gender-specific ranges
export function hasGenderSpecificRanges(biomarker: BloodPanelBiomarker): boolean {
  return !!(biomarker.maleRange || biomarker.femaleRange);
}

// Get status based on value with gender-specific ranges
export function getBiomarkerStatus(
  value: number | undefined,
  biomarker: BloodPanelBiomarker,
  gender?: Gender
): { status: string; color: string; bgColor: string } {
  if (value === undefined) {
    return { status: "Not Tested", color: "text-gray-500", bgColor: "bg-gray-100" };
  }

  const range = getEffectiveRange(biomarker, gender);
  const { optimalLow, optimalHigh, normalLow, normalHigh, criticalLow, criticalHigh } = range;

  // Check critical ranges first
  if (criticalLow !== undefined && value < criticalLow) {
    return { status: "Critical Low", color: "text-red-700", bgColor: "bg-red-100" };
  }
  if (criticalHigh !== undefined && value > criticalHigh) {
    return { status: "Critical High", color: "text-red-700", bgColor: "bg-red-100" };
  }

  // Check optimal
  if (value >= optimalLow && value <= optimalHigh) {
    return { status: "Optimal", color: "text-green-600", bgColor: "bg-green-100" };
  }

  // Check normal
  if (value >= normalLow && value <= normalHigh) {
    return { status: "Normal", color: "text-yellow-600", bgColor: "bg-yellow-100" };
  }

  // Out of range
  if (value < normalLow) {
    return { status: "Low", color: "text-orange-600", bgColor: "bg-orange-100" };
  }
  return { status: "High", color: "text-orange-600", bgColor: "bg-orange-100" };
}

// Get display ranges for UI (returns formatted range string)
export function getDisplayRanges(
  biomarker: BloodPanelBiomarker,
  gender?: Gender
): { optimal: string; normal: string; hasGenderRange: boolean } {
  const range = getEffectiveRange(biomarker, gender);
  const hasGenderRange = hasGenderSpecificRanges(biomarker);

  const formatRange = (low: number, high: number) => {
    if (low === 0) return `< ${high}`;
    return `${low} - ${high}`;
  };

  return {
    optimal: formatRange(range.optimalLow, range.optimalHigh),
    normal: formatRange(range.normalLow, range.normalHigh),
    hasGenderRange,
  };
}
