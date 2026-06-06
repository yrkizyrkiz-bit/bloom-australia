// Blood Panel Configuration - Australian SI Units
// Based on Australian pathology standards and Sanative Health panels

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
      { id: "ldl_cholesterol", name: "LDL Cholesterol", shortName: "LDL", unit: "mmol/L", optimalLow: 0, optimalHigh: 2.5, normalLow: 0, normalHigh: 4.0, criticalHigh: 5.0 },
      {
        id: "hdl_cholesterol",
        name: "HDL Cholesterol",
        shortName: "HDL",
        unit: "mmol/L",
        optimalLow: 1.2, optimalHigh: 2.0, normalLow: 1.0, normalHigh: 2.5, criticalLow: 0.8,
        maleRange: { optimalLow: 1.0, optimalHigh: 1.8, normalLow: 0.9, normalHigh: 2.2, criticalLow: 0.7 },
        femaleRange: { optimalLow: 1.3, optimalHigh: 2.2, normalLow: 1.1, normalHigh: 2.7, criticalLow: 0.9 },
        note: "Women typically have higher HDL levels"
      },
      { id: "total_cholesterol", name: "Total Cholesterol", shortName: "TC", unit: "mmol/L", optimalLow: 3.5, optimalHigh: 5.2, normalLow: 3.0, normalHigh: 6.2, criticalHigh: 7.0 },
      { id: "triglycerides", name: "Triglycerides", shortName: "TG", unit: "mmol/L", optimalLow: 0, optimalHigh: 1.7, normalLow: 0, normalHigh: 2.3, criticalHigh: 5.0 },
      { id: "apob", name: "Apolipoprotein B", shortName: "ApoB", unit: "g/L", optimalLow: 0, optimalHigh: 0.9, normalLow: 0, normalHigh: 1.2, criticalHigh: 1.5 },
      { id: "lpa", name: "Lipoprotein(a)", shortName: "Lp(a)", unit: "nmol/L", optimalLow: 0, optimalHigh: 75, normalLow: 0, normalHigh: 125, criticalHigh: 200 },
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
    ]
  },
  metabolism: {
    name: "Metabolism",
    description: "Blood sugar & metabolic health",
    icon: Flame,
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    biomarkers: [
      { id: "hba1c", name: "HbA1c", shortName: "HbA1c", unit: "%", optimalLow: 4.0, optimalHigh: 5.4, normalLow: 4.0, normalHigh: 5.7, criticalHigh: 6.5 },
      { id: "glucose", name: "Fasting Glucose", shortName: "Gluc", unit: "mmol/L", optimalLow: 3.9, optimalHigh: 5.5, normalLow: 3.5, normalHigh: 6.0, criticalHigh: 7.0 },
      { id: "insulin", name: "Fasting Insulin", shortName: "Ins", unit: "mIU/L", optimalLow: 2.0, optimalHigh: 8.0, normalLow: 2.0, normalHigh: 12.0, criticalHigh: 25.0 },
      { id: "homa_ir", name: "HOMA-IR", shortName: "HOMA", unit: "", optimalLow: 0, optimalHigh: 1.0, normalLow: 0, normalHigh: 2.5, criticalHigh: 4.0 },
      {
        id: "uric_acid",
        name: "Uric Acid",
        shortName: "UA",
        unit: "mmol/L",
        optimalLow: 0.20, optimalHigh: 0.40, normalLow: 0.15, normalHigh: 0.45, criticalHigh: 0.60,
        maleRange: { optimalLow: 0.24, optimalHigh: 0.42, normalLow: 0.20, normalHigh: 0.48, criticalHigh: 0.60 },
        femaleRange: { optimalLow: 0.16, optimalHigh: 0.36, normalLow: 0.14, normalHigh: 0.40, criticalHigh: 0.50 },
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
      { id: "tsh", name: "TSH", shortName: "TSH", unit: "mIU/L", optimalLow: 0.5, optimalHigh: 2.5, normalLow: 0.4, normalHigh: 4.0, criticalLow: 0.1, criticalHigh: 10.0 },
      { id: "free_t4", name: "Free T4", shortName: "fT4", unit: "pmol/L", optimalLow: 12.0, optimalHigh: 18.0, normalLow: 10.0, normalHigh: 22.0, criticalLow: 8.0, criticalHigh: 28.0 },
      { id: "free_t3", name: "Free T3", shortName: "fT3", unit: "pmol/L", optimalLow: 4.0, optimalHigh: 5.5, normalLow: 3.5, normalHigh: 6.5, criticalLow: 2.5, criticalHigh: 8.0 },
      { id: "reverse_t3", name: "Reverse T3", shortName: "rT3", unit: "pmol/L", optimalLow: 0.14, optimalHigh: 0.35, normalLow: 0.10, normalHigh: 0.45, criticalHigh: 0.60 },
      { id: "tpo_antibodies", name: "TPO Antibodies", shortName: "TPO-Ab", unit: "IU/mL", optimalLow: 0, optimalHigh: 35, normalLow: 0, normalHigh: 60, criticalHigh: 500 },
      { id: "tg_antibodies", name: "Thyroglobulin Antibodies", shortName: "TG-Ab", unit: "IU/mL", optimalLow: 0, optimalHigh: 40, normalLow: 0, normalHigh: 115, criticalHigh: 500 },
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
        optimalLow: 12.0, optimalHigh: 25.0, normalLow: 10.0, normalHigh: 30.0, criticalLow: 7.0, criticalHigh: 35.0,
        maleRange: { optimalLow: 14.0, optimalHigh: 28.0, normalLow: 11.0, normalHigh: 32.0, criticalLow: 8.0, criticalHigh: 38.0 },
        femaleRange: { optimalLow: 10.0, optimalHigh: 24.0, normalLow: 8.0, normalHigh: 28.0, criticalLow: 5.0, criticalHigh: 32.0 },
        note: "Women may have lower levels due to menstruation"
      },
      {
        id: "ferritin",
        name: "Ferritin",
        shortName: "Ferritin",
        unit: "µg/L",
        optimalLow: 50, optimalHigh: 150, normalLow: 20, normalHigh: 300, criticalLow: 12,
        maleRange: { optimalLow: 60, optimalHigh: 200, normalLow: 30, normalHigh: 400, criticalLow: 20 },
        femaleRange: { optimalLow: 30, optimalHigh: 120, normalLow: 15, normalHigh: 200, criticalLow: 10 },
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
      { id: "magnesium", name: "Magnesium", shortName: "Mg", unit: "mmol/L", optimalLow: 0.85, optimalHigh: 1.00, normalLow: 0.70, normalHigh: 1.10, criticalLow: 0.50 },
      { id: "zinc", name: "Zinc", shortName: "Zn", unit: "µmol/L", optimalLow: 12.0, optimalHigh: 18.0, normalLow: 10.0, normalHigh: 22.0, criticalLow: 8.0 },
      { id: "selenium", name: "Selenium", shortName: "Se", unit: "µmol/L", optimalLow: 1.0, optimalHigh: 1.5, normalLow: 0.8, normalHigh: 2.0, criticalLow: 0.6 },
      { id: "copper", name: "Copper", shortName: "Cu", unit: "µmol/L", optimalLow: 12.0, optimalHigh: 20.0, normalLow: 10.0, normalHigh: 25.0 },
      { id: "iodine", name: "Iodine (Urinary)", shortName: "Iodine", unit: "µg/L", optimalLow: 100, optimalHigh: 199, normalLow: 50, normalHigh: 300, criticalLow: 20 },
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
        optimalLow: 10, optimalHigh: 30, normalLow: 5, normalHigh: 45, criticalHigh: 100,
        maleRange: { optimalLow: 10, optimalHigh: 35, normalLow: 5, normalHigh: 50, criticalHigh: 120 },
        femaleRange: { optimalLow: 7, optimalHigh: 28, normalLow: 5, normalHigh: 40, criticalHigh: 90 },
        note: "Men typically have slightly higher ALT"
      },
      {
        id: "ast",
        name: "AST (SGOT)",
        shortName: "AST",
        unit: "U/L",
        optimalLow: 10, optimalHigh: 30, normalLow: 5, normalHigh: 40, criticalHigh: 100,
        maleRange: { optimalLow: 10, optimalHigh: 35, normalLow: 5, normalHigh: 45, criticalHigh: 110 },
        femaleRange: { optimalLow: 8, optimalHigh: 28, normalLow: 5, normalHigh: 35, criticalHigh: 85 }
      },
      {
        id: "ggt",
        name: "GGT",
        shortName: "GGT",
        unit: "U/L",
        optimalLow: 10, optimalHigh: 30, normalLow: 5, normalHigh: 50, criticalHigh: 100,
        maleRange: { optimalLow: 10, optimalHigh: 40, normalLow: 5, normalHigh: 65, criticalHigh: 150 },
        femaleRange: { optimalLow: 8, optimalHigh: 28, normalLow: 5, normalHigh: 40, criticalHigh: 90 },
        note: "Men typically have higher GGT levels"
      },
      { id: "alp", name: "Alkaline Phosphatase", shortName: "ALP", unit: "U/L", optimalLow: 40, optimalHigh: 100, normalLow: 30, normalHigh: 130, criticalHigh: 300 },
      { id: "bilirubin_total", name: "Total Bilirubin", shortName: "T.Bil", unit: "µmol/L", optimalLow: 3, optimalHigh: 17, normalLow: 2, normalHigh: 21, criticalHigh: 50 },
      { id: "bilirubin_direct", name: "Direct Bilirubin", shortName: "D.Bil", unit: "µmol/L", optimalLow: 0, optimalHigh: 5, normalLow: 0, normalHigh: 8, criticalHigh: 20 },
      { id: "albumin", name: "Albumin", shortName: "Alb", unit: "g/L", optimalLow: 38, optimalHigh: 48, normalLow: 35, normalHigh: 50, criticalLow: 30 },
      { id: "total_protein", name: "Total Protein", shortName: "TP", unit: "g/L", optimalLow: 64, optimalHigh: 78, normalLow: 60, normalHigh: 83, criticalLow: 50, criticalHigh: 95 },
      { id: "globulin", name: "Globulin", shortName: "Glob", unit: "g/L", optimalLow: 23, optimalHigh: 35, normalLow: 20, normalHigh: 40, criticalHigh: 50 },
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
        optimalLow: 60, optimalHigh: 90, normalLow: 50, normalHigh: 110, criticalHigh: 150,
        maleRange: { optimalLow: 65, optimalHigh: 100, normalLow: 55, normalHigh: 120, criticalHigh: 170 },
        femaleRange: { optimalLow: 50, optimalHigh: 85, normalLow: 45, normalHigh: 100, criticalHigh: 130 },
        note: "Men have higher creatinine due to greater muscle mass"
      },
      { id: "egfr", name: "eGFR", shortName: "eGFR", unit: "mL/min/1.73m²", optimalLow: 90, optimalHigh: 120, normalLow: 60, normalHigh: 120, criticalLow: 30 },
      { id: "bun", name: "Urea", shortName: "Urea", unit: "mmol/L", optimalLow: 2.5, optimalHigh: 6.5, normalLow: 2.0, normalHigh: 8.0, criticalHigh: 15.0 },
      {
        id: "cystatin_c",
        name: "Cystatin C",
        shortName: "CysC",
        unit: "mg/L",
        optimalLow: 0.55, optimalHigh: 0.90, normalLow: 0.50, normalHigh: 1.00, criticalHigh: 1.50,
        maleRange: { optimalLow: 0.60, optimalHigh: 0.95, normalLow: 0.52, normalHigh: 1.05, criticalHigh: 1.55 },
        femaleRange: { optimalLow: 0.50, optimalHigh: 0.85, normalLow: 0.45, normalHigh: 0.95, criticalHigh: 1.40 }
      },
      { id: "uacr", name: "Urine Albumin/Creatinine", shortName: "UACR", unit: "mg/mmol", optimalLow: 0, optimalHigh: 2.5, normalLow: 0, normalHigh: 3.5, criticalHigh: 30 },
      { id: "sodium", name: "Sodium", shortName: "Na", unit: "mmol/L", optimalLow: 136, optimalHigh: 142, normalLow: 135, normalHigh: 145, criticalLow: 130, criticalHigh: 150 },
      { id: "potassium", name: "Potassium", shortName: "K", unit: "mmol/L", optimalLow: 3.8, optimalHigh: 4.8, normalLow: 3.5, normalHigh: 5.2, criticalLow: 3.0, criticalHigh: 6.0 },
      { id: "chloride", name: "Chloride", shortName: "Cl", unit: "mmol/L", optimalLow: 98, optimalHigh: 106, normalLow: 96, normalHigh: 108, criticalLow: 90, criticalHigh: 115 },
      { id: "bicarbonate", name: "Bicarbonate", shortName: "HCO3", unit: "mmol/L", optimalLow: 22, optimalHigh: 28, normalLow: 20, normalHigh: 30, criticalLow: 15, criticalHigh: 35 },
    ]
  },
  blood: {
    name: "Complete Blood Count",
    description: "Blood cell markers",
    icon: Droplet,
    color: "#dc2626",
    bgColor: "bg-red-600/10",
    biomarkers: [
      { id: "wbc", name: "White Blood Cells", shortName: "WBC", unit: "×10⁹/L", optimalLow: 4.0, optimalHigh: 8.0, normalLow: 3.5, normalHigh: 11.0, criticalLow: 2.0, criticalHigh: 15.0 },
      {
        id: "rbc",
        name: "Red Blood Cells",
        shortName: "RBC",
        unit: "×10¹²/L",
        optimalLow: 4.2, optimalHigh: 5.4, normalLow: 3.8, normalHigh: 5.8, criticalLow: 3.0, criticalHigh: 6.5,
        maleRange: { optimalLow: 4.5, optimalHigh: 5.5, normalLow: 4.2, normalHigh: 6.0, criticalLow: 3.5, criticalHigh: 6.8 },
        femaleRange: { optimalLow: 4.0, optimalHigh: 5.0, normalLow: 3.8, normalHigh: 5.5, criticalLow: 3.0, criticalHigh: 6.0 },
        note: "Men have higher RBC counts"
      },
      {
        id: "hemoglobin",
        name: "Hemoglobin",
        shortName: "Hgb",
        unit: "g/L",
        optimalLow: 130, optimalHigh: 160, normalLow: 120, normalHigh: 170, criticalLow: 100,
        maleRange: { optimalLow: 140, optimalHigh: 170, normalLow: 130, normalHigh: 180, criticalLow: 110 },
        femaleRange: { optimalLow: 120, optimalHigh: 150, normalLow: 115, normalHigh: 160, criticalLow: 90 },
        note: "Men have higher hemoglobin levels"
      },
      {
        id: "hematocrit",
        name: "Hematocrit",
        shortName: "Hct",
        unit: "%",
        optimalLow: 38, optimalHigh: 48, normalLow: 35, normalHigh: 52, criticalLow: 30,
        maleRange: { optimalLow: 40, optimalHigh: 50, normalLow: 38, normalHigh: 54, criticalLow: 32 },
        femaleRange: { optimalLow: 36, optimalHigh: 45, normalLow: 33, normalHigh: 48, criticalLow: 28 },
        note: "Men have higher hematocrit"
      },
      { id: "platelets", name: "Platelets", shortName: "Plt", unit: "×10⁹/L", optimalLow: 150, optimalHigh: 350, normalLow: 140, normalHigh: 400, criticalLow: 100, criticalHigh: 500 },
      { id: "mcv", name: "Mean Cell Volume", shortName: "MCV", unit: "fL", optimalLow: 80, optimalHigh: 95, normalLow: 76, normalHigh: 100, criticalLow: 70, criticalHigh: 110 },
      { id: "mch", name: "Mean Cell Hemoglobin", shortName: "MCH", unit: "pg", optimalLow: 27, optimalHigh: 32, normalLow: 25, normalHigh: 34, criticalLow: 22, criticalHigh: 38 },
      { id: "mchc", name: "Mean Cell Hgb Concentration", shortName: "MCHC", unit: "g/L", optimalLow: 320, optimalHigh: 350, normalLow: 310, normalHigh: 360, criticalLow: 290, criticalHigh: 380 },
      { id: "rdw", name: "Red Cell Distribution Width", shortName: "RDW", unit: "%", optimalLow: 11.5, optimalHigh: 14.0, normalLow: 11.0, normalHigh: 15.0, criticalHigh: 18.0 },
      { id: "neutrophils", name: "Neutrophils", shortName: "Neut", unit: "×10⁹/L", optimalLow: 2.0, optimalHigh: 6.0, normalLow: 1.5, normalHigh: 8.0, criticalLow: 1.0, criticalHigh: 12.0 },
      { id: "neutrophil_percent", name: "Neutrophil %", shortName: "Neut%", unit: "%", optimalLow: 40, optimalHigh: 70, normalLow: 35, normalHigh: 80, criticalLow: 20, criticalHigh: 90 },
      { id: "lymphocytes", name: "Lymphocytes", shortName: "Lymph", unit: "×10⁹/L", optimalLow: 1.0, optimalHigh: 3.5, normalLow: 0.8, normalHigh: 4.0, criticalLow: 0.5, criticalHigh: 6.0 },
      { id: "lymphocyte_percent", name: "Lymphocyte %", shortName: "Lymph%", unit: "%", optimalLow: 20, optimalHigh: 40, normalLow: 15, normalHigh: 45, criticalLow: 10, criticalHigh: 60 },
      { id: "monocytes", name: "Monocytes", shortName: "Mono", unit: "×10⁹/L", optimalLow: 0.2, optimalHigh: 0.8, normalLow: 0.1, normalHigh: 1.0, criticalHigh: 2.0 },
      { id: "monocyte_percent", name: "Monocyte %", shortName: "Mono%", unit: "%", optimalLow: 2, optimalHigh: 10, normalLow: 1, normalHigh: 15, criticalHigh: 20 },
      { id: "eosinophils", name: "Eosinophils", shortName: "Eos", unit: "×10⁹/L", optimalLow: 0, optimalHigh: 0.4, normalLow: 0, normalHigh: 0.6, criticalHigh: 1.5 },
      { id: "eosinophil_percent", name: "Eosinophil %", shortName: "Eos%", unit: "%", optimalLow: 1, optimalHigh: 5, normalLow: 0, normalHigh: 10, criticalHigh: 15 },
      { id: "basophils", name: "Basophils", shortName: "Baso", unit: "×10⁹/L", optimalLow: 0, optimalHigh: 0.1, normalLow: 0, normalHigh: 0.2, criticalHigh: 0.5 },
      { id: "basophil_percent", name: "Basophil %", shortName: "Baso%", unit: "%", optimalLow: 0, optimalHigh: 2, normalLow: 0, normalHigh: 3, criticalHigh: 5 },
    ]
  },
  inflammation: {
    name: "Inflammation & Stress",
    description: "Inflammatory markers",
    icon: Zap,
    color: "#f43f5e",
    bgColor: "bg-rose-500/10",
    biomarkers: [
      { id: "crp", name: "hs-CRP", shortName: "hsCRP", unit: "mg/L", optimalLow: 0, optimalHigh: 1.0, normalLow: 0, normalHigh: 3.0, criticalHigh: 10.0 },
      { id: "homocysteine", name: "Homocysteine", shortName: "Hcy", unit: "µmol/L", optimalLow: 5, optimalHigh: 10, normalLow: 4, normalHigh: 15, criticalHigh: 20 },
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
  const ids: string[] = [];
  for (const config of Object.values(bloodPanelConfig)) {
    for (const biomarker of config.biomarkers) {
      ids.push(biomarker.id);
    }
  }
  return ids;
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
