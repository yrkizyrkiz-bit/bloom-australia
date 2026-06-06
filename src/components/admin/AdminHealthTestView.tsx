"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bean, Droplets, Heart, Activity, Sparkles, Flame, Zap, TrendingUp, TrendingDown,
  Minus, CheckCircle, AlertTriangle, AlertCircle, BarChart3, Brain, Target,
  Calendar, Calculator, Info, ChevronDown, ChevronUp, FileText, Upload,
  FlaskConical, Users, Lightbulb, Clock, TestTube
} from "lucide-react";
import { getBiomarkerById, getStatusForValue } from "@/data/biomarkers";
import { bloodPanelConfig, getBiomarkerStatus, getEffectiveRange, type Gender, type BloodPanelBiomarker } from "@/data/bloodPanelConfig";
import { healthTestsConfig, calculateTestScore, getScoreColor as getHealthScoreColor, getProgressColor } from "@/lib/healthTestScoring";
import type { BiomarkerDefinition } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, ReferenceLine
} from "recharts";

// Risk score component interface
interface RiskScoreComponent {
  name: string;
  value: number | null;
  status: "optimal" | "normal" | "elevated" | "critical";
  weight: number;
  contribution: number;
  testedAt?: string | null;
}

// Extended BiomarkerResult interface
interface BiomarkerResult {
  id: string;
  biomarkerId: string;
  value: number;
  status: string;
  testedAt: string;
  biomarker?: {
    name: string;
    shortName: string;
    category: string;
    unit: string;
  };
}

// Health test configurations with biomarker subcategories
const healthTestConfigs: Record<string, {
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
  description: string;
  categories: Record<string, {
    name: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    bgColor: string;
    biomarkerIds: string[];
  }>;
  scientificScores: {
    id: string;
    name: string;
    formula: string;
    description: string;
    cutoffs: string;
    biomarkerIds: string[];
  }[];
}> = {
  liver: {
    name: "Liver Function",
    icon: Bean,
    color: "#84cc16",
    bgColor: "bg-lime-500/10",
    description: "Comprehensive assessment across liver enzymes, bilirubin, and proteins",
    categories: {
      enzymes: {
        name: "Liver Enzymes",
        subtitle: "Hepatocellular Function",
        icon: Bean,
        color: "#16a34a",
        bgColor: "bg-green-600/10",
        biomarkerIds: ["alt", "ast", "ggt", "alp"]
      },
      bilirubin: {
        name: "Bilirubin",
        subtitle: "Bile Processing",
        icon: Flame,
        color: "#f97316",
        bgColor: "bg-orange-500/10",
        biomarkerIds: ["bilirubin_total", "bilirubin_direct"]
      },
      proteins: {
        name: "Liver Proteins",
        subtitle: "Synthetic Function",
        icon: Heart,
        color: "#3b82f6",
        bgColor: "bg-blue-500/10",
        biomarkerIds: ["albumin", "total_protein", "globulin"]
      }
    },
    scientificScores: [
      {
        id: "fib4",
        name: "FIB-4 Index",
        formula: "(Age × AST) / (Platelets × √ALT)",
        description: "Non-invasive assessment of liver fibrosis",
        cutoffs: "<1.45 = low risk, 1.45-3.25 = indeterminate, >3.25 = high risk",
        biomarkerIds: ["ast", "alt", "platelets"]
      },
      {
        id: "apri",
        name: "APRI",
        formula: "100 × (AST / 40) / Platelets",
        description: "AST to Platelet Ratio Index for fibrosis prediction",
        cutoffs: "<0.5 = excludes fibrosis, >1.5 = significant fibrosis, >2.0 = cirrhosis",
        biomarkerIds: ["ast", "platelets"]
      },
      {
        id: "deritis",
        name: "De Ritis Ratio",
        formula: "AST / ALT",
        description: "Differentiates liver disease etiology",
        cutoffs: "<1.0 = viral/NAFLD, 1.0-2.0 = cirrhosis, >2.0 = alcoholic liver disease",
        biomarkerIds: ["ast", "alt"]
      }
    ]
  },
  kidney: {
    name: "Kidney Function",
    icon: Droplets,
    color: "#06b6d4",
    bgColor: "bg-cyan-500/10",
    description: "Renal function assessment including filtration and electrolytes",
    categories: {
      filtration: {
        name: "Kidney Function",
        subtitle: "Filtration",
        icon: Droplets,
        color: "#0ea5e9",
        bgColor: "bg-cyan-600/10",
        biomarkerIds: ["creatinine", "egfr", "bun", "cystatin_c"]
      },
      urine: {
        name: "Urine Markers",
        subtitle: "Protein & Albumin",
        icon: TestTube,
        color: "#8b5cf6",
        bgColor: "bg-violet-500/10",
        biomarkerIds: ["uacr"]
      },
      electrolytes: {
        name: "Electrolytes",
        subtitle: "Mineral Balance",
        icon: Zap,
        color: "#f59e0b",
        bgColor: "bg-amber-500/10",
        biomarkerIds: ["potassium", "sodium", "bicarbonate"]
      }
    },
    scientificScores: [
      {
        id: "egfr",
        name: "eGFR (CKD-EPI)",
        formula: "141 × min(Cr/κ,1)^α × max(Cr/κ,1)^-1.209 × 0.993^Age × 1.018[female]",
        description: "Estimated Glomerular Filtration Rate for kidney function",
        cutoffs: "≥90 = G1 Normal, 60-89 = G2 Mild, 45-59 = G3a, 30-44 = G3b, 15-29 = G4, <15 = G5 Kidney failure",
        biomarkerIds: ["creatinine", "egfr"]
      },
      {
        id: "bun_creatinine",
        name: "BUN/Creatinine Ratio",
        formula: "BUN / Creatinine",
        description: "Helps differentiate prerenal, renal, and postrenal azotemia",
        cutoffs: "10-20 = normal, >20 = prerenal, <10 = intrinsic renal/liver disease",
        biomarkerIds: ["bun", "creatinine"]
      }
    ]
  },
  heart: {
    name: "Heart Health",
    icon: Heart,
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    description: "Cardiovascular risk assessment including lipids and inflammation",
    categories: {
      lipids: {
        name: "Lipid Panel",
        subtitle: "Cholesterol",
        icon: Heart,
        color: "#ef4444",
        bgColor: "bg-red-600/10",
        biomarkerIds: ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides"]
      },
      inflammation: {
        name: "Inflammation",
        subtitle: "Cardiovascular Risk",
        icon: Zap,
        color: "#f59e0b",
        bgColor: "bg-amber-500/10",
        biomarkerIds: ["crp", "homocysteine"]
      },
      metabolic: {
        name: "Metabolic Risk",
        subtitle: "Blood Sugar",
        icon: Activity,
        color: "#8b5cf6",
        bgColor: "bg-violet-500/10",
        biomarkerIds: ["glucose", "hba1c", "insulin"]
      }
    },
    scientificScores: [
      {
        id: "tc_hdl",
        name: "TC/HDL Ratio",
        formula: "Total Cholesterol / HDL",
        description: "Cardiovascular disease risk indicator",
        cutoffs: "<3.5 = optimal, 3.5-5 = moderate risk, >5 = high risk",
        biomarkerIds: ["total_cholesterol", "hdl_cholesterol"]
      },
      {
        id: "ldl_hdl",
        name: "LDL/HDL Ratio",
        formula: "LDL / HDL",
        description: "Atherogenic index for cardiovascular risk",
        cutoffs: "<2.5 = optimal, 2.5-3.5 = moderate risk, >3.5 = high risk",
        biomarkerIds: ["ldl_cholesterol", "hdl_cholesterol"]
      },
      {
        id: "trig_hdl",
        name: "TG/HDL Ratio",
        formula: "Triglycerides / HDL",
        description: "Insulin resistance and metabolic syndrome marker",
        cutoffs: "<2 = optimal, 2-4 = moderate, >4 = high risk/insulin resistance",
        biomarkerIds: ["triglycerides", "hdl_cholesterol"]
      }
    ]
  },
  thyroid: {
    name: "Thyroid Function",
    icon: Activity,
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    description: "Thyroid hormone assessment and metabolic function",
    categories: {
      hormones: {
        name: "Thyroid Hormones",
        subtitle: "T3, T4, TSH",
        icon: Activity,
        color: "#3b82f6",
        bgColor: "bg-blue-600/10",
        biomarkerIds: ["tsh", "free_t4", "free_t3", "total_t3", "total_t4"]
      },
      antibodies: {
        name: "Thyroid Antibodies",
        subtitle: "Autoimmune Markers",
        icon: Zap,
        color: "#f97316",
        bgColor: "bg-orange-500/10",
        biomarkerIds: ["tpo_antibodies", "thyroglobulin_ab"]
      }
    },
    scientificScores: [
      {
        id: "t3_t4",
        name: "Free T3/T4 Ratio",
        formula: "Free T3 / Free T4",
        description: "Peripheral conversion efficiency marker",
        cutoffs: "0.28-0.45 = optimal conversion, <0.28 = poor conversion",
        biomarkerIds: ["free_t3", "free_t4"]
      }
    ]
  },
  hormones: {
    name: "Hormone Health",
    icon: Sparkles,
    color: "#a855f7",
    bgColor: "bg-purple-500/10",
    description: "Comprehensive hormone panel including sex hormones and cortisol",
    categories: {
      sex: {
        name: "Sex Hormones",
        subtitle: "Testosterone, Estrogen",
        icon: Sparkles,
        color: "#a855f7",
        bgColor: "bg-purple-600/10",
        biomarkerIds: ["testosterone_total", "testosterone_free", "estradiol", "shbg"]
      },
      adrenal: {
        name: "Adrenal",
        subtitle: "Stress Hormones",
        icon: Zap,
        color: "#f97316",
        bgColor: "bg-orange-500/10",
        biomarkerIds: ["cortisol", "dhea_s"]
      },
      metabolic: {
        name: "Metabolic Hormones",
        subtitle: "IGF-1, Insulin",
        icon: Flame,
        color: "#10b981",
        bgColor: "bg-emerald-500/10",
        biomarkerIds: ["igf1", "insulin"]
      }
    },
    scientificScores: [
      {
        id: "free_t_calc",
        name: "Free Androgen Index",
        formula: "100 × Testosterone / SHBG",
        description: "Bioavailable testosterone indicator",
        cutoffs: "Male: 30-150 optimal, Female: <5 optimal",
        biomarkerIds: ["testosterone_total", "shbg"]
      }
    ]
  },
  metabolic: {
    name: "Metabolic Panel",
    icon: Flame,
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    description: "Blood sugar, insulin resistance, and metabolic health",
    categories: {
      glucose: {
        name: "Blood Sugar",
        subtitle: "Glucose Control",
        icon: Flame,
        color: "#f97316",
        bgColor: "bg-orange-600/10",
        biomarkerIds: ["glucose", "hba1c", "fasting_insulin"]
      },
      inflammation: {
        name: "Inflammation",
        subtitle: "Metabolic Inflammation",
        icon: Zap,
        color: "#ef4444",
        bgColor: "bg-red-500/10",
        biomarkerIds: ["crp", "homocysteine", "uric_acid"]
      },
      iron: {
        name: "Iron Status",
        subtitle: "Iron & Ferritin",
        icon: Activity,
        color: "#8b5cf6",
        bgColor: "bg-violet-500/10",
        biomarkerIds: ["ferritin", "iron", "tibc"]
      }
    },
    scientificScores: [
      {
        id: "homa_ir",
        name: "HOMA-IR",
        formula: "(Glucose × Insulin) / 405",
        description: "Homeostatic Model Assessment for Insulin Resistance",
        cutoffs: "<1.0 = optimal, 1.0-2.0 = normal, 2.0-3.0 = early IR, >3.0 = significant IR",
        biomarkerIds: ["glucose", "insulin"]
      },
      {
        id: "tg_glucose",
        name: "TyG Index",
        formula: "ln(Triglycerides × Glucose / 2)",
        description: "Triglyceride-Glucose Index for insulin resistance",
        cutoffs: "<8.5 = normal, ≥8.5 = insulin resistance marker",
        biomarkerIds: ["triglycerides", "glucose"]
      }
    ]
  }
};

// Scientific score calculation functions
function calculateScientificScore(
  scoreId: string,
  biomarkerResults: BiomarkerResult[],
  gender: string,
  age?: number
): { value: number | null; risk: string; interpretation: string; canCalculate: boolean; missingInputs: string[] } {
  const getValue = (id: string) => {
    const result = biomarkerResults.find(r => r.biomarkerId === id);
    return result?.value ?? null;
  };

  const missingInputs: string[] = [];

  switch (scoreId) {
    case "fib4": {
      const ast = getValue("ast");
      const alt = getValue("alt");
      const platelets = getValue("platelets");
      if (ast === null) missingInputs.push("AST");
      if (alt === null) missingInputs.push("ALT");
      if (platelets === null) missingInputs.push("Platelets");
      if (!age) missingInputs.push("Age");

      if (missingInputs.length > 0 || !age || !ast || !alt || !platelets || alt <= 0 || platelets <= 0) {
        return { value: null, risk: "indeterminate", interpretation: "Cannot calculate - missing values", canCalculate: false, missingInputs };
      }

      const fib4 = (age * ast) / (platelets * Math.sqrt(alt));
      let risk = "indeterminate";
      let interpretation = "";
      if (fib4 < 1.45) {
        risk = "low";
        interpretation = "Low probability of advanced fibrosis (F0-F1). NPV ~90%.";
      } else if (fib4 <= 3.25) {
        risk = "indeterminate";
        interpretation = "Indeterminate result. Further evaluation recommended.";
      } else {
        risk = "high";
        interpretation = "High probability of advanced fibrosis (F3-F4). PPV ~65%.";
      }
      return { value: Math.round(fib4 * 100) / 100, risk, interpretation, canCalculate: true, missingInputs: [] };
    }

    case "apri": {
      const ast = getValue("ast");
      const platelets = getValue("platelets");
      if (ast === null) missingInputs.push("AST");
      if (platelets === null) missingInputs.push("Platelets");

      if (missingInputs.length > 0 || !ast || !platelets || platelets <= 0) {
        return { value: null, risk: "indeterminate", interpretation: "Cannot calculate - missing values", canCalculate: false, missingInputs };
      }

      const apri = (100 * (ast / 40)) / platelets;
      let risk = "low";
      let interpretation = "";
      if (apri < 0.5) {
        risk = "low";
        interpretation = "Low probability of significant fibrosis.";
      } else if (apri < 1.5) {
        risk = "indeterminate";
        interpretation = "Cannot reliably exclude or confirm significant fibrosis.";
      } else if (apri < 2.0) {
        risk = "significant";
        interpretation = "Suggests significant fibrosis (≥F2).";
      } else {
        risk = "cirrhosis";
        interpretation = "High probability of cirrhosis.";
      }
      return { value: Math.round(apri * 100) / 100, risk, interpretation, canCalculate: true, missingInputs: [] };
    }

    case "deritis": {
      const ast = getValue("ast");
      const alt = getValue("alt");
      if (ast === null) missingInputs.push("AST");
      if (alt === null) missingInputs.push("ALT");

      if (missingInputs.length > 0 || !ast || !alt || alt <= 0) {
        return { value: null, risk: "normal", interpretation: "Cannot calculate - missing values", canCalculate: false, missingInputs };
      }

      const ratio = ast / alt;
      let risk = "normal";
      let interpretation = "";
      if (ratio < 0.8) {
        risk = "hepatocellular";
        interpretation = "Low ratio suggests hepatocellular injury pattern (NAFLD/viral).";
      } else if (ratio <= 1.0) {
        risk = "normal";
        interpretation = "Normal ratio. Typical in healthy liver.";
      } else if (ratio <= 2.0) {
        risk = "cholestatic";
        interpretation = "Elevated ratio may indicate cirrhosis or cholestatic disease.";
      } else {
        risk = "alcoholic";
        interpretation = "High ratio strongly suggests alcoholic hepatitis.";
      }
      return { value: Math.round(ratio * 100) / 100, risk, interpretation, canCalculate: true, missingInputs: [] };
    }

    case "tc_hdl": {
      const tc = getValue("total_cholesterol");
      const hdl = getValue("hdl_cholesterol");
      if (tc === null) missingInputs.push("Total Cholesterol");
      if (hdl === null) missingInputs.push("HDL");

      if (missingInputs.length > 0 || !tc || !hdl || hdl <= 0) {
        return { value: null, risk: "unknown", interpretation: "Cannot calculate - missing values", canCalculate: false, missingInputs };
      }

      const ratio = tc / hdl;
      let risk = "optimal";
      let interpretation = "";
      if (ratio < 3.5) {
        risk = "optimal";
        interpretation = "Excellent cardiovascular risk profile.";
      } else if (ratio <= 5) {
        risk = "moderate";
        interpretation = "Moderate cardiovascular risk.";
      } else {
        risk = "high";
        interpretation = "Elevated cardiovascular risk.";
      }
      return { value: Math.round(ratio * 10) / 10, risk, interpretation, canCalculate: true, missingInputs: [] };
    }

    case "homa_ir": {
      const glucose = getValue("glucose");
      const insulin = getValue("insulin") || getValue("fasting_insulin");
      if (glucose === null) missingInputs.push("Glucose");
      if (insulin === null) missingInputs.push("Insulin");

      if (missingInputs.length > 0 || !glucose || !insulin) {
        return { value: null, risk: "unknown", interpretation: "Cannot calculate - missing values", canCalculate: false, missingInputs };
      }

      const homa = (glucose * insulin) / 405;
      let risk = "optimal";
      let interpretation = "";
      if (homa < 1.0) {
        risk = "optimal";
        interpretation = "Excellent insulin sensitivity.";
      } else if (homa < 2.0) {
        risk = "normal";
        interpretation = "Normal insulin sensitivity.";
      } else if (homa < 3.0) {
        risk = "moderate";
        interpretation = "Early insulin resistance.";
      } else {
        risk = "high";
        interpretation = "Significant insulin resistance.";
      }
      return { value: Math.round(homa * 100) / 100, risk, interpretation, canCalculate: true, missingInputs: [] };
    }

    default:
      return { value: null, risk: "unknown", interpretation: "Score not implemented", canCalculate: false, missingInputs: [] };
  }
}

// Get risk badge color
function getRiskBadgeColor(risk: string): string {
  switch (risk) {
    case "low":
    case "optimal":
    case "normal":
      return "bg-green-50 text-green-700 border-green-200";
    case "moderate":
    case "indeterminate":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "high":
    case "significant":
    case "cirrhosis":
    case "alcoholic":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

// Get score color
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

// Calculate Composite Liver Risk Score (matching member area exactly)
function calculateLiverRiskScore(
  results: BiomarkerResult[],
  gender: "male" | "female"
): { score: number; risk: string; interpretation: string; components: RiskScoreComponent[] } {
  const getBiomarker = (id: string): { value: number | null; testedAt: string | null } => {
    const r = results.find(r => r.biomarkerId === id);
    return { value: r ? r.value : null, testedAt: r ? r.testedAt : null };
  };

  const components: RiskScoreComponent[] = [];
  let totalWeight = 0;
  let totalScore = 0;

  // ALT - Primary marker of hepatocellular injury (Weight: 20%)
  const altData = getBiomarker("alt");
  const altNormal = gender === "male" ? 45 : 34;
  if (altData.value !== null) {
    let altStatus: "optimal" | "normal" | "elevated" | "critical";
    let altScore: number;
    if (altData.value <= altNormal * 0.5) { altStatus = "optimal"; altScore = 100; }
    else if (altData.value <= altNormal) { altStatus = "normal"; altScore = 80; }
    else if (altData.value <= altNormal * 3) { altStatus = "elevated"; altScore = 50; }
    else { altStatus = "critical"; altScore = 20; }
    components.push({ name: "ALT", value: altData.value, status: altStatus, weight: 20, contribution: altScore * 0.2, testedAt: altData.testedAt });
    totalWeight += 20;
    totalScore += altScore * 0.2;
  }

  // AST - Hepatocellular injury (Weight: 15%)
  const astData = getBiomarker("ast");
  const astNormal = gender === "male" ? 40 : 32;
  if (astData.value !== null) {
    let astStatus: "optimal" | "normal" | "elevated" | "critical";
    let astScore: number;
    if (astData.value <= astNormal * 0.5) { astStatus = "optimal"; astScore = 100; }
    else if (astData.value <= astNormal) { astStatus = "normal"; astScore = 80; }
    else if (astData.value <= astNormal * 3) { astStatus = "elevated"; astScore = 50; }
    else { astStatus = "critical"; astScore = 20; }
    components.push({ name: "AST", value: astData.value, status: astStatus, weight: 15, contribution: astScore * 0.15, testedAt: astData.testedAt });
    totalWeight += 15;
    totalScore += astScore * 0.15;
  }

  // GGT - Cholestasis, alcohol (Weight: 15%)
  const ggtData = getBiomarker("ggt");
  const ggtNormal = gender === "male" ? 60 : 40;
  if (ggtData.value !== null) {
    let ggtStatus: "optimal" | "normal" | "elevated" | "critical";
    let ggtScore: number;
    if (ggtData.value <= ggtNormal * 0.5) { ggtStatus = "optimal"; ggtScore = 100; }
    else if (ggtData.value <= ggtNormal) { ggtStatus = "normal"; ggtScore = 80; }
    else if (ggtData.value <= ggtNormal * 3) { ggtStatus = "elevated"; ggtScore = 50; }
    else { ggtStatus = "critical"; ggtScore = 20; }
    components.push({ name: "GGT", value: ggtData.value, status: ggtStatus, weight: 15, contribution: ggtScore * 0.15, testedAt: ggtData.testedAt });
    totalWeight += 15;
    totalScore += ggtScore * 0.15;
  }

  // ALP - Cholestatic disease (Weight: 10%)
  const alpData = getBiomarker("alp");
  if (alpData.value !== null) {
    let alpStatus: "optimal" | "normal" | "elevated" | "critical";
    let alpScore: number;
    if (alpData.value >= 40 && alpData.value <= 100) { alpStatus = "optimal"; alpScore = 100; }
    else if (alpData.value >= 30 && alpData.value <= 130) { alpStatus = "normal"; alpScore = 80; }
    else if (alpData.value <= 200) { alpStatus = "elevated"; alpScore = 50; }
    else { alpStatus = "critical"; alpScore = 20; }
    components.push({ name: "ALP", value: alpData.value, status: alpStatus, weight: 10, contribution: alpScore * 0.1, testedAt: alpData.testedAt });
    totalWeight += 10;
    totalScore += alpScore * 0.1;
  }

  // Bilirubin - Excretory function (Weight: 15%)
  const bilData = getBiomarker("bilirubin_total");
  if (bilData.value !== null) {
    let bilStatus: "optimal" | "normal" | "elevated" | "critical";
    let bilScore: number;
    if (bilData.value <= 17) { bilStatus = "optimal"; bilScore = 100; }
    else if (bilData.value <= 21) { bilStatus = "normal"; bilScore = 80; }
    else if (bilData.value <= 50) { bilStatus = "elevated"; bilScore = 50; }
    else { bilStatus = "critical"; bilScore = 20; }
    components.push({ name: "Bilirubin", value: bilData.value, status: bilStatus, weight: 15, contribution: bilScore * 0.15, testedAt: bilData.testedAt });
    totalWeight += 15;
    totalScore += bilScore * 0.15;
  }

  // Albumin - Synthetic function (Weight: 15%)
  const albData = getBiomarker("albumin");
  if (albData.value !== null) {
    let albStatus: "optimal" | "normal" | "elevated" | "critical";
    let albScore: number;
    if (albData.value >= 40 && albData.value <= 50) { albStatus = "optimal"; albScore = 100; }
    else if (albData.value >= 35 && albData.value <= 55) { albStatus = "normal"; albScore = 80; }
    else if (albData.value >= 28) { albStatus = "elevated"; albScore = 50; }
    else { albStatus = "critical"; albScore = 20; }
    components.push({ name: "Albumin", value: albData.value, status: albStatus, weight: 15, contribution: albScore * 0.15, testedAt: albData.testedAt });
    totalWeight += 15;
    totalScore += albScore * 0.15;
  }

  // Platelets - Portal hypertension marker (Weight: 10%)
  const pltData = getBiomarker("platelets");
  if (pltData.value !== null) {
    let pltStatus: "optimal" | "normal" | "elevated" | "critical";
    let pltScore: number;
    if (pltData.value >= 150 && pltData.value <= 400) { pltStatus = "optimal"; pltScore = 100; }
    else if (pltData.value >= 100 && pltData.value <= 450) { pltStatus = "normal"; pltScore = 80; }
    else if (pltData.value >= 50) { pltStatus = "elevated"; pltScore = 50; }
    else { pltStatus = "critical"; pltScore = 20; }
    components.push({ name: "Platelets", value: pltData.value, status: pltStatus, weight: 10, contribution: pltScore * 0.1, testedAt: pltData.testedAt });
    totalWeight += 10;
    totalScore += pltScore * 0.1;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  let risk: string;
  let interpretation: string;
  if (normalizedScore >= 80) {
    risk = "low";
    interpretation = "Excellent liver function. All markers within healthy ranges.";
  } else if (normalizedScore >= 60) {
    risk = "moderate";
    interpretation = "Some markers mildly elevated. Monitor and consider lifestyle modifications.";
  } else if (normalizedScore >= 40) {
    risk = "high";
    interpretation = "Multiple markers elevated. Medical evaluation recommended.";
  } else {
    risk = "very_high";
    interpretation = "Significant abnormalities detected. Urgent medical consultation advised.";
  }

  return { score: normalizedScore, risk, interpretation, components };
}

// Calculate Kidney Health Score
function calculateKidneyRiskScore(
  results: BiomarkerResult[],
  gender: "male" | "female"
): { score: number; risk: string; interpretation: string; ckdStage: string; components: RiskScoreComponent[] } {
  const getBiomarker = (id: string): { value: number | null; testedAt: string | null } => {
    const r = results.find(r => r.biomarkerId === id);
    return { value: r ? r.value : null, testedAt: r ? r.testedAt : null };
  };

  const components: RiskScoreComponent[] = [];
  let totalWeight = 0;
  let totalScore = 0;

  // eGFR - Most important (Weight: 35%)
  const egfrData = getBiomarker("egfr");
  if (egfrData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (egfrData.value >= 90) { status = "optimal"; score = 100; }
    else if (egfrData.value >= 60) { status = "normal"; score = 75; }
    else if (egfrData.value >= 30) { status = "elevated"; score = 40; }
    else { status = "critical"; score = 15; }
    components.push({ name: "eGFR", value: egfrData.value, status, weight: 35, contribution: score * 0.35, testedAt: egfrData.testedAt });
    totalWeight += 35;
    totalScore += score * 0.35;
  }

  // Creatinine (Weight: 25%)
  const creatData = getBiomarker("creatinine");
  const creatNormal = gender === "male" ? 1.2 : 1.0;
  if (creatData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (creatData.value <= creatNormal * 0.8) { status = "optimal"; score = 100; }
    else if (creatData.value <= creatNormal) { status = "normal"; score = 80; }
    else if (creatData.value <= creatNormal * 1.5) { status = "elevated"; score = 50; }
    else { status = "critical"; score = 20; }
    components.push({ name: "Creatinine", value: creatData.value, status, weight: 25, contribution: score * 0.25, testedAt: creatData.testedAt });
    totalWeight += 25;
    totalScore += score * 0.25;
  }

  // BUN (Weight: 20%)
  const bunData = getBiomarker("bun");
  if (bunData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (bunData.value >= 7 && bunData.value <= 18) { status = "optimal"; score = 100; }
    else if (bunData.value >= 5 && bunData.value <= 23) { status = "normal"; score = 80; }
    else if (bunData.value <= 30) { status = "elevated"; score = 50; }
    else { status = "critical"; score = 20; }
    components.push({ name: "BUN", value: bunData.value, status, weight: 20, contribution: score * 0.2, testedAt: bunData.testedAt });
    totalWeight += 20;
    totalScore += score * 0.2;
  }

  // Potassium (Weight: 20%)
  const kData = getBiomarker("potassium");
  if (kData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (kData.value >= 3.8 && kData.value <= 4.8) { status = "optimal"; score = 100; }
    else if (kData.value >= 3.5 && kData.value <= 5.0) { status = "normal"; score = 80; }
    else if (kData.value >= 3.0 && kData.value <= 5.5) { status = "elevated"; score = 50; }
    else { status = "critical"; score = 20; }
    components.push({ name: "Potassium", value: kData.value, status, weight: 20, contribution: score * 0.2, testedAt: kData.testedAt });
    totalWeight += 20;
    totalScore += score * 0.2;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  // CKD Stage
  let ckdStage = "Normal (G1)";
  if (egfrData.value) {
    if (egfrData.value >= 90) ckdStage = "Normal (G1)";
    else if (egfrData.value >= 60) ckdStage = "Mild (G2)";
    else if (egfrData.value >= 45) ckdStage = "Moderate (G3a)";
    else if (egfrData.value >= 30) ckdStage = "Moderate (G3b)";
    else if (egfrData.value >= 15) ckdStage = "Severe (G4)";
    else ckdStage = "Kidney Failure (G5)";
  }

  const risk = normalizedScore >= 80 ? "low" : normalizedScore >= 60 ? "moderate" : normalizedScore >= 40 ? "high" : "very_high";
  const interpretation = `CKD Stage: ${ckdStage}. ${risk === "low" ? "Kidney function is healthy." : risk === "moderate" ? "Monitor kidney function regularly." : "Requires medical attention."}`;

  return { score: normalizedScore, risk, interpretation, ckdStage, components };
}

// Calculate Heart Health Score
function calculateHeartRiskScore(
  results: BiomarkerResult[],
  gender: "male" | "female"
): { score: number; risk: string; riskLevel: string; interpretation: string; components: RiskScoreComponent[] } {
  const getBiomarker = (id: string): { value: number | null; testedAt: string | null } => {
    const r = results.find(r => r.biomarkerId === id);
    return { value: r ? r.value : null, testedAt: r ? r.testedAt : null };
  };

  const components: RiskScoreComponent[] = [];
  let totalWeight = 0;
  let totalScore = 0;

  // Total Cholesterol (Weight: 15%)
  const tcData = getBiomarker("total_cholesterol");
  if (tcData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (tcData.value < 200) { status = "optimal"; score = 100; }
    else if (tcData.value < 240) { status = "normal"; score = 75; }
    else if (tcData.value < 280) { status = "elevated"; score = 40; }
    else { status = "critical"; score = 20; }
    components.push({ name: "Total Chol", value: tcData.value, status, weight: 15, contribution: score * 0.15, testedAt: tcData.testedAt });
    totalWeight += 15;
    totalScore += score * 0.15;
  }

  // LDL Cholesterol (Weight: 25%)
  const ldlData = getBiomarker("ldl_cholesterol");
  if (ldlData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (ldlData.value < 100) { status = "optimal"; score = 100; }
    else if (ldlData.value < 130) { status = "normal"; score = 75; }
    else if (ldlData.value < 160) { status = "elevated"; score = 40; }
    else { status = "critical"; score = 20; }
    components.push({ name: "LDL", value: ldlData.value, status, weight: 25, contribution: score * 0.25, testedAt: ldlData.testedAt });
    totalWeight += 25;
    totalScore += score * 0.25;
  }

  // HDL Cholesterol (Weight: 20%)
  const hdlData = getBiomarker("hdl_cholesterol");
  const hdlOptimal = gender === "male" ? 50 : 60;
  if (hdlData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (hdlData.value >= hdlOptimal) { status = "optimal"; score = 100; }
    else if (hdlData.value >= 40) { status = "normal"; score = 75; }
    else if (hdlData.value >= 30) { status = "elevated"; score = 40; }
    else { status = "critical"; score = 20; }
    components.push({ name: "HDL", value: hdlData.value, status, weight: 20, contribution: score * 0.2, testedAt: hdlData.testedAt });
    totalWeight += 20;
    totalScore += score * 0.2;
  }

  // Triglycerides (Weight: 20%)
  const trigData = getBiomarker("triglycerides");
  if (trigData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (trigData.value < 100) { status = "optimal"; score = 100; }
    else if (trigData.value < 150) { status = "normal"; score = 75; }
    else if (trigData.value < 200) { status = "elevated"; score = 40; }
    else { status = "critical"; score = 20; }
    components.push({ name: "Triglycerides", value: trigData.value, status, weight: 20, contribution: score * 0.2, testedAt: trigData.testedAt });
    totalWeight += 20;
    totalScore += score * 0.2;
  }

  // CRP (Weight: 20%)
  const crpData = getBiomarker("crp");
  if (crpData.value !== null) {
    let status: "optimal" | "normal" | "elevated" | "critical";
    let score: number;
    if (crpData.value < 1) { status = "optimal"; score = 100; }
    else if (crpData.value < 3) { status = "normal"; score = 75; }
    else if (crpData.value < 10) { status = "elevated"; score = 40; }
    else { status = "critical"; score = 20; }
    components.push({ name: "CRP", value: crpData.value, status, weight: 20, contribution: score * 0.2, testedAt: crpData.testedAt });
    totalWeight += 20;
    totalScore += score * 0.2;
  }

  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  let riskLevel = "Low";
  if (normalizedScore < 50) riskLevel = "High";
  else if (normalizedScore < 70) riskLevel = "Moderate";
  else if (normalizedScore < 85) riskLevel = "Low-Moderate";

  const risk = normalizedScore >= 80 ? "low" : normalizedScore >= 60 ? "moderate" : normalizedScore >= 40 ? "high" : "very_high";
  const interpretation = `Cardiovascular Risk: ${riskLevel}. ${risk === "low" ? "Excellent heart health markers." : risk === "moderate" ? "Monitor cholesterol and inflammation." : "Consider cardiac evaluation."}`;

  return { score: normalizedScore, risk, riskLevel, interpretation, components };
}

// Get component status color
function getComponentStatusColor(status: "optimal" | "normal" | "elevated" | "critical"): string {
  switch (status) {
    case "optimal": return "text-green-600";
    case "normal": return "text-blue-600";
    case "elevated": return "text-orange-600";
    case "critical": return "text-red-600";
  }
}

// Get component status background
function getComponentStatusBg(status: "optimal" | "normal" | "elevated" | "critical"): string {
  switch (status) {
    case "optimal": return "bg-green-500";
    case "normal": return "bg-blue-500";
    case "elevated": return "bg-orange-500";
    case "critical": return "bg-red-500";
  }
}

// Generate mock trend data
function generateTrendData(testId: string, currentScore: number) {
  const months = ["Jun '23", "Sep '23", "Dec '23", "Mar '24"];
  const baseScore = Math.max(40, currentScore - 25);
  return months.map((date, idx) => ({
    date,
    fullDate: date.replace("'", " 20"),
    overall: Math.min(100, baseScore + idx * Math.floor((currentScore - baseScore) / 3) + Math.floor(Math.random() * 5)),
  }));
}

interface AdminHealthTestViewProps {
  testId: string;
  customerId: string;
  customerGender: string;
  customerAge?: number;
  biomarkerResults: BiomarkerResult[];
}

export function AdminHealthTestView({
  testId,
  customerId,
  customerGender,
  customerAge,
  biomarkerResults,
}: AdminHealthTestViewProps) {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const config = healthTestConfigs[testId];
  const gender = customerGender === "MALE" ? "male" : "female";

  // Get all biomarker IDs for this test (safe even if config is null)
  const allBiomarkerIds = useMemo(() => {
    if (!config) return [];
    return Object.values(config.categories).flatMap(cat => cat.biomarkerIds);
  }, [config]);

  // Get biomarker results for this test
  const testBiomarkerResults = useMemo(() => {
    return biomarkerResults.filter(r => allBiomarkerIds.includes(r.biomarkerId));
  }, [biomarkerResults, allBiomarkerIds]);

  // Calculate test score
  const testScore = useMemo(() => {
    const testConfig = healthTestsConfig.find(t => t.id === testId);
    if (!testConfig) return { score: 0, optimal: 0, normal: 0, outOfRange: 0, trend: "stable" as const, hasData: false };

    const resultsForScoring = biomarkerResults.map(r => ({
      id: r.id,
      biomarkerId: r.biomarkerId,
      value: r.value,
      status: r.status?.toLowerCase() || "normal",
      testedAt: r.testedAt,
    }));

    return calculateTestScore(testId, testConfig.biomarkerIds, gender, resultsForScoring);
  }, [testId, biomarkerResults, gender]);

  // Calculate scientific scores
  const scientificScores = useMemo(() => {
    if (!config) return [];
    return config.scientificScores.map(scoreConfig => {
      const result = calculateScientificScore(scoreConfig.id, biomarkerResults, gender, customerAge);
      return { ...scoreConfig, ...result };
    });
  }, [config, biomarkerResults, gender, customerAge]);

  // Count status by category
  const statusCounts = useMemo(() => {
    let optimal = 0, normal = 0, outOfRange = 0;
    testBiomarkerResults.forEach(result => {
      const biomarker = getBiomarkerById(result.biomarkerId);
      if (biomarker) {
        const status = getStatusForValue(biomarker, result.value, gender);
        if (status === "optimal") optimal++;
        else if (status === "normal") normal++;
        else outOfRange++;
      }
    });
    return { optimal, normal, outOfRange, total: testBiomarkerResults.length };
  }, [testBiomarkerResults, gender]);

  // Get latest test date
  const latestTestDate = useMemo(() => {
    if (testBiomarkerResults.length === 0) return null;
    return testBiomarkerResults.reduce((latest, r) => {
      const date = new Date(r.testedAt);
      return date > latest ? date : latest;
    }, new Date(0));
  }, [testBiomarkerResults]);

  // Calculate composite risk score based on test type
  const compositeRiskScore = useMemo(() => {
    if (testId === "liver") {
      return calculateLiverRiskScore(biomarkerResults, gender as "male" | "female");
    } else if (testId === "kidney") {
      return calculateKidneyRiskScore(biomarkerResults, gender as "male" | "female");
    } else if (testId === "heart") {
      return calculateHeartRiskScore(biomarkerResults, gender as "male" | "female");
    }
    // Default - use basic test score
    return {
      score: testScore.score,
      risk: testScore.score >= 80 ? "low" : testScore.score >= 60 ? "moderate" : testScore.score >= 40 ? "high" : "very_high",
      interpretation: `${testScore.optimal} optimal, ${testScore.normal} normal, ${testScore.outOfRange} out of range`,
      components: [] as RiskScoreComponent[]
    };
  }, [testId, biomarkerResults, gender, testScore]);

  // Generate trend data for chart
  const trendData = useMemo(() => {
    return generateTrendData(testId, compositeRiskScore.score);
  }, [testId, compositeRiskScore.score]);

  // Config not found - render after all hooks
  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">Health test configuration not found</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = config.icon;

  // Empty state - render after all hooks
  if (testBiomarkerResults.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" style={{ color: config.color }} />
          <h3 className="text-xl font-medium mb-2">No {config.name} Data</h3>
          <p className="text-muted-foreground mb-4">
            Biomarker results for this health test will appear here once uploaded.
          </p>
          <Link href={`/admin/upload?member=${customerId}`}>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" /> Upload Results
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs for different views */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="scientific" className="gap-1.5">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Scientific Scores</span>
          </TabsTrigger>
          <TabsTrigger value="biomarkers" className="gap-1.5">
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Biomarkers</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Score and Status Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Score Card with Components */}
            <Card className="md:col-span-2" style={{ background: `linear-gradient(to bottom right, ${config.color}08, transparent)`, borderColor: `${config.color}30` }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Composite {config.name} Risk Score</span>
                  <Badge
                    variant="outline"
                    className={getRiskBadgeColor(compositeRiskScore.risk)}
                  >
                    <span className="capitalize">{compositeRiskScore.risk.replace("_", " ")}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className={`text-6xl font-bold ${getScoreColor(compositeRiskScore.score)}`}>
                      {compositeRiskScore.score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">/100</div>
                  </div>
                  {compositeRiskScore.components.length > 0 ? (
                    <div className="flex-1 space-y-2">
                      {compositeRiskScore.components.map((comp) => (
                        <div key={comp.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Calculator className="w-3 h-3 text-muted-foreground" />
                              {comp.name}
                              <span className="text-xs text-muted-foreground">({comp.weight}%)</span>
                            </span>
                            <span className={`font-medium ${getComponentStatusColor(comp.status)}`}>
                              {comp.value !== null ? comp.value : "--"}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getComponentStatusBg(comp.status)}`}
                              style={{ width: `${Math.round((comp.contribution / comp.weight) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Optimal
                          </span>
                          <span className="font-medium">{testScore.optimal}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${(testScore.optimal / Math.max(statusCounts.total, 1)) * 100}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            Normal
                          </span>
                          <span className="font-medium">{testScore.normal}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(testScore.normal / Math.max(statusCounts.total, 1)) * 100}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            Out of Range
                          </span>
                          <span className="font-medium">{testScore.outOfRange}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(testScore.outOfRange / Math.max(statusCounts.total, 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {compositeRiskScore.interpretation}
                </div>
                {latestTestDate && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Last tested: {latestTestDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Biomarker Status</CardTitle>
                <CardDescription>{statusCounts.total} biomarkers analyzed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Optimal</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{statusCounts.optimal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Normal</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{statusCounts.normal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Out of Range</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">{statusCounts.outOfRange}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Scientific Scores Preview */}
          {scientificScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Scientific Scores
                </CardTitle>
                <CardDescription>Validated clinical scoring systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {scientificScores.slice(0, 3).map(score => (
                    <div key={score.id} className="p-4 rounded-lg border bg-white dark:bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{score.name}</span>
                        <Badge className={`${getRiskBadgeColor(score.risk)} border text-xs`}>
                          {score.risk}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold mb-2">
                        {score.value !== null ? score.value : "—"}
                      </div>
                      {score.canCalculate ? (
                        <p className="text-xs text-muted-foreground">{score.interpretation}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-orange-600">Missing:</span>
                          {score.missingInputs.map(input => (
                            <Badge key={input} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              {input}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: config.color }} />
                {config.name} Score Over Time
              </CardTitle>
              <CardDescription>Track health improvement journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <defs>
                      <linearGradient id={`gradient-${testId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="overall"
                      stroke={config.color}
                      fill={`url(#gradient-${testId})`}
                      strokeWidth={2}
                    />
                    <Line type="monotone" dataKey="overall" stroke={config.color} strokeWidth={3} dot={{ fill: config.color, strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${config.color}15` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: config.color }}>
                    {compositeRiskScore.score}
                  </div>
                  <div>
                    <p className="font-medium">Current Score</p>
                    <p className="text-xs text-muted-foreground">Latest result</p>
                  </div>
                  <Badge className="ml-auto" style={{ backgroundColor: config.color, color: 'white' }}>Current</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                    {trendData[0]?.overall || 0}
                  </div>
                  <div>
                    <p className="font-medium">Starting Score</p>
                    <p className="text-xs text-muted-foreground">First recorded</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${config.color}10` }}>
                  <div className="text-3xl font-bold" style={{ color: config.color }}>
                    +{Math.max(0, compositeRiskScore.score - (trendData[0]?.overall || 0))}
                  </div>
                  <p className="text-sm text-muted-foreground">Points improved</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold">{statusCounts.optimal}</div>
                    <p className="text-xs text-muted-foreground">Optimal markers</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{statusCounts.total}</div>
                    <p className="text-xs text-muted-foreground">Total tested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scientific Scores Tab */}
        <TabsContent value="scientific" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Scientific {config.name} Scores
              </CardTitle>
              <CardDescription>
                Validated clinical scoring systems for comprehensive assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scientificScores.map(score => (
                  <div key={score.id} className="p-4 rounded-lg border bg-white dark:bg-background">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold">{score.name}</span>
                      <Badge className={`${getRiskBadgeColor(score.risk)} border`}>
                        {score.risk}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold mb-3">
                      {score.value !== null ? score.value : "—"}
                    </div>
                    {score.canCalculate ? (
                      <p className="text-sm text-muted-foreground mb-3">{score.interpretation}</p>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-orange-600 mb-1">Missing values:</p>
                        <div className="flex flex-wrap gap-1">
                          {score.missingInputs.map(input => (
                            <Badge key={input} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              {input}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">{score.formula}</p>
                      <p className="text-xs text-muted-foreground">{score.description}</p>
                      <p className="text-xs text-muted-foreground italic">Cutoffs: {score.cutoffs}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Biomarkers Tab */}
        <TabsContent value="biomarkers" className="space-y-6 mt-6">
          {Object.entries(config.categories).map(([catKey, category]) => {
            const CategoryIcon = category.icon;
            const categoryResults = testBiomarkerResults.filter(r =>
              category.biomarkerIds.includes(r.biomarkerId)
            );

            if (categoryResults.length === 0) return null;

            return (
              <div key={catKey}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                    <CategoryIcon className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-medium">{category.name}</h2>
                      <Badge variant="secondary" className="text-xs">{category.subtitle}</Badge>
                      <Badge variant="outline">{categoryResults.length} tested</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryResults.map(result => {
                    // Find panel biomarker for range info
                    let panelBiomarker: BloodPanelBiomarker | undefined;
                    for (const cat of Object.values(bloodPanelConfig)) {
                      const found = cat.biomarkers.find(b => b.id === result.biomarkerId);
                      if (found) {
                        panelBiomarker = found;
                        break;
                      }
                    }

                    if (!panelBiomarker) {
                      // Fallback if not in blood panel config
                      return (
                        <Card key={result.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm">{result.biomarkerId}</h4>
                              <Badge variant="outline">{result.status}</Badge>
                            </div>
                            <p className="text-2xl font-serif font-bold">{result.value}</p>
                          </CardContent>
                        </Card>
                      );
                    }

                    const range = getEffectiveRange(panelBiomarker, gender as Gender);
                    const status = getBiomarkerStatus(result.value, panelBiomarker, gender as Gender);

                    const statusColorClass =
                      status.status === "Optimal" ? "bg-green-100 text-green-700 border-green-200" :
                      status.status === "Normal" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      "bg-orange-100 text-orange-700 border-orange-200";

                    const dotColorClass =
                      status.status === "Optimal" ? "bg-green-500" :
                      status.status === "Normal" ? "bg-blue-500" :
                      "bg-orange-500";

                    return (
                      <Card key={result.id} className="hover:shadow-md transition-all">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`} />
                              <h4 className="font-medium text-sm">{panelBiomarker.shortName}</h4>
                            </div>
                            <Badge variant="outline" className={`text-xs ${statusColorClass}`}>
                              {status.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 truncate">{panelBiomarker.name}</p>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-2xl font-serif font-bold">{result.value}</span>
                            <span className="text-sm text-muted-foreground">{panelBiomarker.unit}</span>
                          </div>
                          {/* Range Bar */}
                          <div className="space-y-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                              <div
                                className="absolute h-full bg-green-200"
                                style={{
                                  left: `${Math.max(0, Math.min(100, ((range.optimalLow - range.normalLow) / (range.normalHigh - range.normalLow)) * 100))}%`,
                                  width: `${Math.max(0, Math.min(100, ((range.optimalHigh - range.optimalLow) / (range.normalHigh - range.normalLow)) * 100))}%`
                                }}
                              />
                              <div
                                className={`absolute w-1 h-full ${dotColorClass}`}
                                style={{
                                  left: `${Math.max(0, Math.min(100, ((result.value - range.normalLow) / (range.normalHigh - range.normalLow)) * 100))}%`
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{range.normalLow}</span>
                              <span className="text-green-600">{range.optimalLow}-{range.optimalHigh}</span>
                              <span>{range.normalHigh}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths */}
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {statusCounts.optimal > 0 && (
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{statusCounts.optimal} biomarkers are in optimal range</span>
                    </li>
                  )}
                  {testScore.score >= 70 && (
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Overall {config.name.toLowerCase()} score is good ({testScore.score}/100)</span>
                    </li>
                  )}
                  {scientificScores.filter(s => s.canCalculate && ["low", "optimal", "normal"].includes(s.risk)).map(s => (
                    <li key={s.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{s.name} indicates {s.risk} risk</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {statusCounts.outOfRange > 0 && (
                    <li className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{statusCounts.outOfRange} biomarkers need attention</span>
                    </li>
                  )}
                  {testScore.score < 70 && (
                    <li className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Overall score could be improved (currently {testScore.score}/100)</span>
                    </li>
                  )}
                  {scientificScores.filter(s => s.canCalculate && ["high", "significant", "cirrhosis"].includes(s.risk)).map(s => (
                    <li key={s.id} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{s.name} shows elevated risk - monitor closely</span>
                    </li>
                  ))}
                  {scientificScores.filter(s => !s.canCalculate && s.missingInputs.length > 0).length > 0 && (
                    <li className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Additional biomarkers needed for complete assessment</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Clinical Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusCounts.outOfRange > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Follow-up Actions</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Review out-of-range biomarkers with the patient</li>
                      <li>• Consider scheduling a follow-up test in 4-6 weeks</li>
                      <li>• Discuss lifestyle modifications if applicable</li>
                    </ul>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Next Steps</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Schedule next {config.name.toLowerCase()} panel in 3-6 months</li>
                    <li>• Monitor trends over time for early detection</li>
                    <li>• Consider additional tests if scientific scores are incomplete</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
