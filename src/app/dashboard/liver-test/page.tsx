"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBiomarkerResults } from "@/hooks/useApi";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { BiomarkerDetailDialog } from "@/components/dashboard/BiomarkerDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { biomarkerDefinitions, getBiomarkerById, getStatusForValue } from "@/data/biomarkers";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import {
  Bean,
  Flame,
  Heart,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Activity,
  BarChart3,
  Sparkles,
  Users,
  Calendar,
  Target,
  Brain,
  Loader2,
  FileText,
  Info,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganTrendSection } from "@/components/dashboard/OrganTrendSection";
import { LiverAIRecommendations } from "@/components/dashboard/LiverAIRecommendations";
import { PopulationComparison } from "@/components/dashboard/PopulationComparison";
import { LiverTestScheduler } from "@/components/dashboard/LiverTestScheduler";
import { LiverGoalSetting } from "@/components/dashboard/LiverGoalSetting";
import { EmailReminderService } from "@/components/dashboard/EmailReminderService";
import { PredictiveHealthRisk } from "@/components/dashboard/PredictiveHealthRisk";

// Define liver test biomarkers grouped by category
const liverTestConfig = {
  liverEnzymes: {
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
  },
  metabolic: {
    name: "Metabolic Markers",
    subtitle: "Related Markers",
    icon: Zap,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    biomarkerIds: ["glucose", "crp", "ferritin", "platelets"]
  }
};

// ============================================================================
// SCIENTIFIC LIVER SCORING SYSTEMS
// Based on validated clinical research and guidelines
// ============================================================================

// Input value with metadata for display
interface BiomarkerInput {
  name: string;
  value: number | null;
  unit: string;
  testedAt: string | null;
}

// Base result type from calculation functions (without inputs)
interface FIB4Result {
  value: number | null;
  risk: "low" | "indeterminate" | "high";
  interpretation: string;
  canCalculate: boolean;
  missingInputs: string[];
}

interface APRIResult {
  value: number | null;
  risk: "low" | "indeterminate" | "significant" | "cirrhosis";
  interpretation: string;
  canCalculate: boolean;
  missingInputs: string[];
}

interface DeRitisResult {
  value: number | null;
  interpretation: string;
  pattern: "normal" | "hepatocellular" | "cholestatic" | "alcoholic";
  canCalculate: boolean;
  missingInputs: string[];
}

interface LiverRiskResult {
  score: number;
  risk: "low" | "moderate" | "high" | "very_high";
  interpretation: string;
  components: {
    name: string;
    value: number | null;
    status: "optimal" | "normal" | "elevated" | "critical";
    weight: number;
    contribution: number;
    testedAt?: string | null;
  }[];
}

// Full interface with inputs (used in component state)
interface ScientificScores {
  fib4: FIB4Result & { inputs: BiomarkerInput[] };
  apri: APRIResult & { inputs: BiomarkerInput[] };
  deRitis: DeRitisResult & { inputs: BiomarkerInput[] };
  liverRisk: LiverRiskResult;
}

/**
 * Calculate FIB-4 Index (Fibrosis-4)
 * Formula: (Age × AST) / (Platelet Count × √ALT)
 *
 * Clinical Use: Non-invasive assessment of liver fibrosis
 * Validated in: HCV, HBV, NAFLD patients
 *
 * Reference: Sterling RK et al. Hepatology 2006;43:1317-25
 */
function calculateFIB4(
  age: number | null,
  ast: number | null,
  alt: number | null,
  platelets: number | null
): FIB4Result {
  const missingInputs: string[] = [];
  if (age === null) missingInputs.push("Age");
  if (ast === null) missingInputs.push("AST");
  if (alt === null) missingInputs.push("ALT");
  if (platelets === null) missingInputs.push("Platelets");

  if (missingInputs.length > 0 || !age || !ast || !alt || !platelets || alt <= 0 || platelets <= 0) {
    return {
      value: null,
      risk: "indeterminate",
      interpretation: "Cannot calculate - missing required values",
      canCalculate: false,
      missingInputs
    };
  }

  // FIB-4 = (Age × AST) / (Platelet Count × √ALT)
  const fib4 = (age * ast) / (platelets * Math.sqrt(alt));

  let risk: "low" | "indeterminate" | "high";
  let interpretation: string;

  if (fib4 < 1.45) {
    risk = "low";
    interpretation = "Low probability of advanced fibrosis (F0-F1). Negative predictive value ~90%.";
  } else if (fib4 <= 3.25) {
    risk = "indeterminate";
    interpretation = "Indeterminate result. Further evaluation recommended (e.g., FibroScan, liver biopsy).";
  } else {
    risk = "high";
    interpretation = "High probability of advanced fibrosis (F3-F4). Positive predictive value ~65%.";
  }

  return {
    value: Math.round(fib4 * 100) / 100,
    risk,
    interpretation,
    canCalculate: true,
    missingInputs: []
  };
}

/**
 * Calculate APRI (AST to Platelet Ratio Index)
 * Formula: 100 × (AST / Upper Limit of Normal) / Platelet Count
 *
 * Clinical Use: Predicts significant fibrosis and cirrhosis
 * Upper Limit of Normal for AST: 40 U/L (standard)
 *
 * Reference: Wai CT et al. Hepatology 2003;38:518-26
 */
function calculateAPRI(
  ast: number | null,
  platelets: number | null,
  astUpperLimit: number = 40
): APRIResult {
  const missingInputs: string[] = [];
  if (ast === null) missingInputs.push("AST");
  if (platelets === null) missingInputs.push("Platelets");

  if (missingInputs.length > 0 || !ast || !platelets || platelets <= 0) {
    return {
      value: null,
      risk: "indeterminate",
      interpretation: "Cannot calculate - missing required values",
      canCalculate: false,
      missingInputs
    };
  }

  // APRI = 100 × (AST / ULN) / Platelet Count
  const apri = (100 * (ast / astUpperLimit)) / platelets;

  let risk: "low" | "indeterminate" | "significant" | "cirrhosis";
  let interpretation: string;

  if (apri < 0.5) {
    risk = "low";
    interpretation = "Low probability of significant fibrosis. Excludes cirrhosis with high confidence.";
  } else if (apri < 1.5) {
    risk = "indeterminate";
    interpretation = "Indeterminate result. Cannot reliably exclude or confirm significant fibrosis.";
  } else if (apri < 2.0) {
    risk = "significant";
    interpretation = "Suggests significant fibrosis (≥F2). Further evaluation recommended.";
  } else {
    risk = "cirrhosis";
    interpretation = "High probability of cirrhosis. Positive predictive value for cirrhosis ~65%.";
  }

  return {
    value: Math.round(apri * 100) / 100,
    risk,
    interpretation,
    canCalculate: true,
    missingInputs: []
  };
}

/**
 * Calculate De Ritis Ratio (AST/ALT Ratio)
 * Formula: AST / ALT
 *
 * Clinical Use: Differentiates liver disease etiology
 * - Ratio < 1: Typical in NAFLD, viral hepatitis (hepatocellular pattern)
 * - Ratio > 1: Suggests alcoholic liver disease or cirrhosis
 * - Ratio > 2: Strongly suggests alcoholic hepatitis
 *
 * Reference: De Ritis F et al. Clin Chim Acta 1957;2:70-1
 */
function calculateDeRitisRatio(
  ast: number | null,
  alt: number | null
): DeRitisResult {
  const missingInputs: string[] = [];
  if (ast === null) missingInputs.push("AST");
  if (alt === null) missingInputs.push("ALT");

  if (missingInputs.length > 0 || !ast || !alt || alt <= 0) {
    return {
      value: null,
      interpretation: "Cannot calculate - missing required values",
      pattern: "normal",
      canCalculate: false,
      missingInputs
    };
  }

  const ratio = ast / alt;

  let interpretation: string;
  let pattern: "normal" | "hepatocellular" | "cholestatic" | "alcoholic";

  if (ratio < 0.8) {
    pattern = "hepatocellular";
    interpretation = "Low ratio suggests hepatocellular injury pattern. Common in NAFLD or acute viral hepatitis.";
  } else if (ratio <= 1.0) {
    pattern = "normal";
    interpretation = "Normal ratio. Typically seen in healthy liver or mild liver disease.";
  } else if (ratio <= 2.0) {
    pattern = "cholestatic";
    interpretation = "Elevated ratio may indicate cirrhosis, cholestatic disease, or alcoholic liver disease.";
  } else {
    pattern = "alcoholic";
    interpretation = "High ratio (>2) strongly suggests alcoholic hepatitis. Sensitivity ~70% for alcoholic liver disease.";
  }

  return {
    value: Math.round(ratio * 100) / 100,
    interpretation,
    pattern,
    canCalculate: true,
    missingInputs: []
  };
}

/**
 * Calculate Composite Liver Risk Score
 * Based on LiverRisk score methodology (Serra-Burriel et al., Lancet 2023)
 *
 * Components weighted by clinical importance:
 * - ALT/AST elevation (liver cell damage)
 * - GGT elevation (cholestasis/alcohol)
 * - Bilirubin (excretory function)
 * - Albumin (synthetic function)
 * - Platelets (portal hypertension marker)
 */
function calculateLiverRiskScore(
  results: BiomarkerResult[],
  gender: "male" | "female"
): LiverRiskResult {
  // Helper to get value and test date
  const getBiomarker = (id: string): { value: number | null; testedAt: string | null } => {
    const r = results.find(r => r.biomarkerId === id);
    return { value: r ? r.value : null, testedAt: r ? r.testedAt : null };
  };

  // Define scoring components with clinical weights
  const components: ScientificScores["liverRisk"]["components"] = [];
  let totalWeight = 0;
  let totalScore = 0;

  // ALT - Primary marker of hepatocellular injury (Weight: 20%)
  const altData = getBiomarker("alt");
  const altNormal = gender === "male" ? 45 : 34;
  if (altData.value !== null) {
    let altStatus: "optimal" | "normal" | "elevated" | "critical";
    let altScore: number;
    if (altData.value <= altNormal * 0.5) {
      altStatus = "optimal"; altScore = 100;
    } else if (altData.value <= altNormal) {
      altStatus = "normal"; altScore = 80;
    } else if (altData.value <= altNormal * 3) {
      altStatus = "elevated"; altScore = 50;
    } else {
      altStatus = "critical"; altScore = 20;
    }
    components.push({ name: "ALT", value: altData.value, status: altStatus, weight: 20, contribution: altScore * 0.2, testedAt: altData.testedAt });
    totalWeight += 20;
    totalScore += altScore * 0.2;
  }

  // AST - Hepatocellular injury, also in heart/muscle (Weight: 15%)
  const astData = getBiomarker("ast");
  const astNormal = gender === "male" ? 40 : 32;
  if (astData.value !== null) {
    let astStatus: "optimal" | "normal" | "elevated" | "critical";
    let astScore: number;
    if (astData.value <= astNormal * 0.5) {
      astStatus = "optimal"; astScore = 100;
    } else if (astData.value <= astNormal) {
      astStatus = "normal"; astScore = 80;
    } else if (astData.value <= astNormal * 3) {
      astStatus = "elevated"; astScore = 50;
    } else {
      astStatus = "critical"; astScore = 20;
    }
    components.push({ name: "AST", value: astData.value, status: astStatus, weight: 15, contribution: astScore * 0.15, testedAt: astData.testedAt });
    totalWeight += 15;
    totalScore += astScore * 0.15;
  }

  // GGT - Cholestasis, alcohol, medications (Weight: 15%)
  const ggtData = getBiomarker("ggt");
  const ggtNormal = gender === "male" ? 60 : 40;
  if (ggtData.value !== null) {
    let ggtStatus: "optimal" | "normal" | "elevated" | "critical";
    let ggtScore: number;
    if (ggtData.value <= ggtNormal * 0.5) {
      ggtStatus = "optimal"; ggtScore = 100;
    } else if (ggtData.value <= ggtNormal) {
      ggtStatus = "normal"; ggtScore = 80;
    } else if (ggtData.value <= ggtNormal * 3) {
      ggtStatus = "elevated"; ggtScore = 50;
    } else {
      ggtStatus = "critical"; ggtScore = 20;
    }
    components.push({ name: "GGT", value: ggtData.value, status: ggtStatus, weight: 15, contribution: ggtScore * 0.15, testedAt: ggtData.testedAt });
    totalWeight += 15;
    totalScore += ggtScore * 0.15;
  }

  // ALP - Cholestatic/infiltrative disease (Weight: 10%)
  const alpData = getBiomarker("alp");
  if (alpData.value !== null) {
    let alpStatus: "optimal" | "normal" | "elevated" | "critical";
    let alpScore: number;
    if (alpData.value >= 40 && alpData.value <= 100) {
      alpStatus = "optimal"; alpScore = 100;
    } else if (alpData.value >= 30 && alpData.value <= 130) {
      alpStatus = "normal"; alpScore = 80;
    } else if (alpData.value <= 200) {
      alpStatus = "elevated"; alpScore = 50;
    } else {
      alpStatus = "critical"; alpScore = 20;
    }
    components.push({ name: "ALP", value: alpData.value, status: alpStatus, weight: 10, contribution: alpScore * 0.1, testedAt: alpData.testedAt });
    totalWeight += 10;
    totalScore += alpScore * 0.1;
  }

  // Total Bilirubin - Excretory function (Weight: 15%)
  const bilirubinData = getBiomarker("bilirubin_total");
  if (bilirubinData.value !== null) {
    let bilStatus: "optimal" | "normal" | "elevated" | "critical";
    let bilScore: number;
    if (bilirubinData.value <= 17) {
      bilStatus = "optimal"; bilScore = 100;
    } else if (bilirubinData.value <= 21) {
      bilStatus = "normal"; bilScore = 80;
    } else if (bilirubinData.value <= 50) {
      bilStatus = "elevated"; bilScore = 50;
    } else {
      bilStatus = "critical"; bilScore = 20;
    }
    components.push({ name: "Bilirubin", value: bilirubinData.value, status: bilStatus, weight: 15, contribution: bilScore * 0.15, testedAt: bilirubinData.testedAt });
    totalWeight += 15;
    totalScore += bilScore * 0.15;
  }

  // Albumin - Synthetic function (Weight: 15%)
  const albuminData = getBiomarker("albumin");
  if (albuminData.value !== null) {
    let albStatus: "optimal" | "normal" | "elevated" | "critical";
    let albScore: number;
    if (albuminData.value >= 40 && albuminData.value <= 50) {
      albStatus = "optimal"; albScore = 100;
    } else if (albuminData.value >= 35 && albuminData.value <= 55) {
      albStatus = "normal"; albScore = 80;
    } else if (albuminData.value >= 28) {
      albStatus = "elevated"; albScore = 50;
    } else {
      albStatus = "critical"; albScore = 20;
    }
    components.push({ name: "Albumin", value: albuminData.value, status: albStatus, weight: 15, contribution: albScore * 0.15, testedAt: albuminData.testedAt });
    totalWeight += 15;
    totalScore += albScore * 0.15;
  }

  // Platelets - Portal hypertension marker (Weight: 10%)
  const plateletsData = getBiomarker("platelets");
  if (plateletsData.value !== null) {
    let pltStatus: "optimal" | "normal" | "elevated" | "critical";
    let pltScore: number;
    if (plateletsData.value >= 150 && plateletsData.value <= 400) {
      pltStatus = "optimal"; pltScore = 100;
    } else if (plateletsData.value >= 100 && plateletsData.value <= 450) {
      pltStatus = "normal"; pltScore = 80;
    } else if (plateletsData.value >= 50) {
      pltStatus = "elevated"; pltScore = 50;
    } else {
      pltStatus = "critical"; pltScore = 20;
    }
    components.push({ name: "Platelets", value: plateletsData.value, status: pltStatus, weight: 10, contribution: pltScore * 0.1, testedAt: plateletsData.testedAt });
    totalWeight += 10;
    totalScore += pltScore * 0.1;
  }

  // Normalize score to 0-100
  const normalizedScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  let risk: "low" | "moderate" | "high" | "very_high";
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

  return {
    score: normalizedScore,
    risk,
    interpretation,
    components
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Attention";
  return "Requires Action";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getRiskBadgeColor(risk: string): string {
  switch (risk) {
    case "low": return "bg-green-100 text-green-700 border-green-200";
    case "indeterminate":
    case "moderate": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "significant":
    case "high": return "bg-orange-100 text-orange-700 border-orange-200";
    case "cirrhosis":
    case "very_high":
    case "alcoholic": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getRiskIcon(risk: string) {
  switch (risk) {
    case "low": return <ShieldCheck className="w-5 h-5 text-green-600" />;
    case "indeterminate":
    case "moderate": return <ShieldAlert className="w-5 h-5 text-yellow-600" />;
    case "significant":
    case "high": return <ShieldAlert className="w-5 h-5 text-orange-600" />;
    case "cirrhosis":
    case "very_high":
    case "alcoholic": return <ShieldX className="w-5 h-5 text-red-600" />;
    default: return <Info className="w-5 h-5 text-gray-600" />;
  }
}

// Format date for display (e.g., "12 May 2024")
function formatTestDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function LiverTestPage() {
  const { user } = useAuth();
  const gender = user?.gender === "female" ? "female" : "male";
  const [activeTab, setActiveTab] = useState("overview");
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Fetch real biomarker data from API
  const { data: biomarkerData, isLoading, error } = useBiomarkerResults(undefined, { latest: true });

  const [selectedBiomarker, setSelectedBiomarker] = useState<{
    biomarker: BiomarkerDefinition;
    result: BiomarkerResult;
  } | null>(null);

  // Transform API data to BiomarkerResult format
  const allBiomarkerResults: BiomarkerResult[] = useMemo(() => {
    if (!biomarkerData?.results) return [];

    return biomarkerData.results.map((r: any) => ({
      id: r.id,
      biomarkerId: r.biomarkerId,
      value: r.value,
      unit: r.biomarker?.unit || "",
      status: r.status?.toLowerCase() as BiomarkerResult["status"],
      testedAt: r.testedAt,
      labReportId: r.labReportId || "",
      notes: r.notes || "",
      previousValue: r.previousValue,
      trend: r.trend?.toLowerCase() as "up" | "down" | "stable" | undefined,
    }));
  }, [biomarkerData]);

  // Get biomarkers with their results for liver test
  const liverTestResults = useMemo(() => {
    const allLiverBiomarkerIds = Object.values(liverTestConfig).flatMap(cat => cat.biomarkerIds);

    return allBiomarkerResults
      .filter(result => allLiverBiomarkerIds.includes(result.biomarkerId))
      .map(result => ({
        result,
        biomarker: getBiomarkerById(result.biomarkerId),
      }))
      .filter((item): item is { result: BiomarkerResult; biomarker: BiomarkerDefinition } =>
        item.biomarker !== undefined
      );
  }, [allBiomarkerResults]);

  // Calculate age from user's date of birth
  const userAge = useMemo(() => {
    if (!user?.dateOfBirth) return null;
    const dob = new Date(user.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age > 0 && age < 120 ? age : null;
  }, [user?.dateOfBirth]);

  // Calculate scientific scores with full biomarker metadata
  const scientificScores = useMemo(() => {
    // Helper to get biomarker with full metadata
    const getBiomarker = (id: string): { value: number | null; testedAt: string | null; unit: string } => {
      const r = allBiomarkerResults.find(r => r.biomarkerId === id);
      return {
        value: r ? r.value : null,
        testedAt: r ? r.testedAt : null,
        unit: r?.unit || ""
      };
    };

    // Get biomarker values with metadata
    const astData = getBiomarker("ast");
    const altData = getBiomarker("alt");
    const plateletsData = getBiomarker("platelets");

    // Build FIB-4 inputs
    const fib4Inputs: BiomarkerInput[] = [
      { name: "Age", value: userAge, unit: "years", testedAt: null },
      { name: "AST", value: astData.value, unit: "U/L", testedAt: astData.testedAt },
      { name: "ALT", value: altData.value, unit: "U/L", testedAt: altData.testedAt },
      { name: "Platelets", value: plateletsData.value, unit: "×10⁹/L", testedAt: plateletsData.testedAt }
    ];

    // Build APRI inputs
    const apriInputs: BiomarkerInput[] = [
      { name: "AST", value: astData.value, unit: "U/L", testedAt: astData.testedAt },
      { name: "Platelets", value: plateletsData.value, unit: "×10⁹/L", testedAt: plateletsData.testedAt }
    ];

    // Build De Ritis inputs
    const deRitisInputs: BiomarkerInput[] = [
      { name: "AST", value: astData.value, unit: "U/L", testedAt: astData.testedAt },
      { name: "ALT", value: altData.value, unit: "U/L", testedAt: altData.testedAt }
    ];

    // Calculate scores
    const fib4Result = calculateFIB4(userAge, astData.value, altData.value, plateletsData.value);
    const apriResult = calculateAPRI(astData.value, plateletsData.value);
    const deRitisResult = calculateDeRitisRatio(astData.value, altData.value);
    const liverRiskResult = calculateLiverRiskScore(allBiomarkerResults, gender);

    return {
      fib4: { ...fib4Result, inputs: fib4Inputs },
      apri: { ...apriResult, inputs: apriInputs },
      deRitis: { ...deRitisResult, inputs: deRitisInputs },
      liverRisk: liverRiskResult
    };
  }, [allBiomarkerResults, userAge, gender]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Count statuses - calculate dynamically based on actual values and ranges
  const statusCounts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const { result, biomarker } of liverTestResults) {
      // Calculate status dynamically using the actual value and biomarker ranges
      const calculatedStatus = getStatusForValue(biomarker, result.value, gender);

      if (calculatedStatus === "optimal") optimal++;
      else if (calculatedStatus === "normal") normal++;
      else outOfRange++; // includes "out_of_range" and "critical"
    }

    return { optimal, normal, outOfRange, total: liverTestResults.length };
  }, [liverTestResults, gender]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-muted-foreground">Loading liver function data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading liver function data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (liverTestResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center">
            <Bean className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Liver Function Test
            </h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive assessment across 13 biomarkers
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Liver Function Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your liver function results will appear here once uploaded by your healthcare provider.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your clinic to upload your blood test results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center">
            <Bean className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Liver Function Test
            </h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive assessment across 13 biomarkers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Risk Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Health Score Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Score Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Composite Liver Risk Score</span>
                  <Badge
                    variant="outline"
                    className={`${
                      getRiskBadgeColor(scientificScores.liverRisk.risk)
                    } border`}
                  >
                    {getRiskIcon(scientificScores.liverRisk.risk)}
                    <span className="ml-1 capitalize">{scientificScores.liverRisk.risk.replace("_", " ")}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`text-6xl font-bold ${getScoreColor(scientificScores.liverRisk.score)}`}>
                      {scientificScores.liverRisk.score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getScoreLabel(scientificScores.liverRisk.score)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {scientificScores.liverRisk.components.map((comp) => (
                      <div key={comp.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            {comp.name}
                          </span>
                          <span className={`font-medium`}>
                            {comp.value !== null ? comp.value : "--"}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getProgressColor(comp.contribution)}`}
                            style={{ width: `${Math.round((comp.contribution / comp.weight) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {scientificScores.liverRisk.interpretation}
                </div>
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

          {/* Scientific Scores Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Scientific Liver Scores
              </CardTitle>
              <CardDescription>
                Validated clinical scoring systems for liver fibrosis and disease pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* FIB-4 */}
                <div className="p-4 rounded-lg border bg-white dark:bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">FIB-4 Index</span>
                    <Badge className={`ml-2 ${getRiskBadgeColor(scientificScores.fib4.risk)} border`}>
                      {getRiskIcon(scientificScores.fib4.risk)}
                      <span className="ml-1 capitalize">{scientificScores.fib4.risk}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold">
                      {scientificScores.fib4.value !== null ? scientificScores.fib4.value : "--"}
                    </span>
                  </div>
                  {scientificScores.fib4.canCalculate ? (
                    <div className="text-xs text-muted-foreground mb-2">
                      {scientificScores.fib4.interpretation}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-orange-600 font-medium">Missing:</span>
                        {scientificScores.fib4.missingInputs.map((input) => (
                          <Badge key={input} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {input}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Input values with test dates */}
                  <div className="space-y-1 mb-2 pt-2 border-t border-border">
                    {scientificScores.fib4.inputs.map((input) => (
                      <div key={input.name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{input.name}:</span>
                        <div className="flex items-center gap-2">
                          <span className={input.value !== null ? "font-medium" : "text-orange-600"}>
                            {input.value !== null ? `${input.value} ${input.unit}` : "—"}
                          </span>
                          {input.testedAt && (
                            <span className="text-muted-foreground text-[10px]">
                              {formatTestDate(input.testedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">Formula: (Age × AST) / (Platelets × √ALT)</span>
                  </div>
                </div>
                {/* APRI */}
                <div className="p-4 rounded-lg border bg-white dark:bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">APRI</span>
                    <Badge className={`ml-2 ${getRiskBadgeColor(scientificScores.apri.risk)} border`}>
                      {getRiskIcon(scientificScores.apri.risk)}
                      <span className="ml-1 capitalize">{scientificScores.apri.risk}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold">
                      {scientificScores.apri.value !== null ? scientificScores.apri.value : "--"}
                    </span>
                  </div>
                  {scientificScores.apri.canCalculate ? (
                    <div className="text-xs text-muted-foreground mb-2">
                      {scientificScores.apri.interpretation}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-orange-600 font-medium">Missing:</span>
                        {scientificScores.apri.missingInputs.map((input) => (
                          <Badge key={input} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {input}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Input values with test dates */}
                  <div className="space-y-1 mb-2 pt-2 border-t border-border">
                    {scientificScores.apri.inputs.map((input) => (
                      <div key={input.name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{input.name}:</span>
                        <div className="flex items-center gap-2">
                          <span className={input.value !== null ? "font-medium" : "text-orange-600"}>
                            {input.value !== null ? `${input.value} ${input.unit}` : "—"}
                          </span>
                          {input.testedAt && (
                            <span className="text-muted-foreground text-[10px]">
                              {formatTestDate(input.testedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">Formula: 100 × (AST / 40) / Platelets</span>
                  </div>
                </div>
                {/* De Ritis Ratio */}
                <div className="p-4 rounded-lg border bg-white dark:bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">De Ritis Ratio</span>
                    <Badge className={`ml-2 ${getRiskBadgeColor(scientificScores.deRitis.pattern)} border`}>
                      {getRiskIcon(scientificScores.deRitis.pattern)}
                      <span className="ml-1 capitalize">{scientificScores.deRitis.pattern}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold">
                      {scientificScores.deRitis.value !== null ? scientificScores.deRitis.value : "--"}
                    </span>
                  </div>
                  {scientificScores.deRitis.canCalculate ? (
                    <div className="text-xs text-muted-foreground mb-2">
                      {scientificScores.deRitis.interpretation}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-xs text-orange-600 font-medium">Missing:</span>
                        {scientificScores.deRitis.missingInputs.map((input) => (
                          <Badge key={input} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {input}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Input values with test dates */}
                  <div className="space-y-1 mb-2 pt-2 border-t border-border">
                    {scientificScores.deRitis.inputs.map((input) => (
                      <div key={input.name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{input.name}:</span>
                        <div className="flex items-center gap-2">
                          <span className={input.value !== null ? "font-medium" : "text-orange-600"}>
                            {input.value !== null ? `${input.value} ${input.unit}` : "—"}
                          </span>
                          {input.testedAt && (
                            <span className="text-muted-foreground text-[10px]">
                              {formatTestDate(input.testedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">Formula: AST / ALT</span>
                  </div>
                </div>
              </div>

              {/* Detailed Score Components Explanation - Collapsible */}
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScoreDetails(!showScoreDetails)}
                  className="text-muted-foreground hover:text-foreground gap-2 px-0"
                >
                  <Info className="w-4 h-4" />
                  <span>Learn more about these scores</span>
                  {showScoreDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {showScoreDetails && (
                <div className="grid md:grid-cols-2 gap-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* FIB-4 Components */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-primary">1. FIB-4 Index Components</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Formula: (Age × AST) / (Platelets × √ALT)
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Age</span>
                        <span className="text-muted-foreground">Patient age in years. Older age increases the score, reflecting age-related fibrosis risk.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">AST</span>
                        <span className="text-muted-foreground">Aspartate aminotransferase (U/L). Liver enzyme released during cell damage. Higher values suggest injury.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">ALT</span>
                        <span className="text-muted-foreground">Alanine aminotransferase (U/L). Primary liver enzyme. Square root used to normalize the ratio.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Platelets</span>
                        <span className="text-muted-foreground">Platelet count (×10⁹/L). Low platelets indicate portal hypertension from advanced fibrosis.</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground italic">
                      Cutoffs: &lt;1.45 = low risk, 1.45-3.25 = indeterminate, &gt;3.25 = high risk
                    </p>
                  </div>

                  {/* APRI Components */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-primary">2. APRI Components</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Formula: 100 × (AST / Upper Limit Normal) / Platelets
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">AST</span>
                        <span className="text-muted-foreground">Aspartate aminotransferase (U/L). Normalized against standard upper limit of 40 U/L.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">ULN</span>
                        <span className="text-muted-foreground">Upper Limit of Normal (40 U/L). Standard reference for AST comparison.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Platelets</span>
                        <span className="text-muted-foreground">Platelet count (×10⁹/L). Decreasing platelets correlate with worsening fibrosis.</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground italic">
                      Cutoffs: &lt;0.5 = excludes significant fibrosis, &gt;1.5 = suggests significant fibrosis, &gt;2.0 = suggests cirrhosis
                    </p>
                  </div>

                  {/* De Ritis Ratio Components */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-primary">3. De Ritis Ratio Components</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Formula: AST / ALT
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">AST</span>
                        <span className="text-muted-foreground">Found in liver, heart, muscle, kidney. Released in both hepatic and non-hepatic injury.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">ALT</span>
                        <span className="text-muted-foreground">More liver-specific than AST. Predominantly elevated in hepatocellular injury.</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground italic">
                      Interpretation: &lt;1.0 = viral hepatitis/NAFLD, 1.0-2.0 = cirrhosis/cholestasis, &gt;2.0 = alcoholic liver disease
                    </p>
                  </div>

                  {/* Liver Risk Score Components */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-primary">4. Composite Liver Risk Score Components</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Weighted scoring based on 7 key liver biomarkers
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">ALT (20%)</span>
                        <span className="text-muted-foreground">Primary hepatocellular injury marker. Most sensitive for liver cell damage.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">AST (15%)</span>
                        <span className="text-muted-foreground">Hepatocellular injury. Also elevated in heart/muscle damage.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">GGT (15%)</span>
                        <span className="text-muted-foreground">Cholestasis marker. Sensitive to alcohol use and medications.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">ALP (10%)</span>
                        <span className="text-muted-foreground">Cholestatic/infiltrative disease marker. Also elevated in bone disorders.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Bilirubin (15%)</span>
                        <span className="text-muted-foreground">Excretory function. Elevated in jaundice and bile duct obstruction.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Albumin (15%)</span>
                        <span className="text-muted-foreground">Synthetic function. Low levels indicate chronic liver disease/malnutrition.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Platelets (10%)</span>
                        <span className="text-muted-foreground">Portal hypertension marker. Low count suggests advanced fibrosis/cirrhosis.</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground italic">
                      Score 0-100: ≥80 = low risk, 60-79 = moderate, 40-59 = high, &lt;40 = very high risk
                    </p>
                  </div>
                </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Biomarker Categories */}
          <div className="space-y-8">
            {Object.entries(liverTestConfig).map(([key, config]) => {
              const categoryResults = liverTestResults.filter(
                item => config.biomarkerIds.includes(item.result.biomarkerId)
              );
              // Use scientificScores.liverRisk.components for scores if available
              const comp = scientificScores.liverRisk.components.find(c => c.name.toLowerCase() === config.name.toLowerCase().split(" ")[0]);
              const categoryScore = comp
                ? { score: Math.round((comp.contribution / comp.weight) * 100), optimal: 0, normal: 0, outOfRange: 0 }
                : undefined;

              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <config.icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-medium text-foreground">{config.name}</h2>
                        <Badge variant="secondary" className="text-xs">{config.subtitle}</Badge>
                        {categoryScore && (
                          <Badge variant="outline" className={`${getScoreColor(categoryScore.score)} border-current`}>
                            Score: {categoryScore.score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryResults.map(({ biomarker, result }) => (
                      <BiomarkerCard
                        key={result.id}
                        biomarker={biomarker}
                        result={result}
                        gender={gender}
                        onClick={() => handleBiomarkerClick(biomarker, result)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50">
                  <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Strengths</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Liver enzymes (ALT, AST, GGT) are all within optimal range</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Blood sugar markers show excellent metabolic control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>CRP and uric acid at optimal levels - low inflammation</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Triglycerides slightly elevated - reduce refined carbs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>HDL could be higher for better cardiovascular protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Monitor fasting insulin for insulin sensitivity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <OrganTrendSection
            organ="liver"
            gender={gender}
            title="Liver Health Score Over Time"
            description="Track your liver health improvement journey"
            showMilestones
          />
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="mt-6">
          {activeTab === "risk" && <PredictiveHealthRisk />}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-6">
          <LiverGoalSetting currentResults={liverTestResults.map(r => r.result)} />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <LiverAIRecommendations />
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-6">
          <PopulationComparison
            results={liverTestResults.map(r => r.result)}
            gender={gender}
          />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <LiverTestScheduler />
          <EmailReminderService
            userEmail="sarah.johnson@example.com"
            userPhone="+61 412 345 678"
          />
        </TabsContent>
      </Tabs>

      {/* Biomarker Detail Dialog */}
      <BiomarkerDetailDialog
        biomarker={selectedBiomarker?.biomarker || null}
        result={selectedBiomarker?.result || null}
        history={[]} // No mock-data, so leave empty or implement API history if available
        gender={gender}
        open={!!selectedBiomarker}
        onOpenChange={(open) => !open && setSelectedBiomarker(null)}
      />
    </div>
  );
}
