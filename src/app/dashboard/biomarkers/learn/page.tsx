"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Info, AlertTriangle, CheckCircle, AlertCircle, ShieldAlert, BookOpen } from "lucide-react";

interface Biomarker {
  id: string;
  name: string;
  fullName: string;
  description: string;
  categories: string[];
  unit: string;
  optimalLow: number;
  optimalHigh: number;
  rangeLow: number;
  rangeHigh: number;
  sampleValue?: number;
  whatItMeans: {
    low: string;
    optimal: string;
    high: string;
  };
}

const biomarkers: Biomarker[] = [
  // Heart & Cardiovascular
  {
    id: "LDL", name: "LDL", fullName: "LDL Cholesterol",
    description: "Low-density lipoprotein cholesterol, often called 'bad' cholesterol. High levels can lead to plaque buildup in arteries.",
    categories: ["heart", "metabolism"],
    unit: "mmol/L",
    rangeLow: 0.5,
    rangeHigh: 5.0,
    optimalLow: 0.5,
    optimalHigh: 2.6,
    sampleValue: 2.1,
    whatItMeans: {
      low: "Very low LDL is generally not a concern but may warrant investigation if extremely low.",
      optimal: "Your LDL cholesterol is within a healthy range, indicating good cardiovascular health.",
      high: "Elevated LDL increases risk of arterial plaque buildup and heart disease. Lifestyle changes or medication may help."
    }
  },
  {
    id: "HDL", name: "HDL", fullName: "HDL Cholesterol",
    description: "High-density lipoprotein cholesterol, known as 'good' cholesterol. Helps remove other forms of cholesterol from bloodstream.",
    categories: ["heart", "metabolism"],
    unit: "mmol/L",
    rangeLow: 0.5,
    rangeHigh: 3.0,
    optimalLow: 1.2,
    optimalHigh: 3.0,
    sampleValue: 1.6,
    whatItMeans: {
      low: "Low HDL increases cardiovascular risk. Exercise and healthy fats can help raise HDL levels.",
      optimal: "Good HDL levels help protect against heart disease by removing excess cholesterol.",
      high: "High HDL is generally protective and associated with lower cardiovascular risk."
    }
  },
  {
    id: "TC", name: "TC", fullName: "Total Cholesterol",
    description: "The total amount of cholesterol in your blood, including LDL, HDL, and other lipid components.",
    categories: ["heart"],
    unit: "mmol/L",
    rangeLow: 2.0,
    rangeHigh: 8.0,
    optimalLow: 3.5,
    optimalHigh: 5.2,
    sampleValue: 4.8,
    whatItMeans: {
      low: "Very low cholesterol may indicate malnutrition or liver issues.",
      optimal: "Your total cholesterol is within a healthy range.",
      high: "Elevated total cholesterol may increase heart disease risk. The LDL/HDL ratio is also important."
    }
  },
  {
    id: "TG", name: "TG", fullName: "Triglycerides",
    description: "A type of fat in your blood. High levels may increase risk of heart disease.",
    categories: ["heart", "metabolism"],
    unit: "mmol/L",
    rangeLow: 0.2,
    rangeHigh: 4.0,
    optimalLow: 0.2,
    optimalHigh: 1.7,
    sampleValue: 1.2,
    whatItMeans: {
      low: "Low triglycerides are generally healthy and not a concern.",
      optimal: "Your triglyceride levels indicate good metabolic health.",
      high: "Elevated triglycerides can increase heart disease risk. Reducing sugar and alcohol intake may help."
    }
  },
  {
    id: "hsCRP", name: "hsCRP", fullName: "High-Sensitivity CRP",
    description: "Measures inflammation in the body. Elevated levels may indicate increased cardiovascular risk.",
    categories: ["heart", "inflammation"],
    unit: "mg/L",
    rangeLow: 0,
    rangeHigh: 15,
    optimalLow: 0,
    optimalHigh: 1.0,
    sampleValue: 0.8,
    whatItMeans: {
      low: "Low CRP indicates minimal inflammation in the body.",
      optimal: "Your inflammation markers are within a healthy range.",
      high: "Elevated CRP suggests inflammation, which may increase cardiovascular and disease risk."
    }
  },

  // Metabolism
  {
    id: "HbA1c", name: "HbA1c", fullName: "Glycated Haemoglobin",
    description: "Shows your average blood sugar levels over the past 2-3 months. Key marker for diabetes risk.",
    categories: ["metabolism"],
    unit: "%",
    rangeLow: 4.0,
    rangeHigh: 10.0,
    optimalLow: 4.0,
    optimalHigh: 5.6,
    sampleValue: 5.2,
    whatItMeans: {
      low: "Very low HbA1c may indicate frequent low blood sugar episodes.",
      optimal: "Your blood sugar control over the past 2-3 months has been excellent.",
      high: "Elevated HbA1c indicates prediabetes or diabetes risk. Dietary changes and exercise can help."
    }
  },
  {
    id: "Gluc", name: "Gluc", fullName: "Fasting Glucose",
    description: "Measures blood sugar after fasting. Used to screen for diabetes and prediabetes.",
    categories: ["metabolism"],
    unit: "mmol/L",
    rangeLow: 2.5,
    rangeHigh: 12.0,
    optimalLow: 3.9,
    optimalHigh: 5.5,
    sampleValue: 4.8,
    whatItMeans: {
      low: "Low fasting glucose may cause fatigue, shakiness, and difficulty concentrating.",
      optimal: "Your fasting blood sugar is within a healthy range.",
      high: "Elevated fasting glucose suggests insulin resistance or diabetes risk."
    }
  },
  {
    id: "Ins", name: "Ins", fullName: "Fasting Insulin",
    description: "Measures insulin levels after fasting. Helps assess insulin resistance and metabolic health.",
    categories: ["metabolism", "hormones"],
    unit: "mIU/L",
    rangeLow: 1,
    rangeHigh: 40,
    optimalLow: 2,
    optimalHigh: 12,
    sampleValue: 8,
    whatItMeans: {
      low: "Very low insulin may indicate pancreatic dysfunction or Type 1 diabetes.",
      optimal: "Your insulin levels suggest good metabolic function and insulin sensitivity.",
      high: "Elevated insulin often indicates insulin resistance, a precursor to Type 2 diabetes."
    }
  },
  {
    id: "HOMA", name: "HOMA", fullName: "HOMA-IR Score",
    description: "Calculated metric that estimates insulin resistance based on fasting glucose and insulin levels.",
    categories: ["metabolism"],
    unit: "score",
    rangeLow: 0,
    rangeHigh: 5,
    optimalLow: 0,
    optimalHigh: 1.4,
    sampleValue: 1.1,
    whatItMeans: {
      low: "Low HOMA-IR indicates excellent insulin sensitivity.",
      optimal: "Your insulin resistance score is within a healthy range.",
      high: "Elevated HOMA-IR suggests insulin resistance. Weight loss and exercise can improve this."
    }
  },

  // Hormones & Thyroid
  {
    id: "TSH", name: "TSH", fullName: "Thyroid Stimulating Hormone",
    description: "Controls thyroid function. Abnormal levels may indicate hypo- or hyperthyroidism.",
    categories: ["hormones", "thyroid"],
    unit: "mIU/L",
    rangeLow: 0.1,
    rangeHigh: 8.0,
    optimalLow: 0.4,
    optimalHigh: 4.0,
    sampleValue: 2.1,
    whatItMeans: {
      low: "Low TSH may indicate an overactive thyroid (hyperthyroidism), causing weight loss and anxiety.",
      optimal: "Your thyroid function appears to be well-regulated.",
      high: "Elevated TSH often indicates an underactive thyroid (hypothyroidism), causing fatigue and weight gain."
    }
  },
  {
    id: "fT4", name: "fT4", fullName: "Free Thyroxine",
    description: "Active thyroid hormone that regulates metabolism, energy, and body temperature.",
    categories: ["hormones", "thyroid"],
    unit: "pmol/L",
    rangeLow: 5,
    rangeHigh: 25,
    optimalLow: 10,
    optimalHigh: 20,
    sampleValue: 14,
    whatItMeans: {
      low: "Low fT4 suggests hypothyroidism, which can cause fatigue, weight gain, and depression.",
      optimal: "Your thyroid hormone production is within a healthy range.",
      high: "Elevated fT4 may indicate hyperthyroidism, causing rapid heartbeat and weight loss."
    }
  },
  {
    id: "fT3", name: "fT3", fullName: "Free Triiodothyronine",
    description: "The most active thyroid hormone. Important for metabolism and energy production.",
    categories: ["hormones", "thyroid"],
    unit: "pmol/L",
    rangeLow: 2,
    rangeHigh: 8,
    optimalLow: 3.5,
    optimalHigh: 6.5,
    sampleValue: 4.8,
    whatItMeans: {
      low: "Low fT3 may cause fatigue, brain fog, and difficulty losing weight.",
      optimal: "Your active thyroid hormone is at a healthy level.",
      high: "Elevated fT3 can cause anxiety, rapid heartbeat, and difficulty sleeping."
    }
  },
  {
    id: "COR", name: "COR", fullName: "Cortisol (Morning)",
    description: "The primary stress hormone. Affects metabolism, immune response, and blood pressure.",
    categories: ["hormones", "stress"],
    unit: "nmol/L",
    rangeLow: 100,
    rangeHigh: 700,
    optimalLow: 170,
    optimalHigh: 500,
    sampleValue: 380,
    whatItMeans: {
      low: "Low cortisol may indicate adrenal insufficiency, causing fatigue and weakness.",
      optimal: "Your cortisol levels indicate healthy stress hormone regulation.",
      high: "Elevated cortisol suggests chronic stress, which can affect weight, sleep, and immune function."
    }
  },
  {
    id: "E2", name: "E2", fullName: "Oestradiol",
    description: "The primary form of oestrogen. Important for reproductive health, bone density, and mood.",
    categories: ["hormones"],
    unit: "pmol/L",
    rangeLow: 20,
    rangeHigh: 1500,
    optimalLow: 70,
    optimalHigh: 500,
    sampleValue: 285,
    whatItMeans: {
      low: "Low oestrogen can cause hot flashes, mood changes, and bone loss. Common in menopause.",
      optimal: "Your oestrogen levels are within a healthy range for your life stage.",
      high: "Elevated oestrogen may cause weight gain, mood swings, and menstrual irregularities."
    }
  },
  {
    id: "TT", name: "TT", fullName: "Total Testosterone",
    description: "Primary male sex hormone, also important for women. Affects energy, mood, and libido.",
    categories: ["hormones"],
    unit: "nmol/L",
    rangeLow: 0.2,
    rangeHigh: 3.5,
    optimalLow: 0.5,
    optimalHigh: 2.4,
    sampleValue: 1.2,
    whatItMeans: {
      low: "Low testosterone can cause fatigue, low libido, and mood changes.",
      optimal: "Your testosterone levels support energy, mood, and overall vitality.",
      high: "Elevated testosterone may indicate PCOS or other hormonal conditions."
    }
  },
  {
    id: "FSH", name: "FSH", fullName: "Follicle Stimulating Hormone",
    description: "Regulates reproductive processes. Levels change throughout menstrual cycle and menopause.",
    categories: ["hormones"],
    unit: "IU/L",
    rangeLow: 1,
    rangeHigh: 100,
    optimalLow: 3,
    optimalHigh: 10,
    sampleValue: 6.5,
    whatItMeans: {
      low: "Low FSH may indicate pituitary problems or pregnancy.",
      optimal: "Your FSH level is appropriate for your menstrual cycle phase.",
      high: "Elevated FSH often indicates menopause or diminished ovarian reserve."
    }
  },

  // Vitamins & Nutrients
  {
    id: "VitD", name: "VitD", fullName: "Vitamin D",
    description: "Essential for bone health, immune function, and mood. Many Australians are deficient.",
    categories: ["nutrients"],
    unit: "nmol/L",
    rangeLow: 10,
    rangeHigh: 200,
    optimalLow: 75,
    optimalHigh: 150,
    sampleValue: 82,
    whatItMeans: {
      low: "Low vitamin D can cause fatigue, bone pain, and weakened immunity. Supplementation often helps.",
      optimal: "Your vitamin D levels support bone health and immune function.",
      high: "Very high vitamin D (rare) can cause calcium buildup and kidney issues."
    }
  },
  {
    id: "B12", name: "B12", fullName: "Vitamin B12",
    description: "Vital for nerve function, red blood cell production, and energy. Vegans are at higher risk of deficiency.",
    categories: ["nutrients"],
    unit: "pmol/L",
    rangeLow: 100,
    rangeHigh: 800,
    optimalLow: 200,
    optimalHigh: 600,
    sampleValue: 420,
    whatItMeans: {
      low: "Low B12 causes fatigue, nerve problems, and anaemia. Common in vegans and older adults.",
      optimal: "Your B12 levels support healthy nerve function and energy production.",
      high: "High B12 is usually not harmful but may indicate liver disease in some cases."
    }
  },
  {
    id: "Fol", name: "Fol", fullName: "Folate",
    description: "B vitamin important for cell division and DNA synthesis. Critical during pregnancy.",
    categories: ["nutrients"],
    unit: "nmol/L",
    rangeLow: 5,
    rangeHigh: 50,
    optimalLow: 10,
    optimalHigh: 40,
    sampleValue: 28,
    whatItMeans: {
      low: "Low folate can cause anaemia and birth defects during pregnancy. Leafy greens are a good source.",
      optimal: "Your folate levels support healthy cell division and DNA synthesis.",
      high: "High folate is generally safe but may mask B12 deficiency."
    }
  },
  {
    id: "Fe", name: "Fe", fullName: "Serum Iron",
    description: "Essential mineral for oxygen transport in blood. Deficiency causes fatigue and anaemia.",
    categories: ["nutrients", "blood"],
    unit: "µmol/L",
    rangeLow: 5,
    rangeHigh: 35,
    optimalLow: 10,
    optimalHigh: 30,
    sampleValue: 18,
    whatItMeans: {
      low: "Low iron causes fatigue, weakness, and difficulty concentrating. Common in women.",
      optimal: "Your iron levels support healthy oxygen transport and energy.",
      high: "Elevated iron can damage organs over time. May indicate hemochromatosis."
    }
  },
  {
    id: "Fer", name: "Fer", fullName: "Ferritin",
    description: "Protein that stores iron. Best indicator of total body iron stores.",
    categories: ["nutrients", "blood"],
    unit: "µg/L",
    rangeLow: 10,
    rangeHigh: 300,
    optimalLow: 30,
    optimalHigh: 150,
    sampleValue: 65,
    whatItMeans: {
      low: "Low ferritin indicates depleted iron stores, often before anaemia develops.",
      optimal: "Your iron stores are adequate to support healthy body function.",
      high: "High ferritin may indicate iron overload, inflammation, or liver disease."
    }
  },
  {
    id: "Mg", name: "Mg", fullName: "Magnesium",
    description: "Involved in hundreds of enzymatic reactions. Affects muscle function, sleep, and stress.",
    categories: ["nutrients"],
    unit: "mmol/L",
    rangeLow: 0.5,
    rangeHigh: 1.2,
    optimalLow: 0.75,
    optimalHigh: 1.0,
    sampleValue: 0.88,
    whatItMeans: {
      low: "Low magnesium can cause muscle cramps, anxiety, and poor sleep.",
      optimal: "Your magnesium levels support muscle function and relaxation.",
      high: "Very high magnesium (rare) can cause nausea and irregular heartbeat."
    }
  },
  {
    id: "Zn", name: "Zn", fullName: "Zinc",
    description: "Essential for immune function, wound healing, and protein synthesis.",
    categories: ["nutrients"],
    unit: "µmol/L",
    rangeLow: 8,
    rangeHigh: 23,
    optimalLow: 11,
    optimalHigh: 18,
    sampleValue: 14,
    whatItMeans: {
      low: "Low zinc impairs immunity, wound healing, and can cause hair loss.",
      optimal: "Your zinc levels support immune function and tissue repair.",
      high: "Excess zinc can interfere with copper absorption and cause digestive issues."
    }
  },

  // Liver
  {
    id: "ALT", name: "ALT", fullName: "Alanine Transaminase",
    description: "Liver enzyme. Elevated levels may indicate liver damage or disease.",
    categories: ["liver"],
    unit: "U/L",
    rangeLow: 5,
    rangeHigh: 80,
    optimalLow: 7,
    optimalHigh: 35,
    sampleValue: 22,
    whatItMeans: {
      low: "Low ALT is normal and not a concern.",
      optimal: "Your liver enzyme levels indicate healthy liver function.",
      high: "Elevated ALT suggests liver inflammation or damage. Alcohol, medications, or fatty liver may be causes."
    }
  },
  {
    id: "AST", name: "AST", fullName: "Aspartate Transaminase",
    description: "Enzyme found in liver and heart. High levels may indicate organ damage.",
    categories: ["liver"],
    unit: "U/L",
    rangeLow: 5,
    rangeHigh: 80,
    optimalLow: 8,
    optimalHigh: 33,
    sampleValue: 25,
    whatItMeans: {
      low: "Low AST is normal and not concerning.",
      optimal: "Your AST levels suggest healthy liver and heart tissue.",
      high: "Elevated AST may indicate liver damage, heart issues, or muscle injury."
    }
  },
  {
    id: "GGT", name: "GGT", fullName: "Gamma-Glutamyl Transferase",
    description: "Liver enzyme sensitive to alcohol consumption and bile duct problems.",
    categories: ["liver"],
    unit: "U/L",
    rangeLow: 5,
    rangeHigh: 100,
    optimalLow: 5,
    optimalHigh: 40,
    sampleValue: 28,
    whatItMeans: {
      low: "Low GGT is normal and healthy.",
      optimal: "Your GGT levels indicate healthy liver and bile duct function.",
      high: "Elevated GGT often indicates liver stress from alcohol, medications, or bile duct issues."
    }
  },
  {
    id: "Bil", name: "Bil", fullName: "Bilirubin",
    description: "A yellow compound produced from the breakdown of red blood cells. Processed by the liver and excreted in bile. High levels may cause jaundice.",
    categories: ["liver", "blood"],
    unit: "µmol/L",
    rangeLow: 2,
    rangeHigh: 30,
    optimalLow: 3,
    optimalHigh: 17,
    sampleValue: 12,
    whatItMeans: {
      low: "Low bilirubin is generally not a concern and may simply reflect normal liver function.",
      optimal: "Your bilirubin levels indicate healthy red blood cell turnover and liver processing.",
      high: "Elevated bilirubin may indicate liver disease, bile duct obstruction, or increased red blood cell breakdown. Can cause yellowing of skin and eyes (jaundice)."
    }
  },

  // Kidney
  {
    id: "Crea", name: "Crea", fullName: "Creatinine",
    description: "Waste product from muscle metabolism. Used to assess kidney function.",
    categories: ["kidney"],
    unit: "µmol/L",
    rangeLow: 40,
    rangeHigh: 150,
    optimalLow: 45,
    optimalHigh: 90,
    sampleValue: 72,
    whatItMeans: {
      low: "Very low creatinine may indicate low muscle mass or malnutrition.",
      optimal: "Your kidney filtration appears to be functioning well.",
      high: "Elevated creatinine suggests reduced kidney function or dehydration."
    }
  },
  {
    id: "eGFR", name: "eGFR", fullName: "Estimated GFR",
    description: "Calculated estimate of how well your kidneys filter waste from blood.",
    categories: ["kidney"],
    unit: "mL/min",
    rangeLow: 15,
    rangeHigh: 120,
    optimalLow: 90,
    optimalHigh: 120,
    sampleValue: 98,
    whatItMeans: {
      low: "Low eGFR indicates reduced kidney function. Below 60 requires monitoring.",
      optimal: "Your kidneys are filtering waste effectively.",
      high: "High eGFR is generally positive, indicating good kidney function."
    }
  },

  // Blood
  {
    id: "Hgb", name: "Hgb", fullName: "Haemoglobin",
    description: "Protein in red blood cells that carries oxygen. Low levels indicate anaemia.",
    categories: ["blood"],
    unit: "g/L",
    rangeLow: 90,
    rangeHigh: 180,
    optimalLow: 120,
    optimalHigh: 160,
    sampleValue: 138,
    whatItMeans: {
      low: "Low haemoglobin (anaemia) causes fatigue, shortness of breath, and pale skin.",
      optimal: "Your oxygen-carrying capacity is healthy.",
      high: "Elevated haemoglobin may indicate dehydration or bone marrow conditions."
    }
  },
  {
    id: "WBC", name: "WBC", fullName: "White Blood Cell Count",
    description: "Measures immune cells. High or low levels may indicate infection or immune issues.",
    categories: ["blood", "inflammation"],
    unit: "×10⁹/L",
    rangeLow: 2,
    rangeHigh: 15,
    optimalLow: 4,
    optimalHigh: 11,
    sampleValue: 6.8,
    whatItMeans: {
      low: "Low WBC increases infection risk. May indicate bone marrow issues or autoimmune conditions.",
      optimal: "Your immune cell count is within a healthy range.",
      high: "Elevated WBC often indicates infection, inflammation, or stress response."
    }
  },
  {
    id: "Plt", name: "Plt", fullName: "Platelet Count",
    description: "Cells that help blood clot. Abnormal levels may indicate bleeding disorders.",
    categories: ["blood"],
    unit: "×10⁹/L",
    rangeLow: 100,
    rangeHigh: 450,
    optimalLow: 150,
    optimalHigh: 400,
    sampleValue: 245,
    whatItMeans: {
      low: "Low platelets increase bleeding risk. May indicate bone marrow issues or autoimmune conditions.",
      optimal: "Your platelet count supports normal blood clotting.",
      high: "Elevated platelets may increase clotting risk or indicate inflammation."
    }
  },

  // Inflammation
  {
    id: "ESR", name: "ESR", fullName: "Erythrocyte Sedimentation Rate",
    description: "Non-specific marker of inflammation in the body.",
    categories: ["inflammation"],
    unit: "mm/hr",
    rangeLow: 0,
    rangeHigh: 50,
    optimalLow: 0,
    optimalHigh: 20,
    sampleValue: 12,
    whatItMeans: {
      low: "Low ESR indicates minimal inflammation.",
      optimal: "Your inflammation levels are within a healthy range.",
      high: "Elevated ESR suggests inflammation, infection, or autoimmune activity."
    }
  },
  {
    id: "Hcy", name: "Hcy", fullName: "Homocysteine",
    description: "Amino acid linked to cardiovascular risk when elevated. Affected by B vitamins.",
    categories: ["inflammation", "heart"],
    unit: "µmol/L",
    rangeLow: 3,
    rangeHigh: 25,
    optimalLow: 5,
    optimalHigh: 12,
    sampleValue: 9,
    whatItMeans: {
      low: "Low homocysteine is generally healthy.",
      optimal: "Your homocysteine level indicates good cardiovascular health.",
      high: "Elevated homocysteine increases heart disease risk. B vitamins can help lower levels."
    }
  },
];

const categories = [
  { id: "all", name: "All Biomarkers", color: "bg-primary" },
  { id: "heart", name: "Heart", color: "bg-red-500" },
  { id: "metabolism", name: "Metabolism", color: "bg-amber-500" },
  { id: "hormones", name: "Hormones", color: "bg-pink-500" },
  { id: "thyroid", name: "Thyroid", color: "bg-purple-500" },
  { id: "nutrients", name: "Nutrients", color: "bg-teal-500" },
  { id: "liver", name: "Liver", color: "bg-emerald-500" },
  { id: "kidney", name: "Kidney", color: "bg-sky-500" },
  { id: "blood", name: "Blood", color: "bg-rose-500" },
  { id: "inflammation", name: "Inflammation", color: "bg-orange-500" },
  { id: "stress", name: "Stress", color: "bg-violet-500" },
];

function getStatus(biomarker: Biomarker): "low" | "optimal" | "high" {
  if (!biomarker.sampleValue) return "optimal";
  if (biomarker.sampleValue < biomarker.optimalLow) return "low";
  if (biomarker.sampleValue > biomarker.optimalHigh) return "high";
  return "optimal";
}

function getStatusColor(status: "low" | "optimal" | "high") {
  switch (status) {
    case "low": return "text-amber-600 bg-amber-50 border-amber-200";
    case "optimal": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "high": return "text-red-600 bg-red-50 border-red-200";
  }
}

function getStatusIcon(status: "low" | "optimal" | "high") {
  switch (status) {
    case "low": return <AlertTriangle className="w-4 h-4" />;
    case "optimal": return <CheckCircle className="w-4 h-4" />;
    case "high": return <AlertCircle className="w-4 h-4" />;
  }
}

export default function LearnBiomarkersPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBiomarker, setExpandedBiomarker] = useState<string | null>(null);
  const biomarkersListRef = useRef<HTMLDivElement>(null);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setExpandedBiomarker(null);
    setTimeout(() => {
      if (biomarkersListRef.current) {
        const yOffset = -120;
        const y = biomarkersListRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  };

  const filteredBiomarkers = biomarkers.filter((biomarker) => {
    const matchesCategory = activeCategory === "all" || biomarker.categories.includes(activeCategory);
    const matchesSearch = searchQuery === "" ||
      biomarker.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biomarker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biomarker.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedBiomarkers = categories.slice(1).reduce((acc, category) => {
    acc[category.id] = biomarkers.filter(b => b.categories.includes(category.id));
    return acc;
  }, {} as Record<string, Biomarker[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/biomarkers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Biomarkers
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-semibold text-foreground">Learn about Biomarkers</h1>
              <p className="text-sm text-muted-foreground">Explore 80+ biomarkers with reference ranges and health insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          <CheckCircle className="w-4 h-4" />
          Optimal Range
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm border border-amber-200">
          <AlertTriangle className="w-4 h-4" />
          Below Optimal
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm border border-red-200">
          <AlertCircle className="w-4 h-4" />
          Above Optimal
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Medical Disclaimer</p>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              This information is for <strong>educational purposes only</strong>. Reference ranges may vary between laboratories.
              Always consult a healthcare professional for interpretation of your results.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search biomarkers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? `${category.color} text-white`
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {category.name}
            {category.id !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({groupedBiomarkers[category.id]?.length || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Biomarkers List */}
      <div ref={biomarkersListRef}>
        {activeCategory === "all" ? (
          <div className="space-y-10">
            {categories.slice(1).map((category) => {
              const categoryBiomarkers = groupedBiomarkers[category.id];
              if (!categoryBiomarkers || categoryBiomarkers.length === 0) return null;

              const filtered = searchQuery
                ? categoryBiomarkers.filter(b =>
                    b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : categoryBiomarkers;

              if (filtered.length === 0) return null;

              return (
                <div key={category.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    <h2 className="text-xl font-serif text-foreground">
                      {category.name}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      ({filtered.length} biomarkers)
                    </span>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {filtered.map((biomarker) => (
                      <BiomarkerCard
                        key={biomarker.id}
                        biomarker={biomarker}
                        isExpanded={expandedBiomarker === biomarker.id}
                        onToggle={() => setExpandedBiomarker(
                          expandedBiomarker === biomarker.id ? null : biomarker.id
                        )}
                        categoryColor={category.color}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredBiomarkers.length} biomarkers
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            <div className="grid lg:grid-cols-2 gap-4">
              {filteredBiomarkers.map((biomarker) => {
                const category = categories.find(c => c.id === activeCategory);
                return (
                  <BiomarkerCard
                    key={biomarker.id}
                    biomarker={biomarker}
                    isExpanded={expandedBiomarker === biomarker.id}
                    onToggle={() => setExpandedBiomarker(
                      expandedBiomarker === biomarker.id ? null : biomarker.id
                    )}
                    categoryColor={category?.color || "bg-primary"}
                  />
                );
              })}
            </div>
          </div>
        )}

        {filteredBiomarkers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No biomarkers found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BiomarkerCard({
  biomarker,
  isExpanded,
  onToggle,
  categoryColor,
}: {
  biomarker: Biomarker;
  isExpanded: boolean;
  onToggle: () => void;
  categoryColor: string;
}) {
  const status = getStatus(biomarker);
  const statusColor = getStatusColor(status);
  const percentage = biomarker.sampleValue
    ? ((biomarker.sampleValue - biomarker.rangeLow) / (biomarker.rangeHigh - biomarker.rangeLow)) * 100
    : 50;
  const optimalStartPercent = ((biomarker.optimalLow - biomarker.rangeLow) / (biomarker.rangeHigh - biomarker.rangeLow)) * 100;
  const optimalEndPercent = ((biomarker.optimalHigh - biomarker.rangeLow) / (biomarker.rangeHigh - biomarker.rangeLow)) * 100;

  return (
    <div
      className={`bg-white rounded-xl border transition-all ${
        isExpanded
          ? "border-primary shadow-lg"
          : "border-border hover:border-primary/50 hover:shadow-md"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5"
      >
        <div className="flex items-start gap-4">
          {/* Biomarker Badge */}
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${categoryColor}`}
          >
            {biomarker.name}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-foreground">
                  {biomarker.fullName}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Reference: {biomarker.optimalLow} - {biomarker.optimalHigh} {biomarker.unit}
                </p>
              </div>

              {/* Sample Result Badge */}
              {biomarker.sampleValue && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${statusColor}`}>
                  {getStatusIcon(status)}
                  {biomarker.sampleValue} {biomarker.unit}
                </div>
              )}
            </div>

            {/* Range Visualization */}
            <div className="mt-4">
              <div className="relative h-3 bg-gradient-to-r from-amber-200 via-emerald-200 to-red-200 rounded-full overflow-hidden">
                {/* Optimal Zone Highlight */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-400/50"
                  style={{
                    left: `${optimalStartPercent}%`,
                    width: `${optimalEndPercent - optimalStartPercent}%`,
                  }}
                />

                {/* Sample Value Marker */}
                {biomarker.sampleValue && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-foreground shadow-md"
                    style={{
                      left: `calc(${Math.min(Math.max(percentage, 2), 98)}% - 8px)`,
                    }}
                  />
                )}
              </div>

              {/* Range Labels */}
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{biomarker.rangeLow}</span>
                <span className="text-emerald-600 font-medium">Optimal</span>
                <span>{biomarker.rangeHigh}</span>
              </div>
            </div>
          </div>

          <Info className={`w-5 h-5 flex-shrink-0 mt-1 transition-colors ${
            isExpanded ? "text-primary" : "text-muted-foreground/30"
          }`} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 mt-0">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {biomarker.description}
          </p>

          {/* What It Means Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">What different levels mean:</h4>

            <div className={`p-3 rounded-xl border ${
              status === "low" ? "bg-amber-50 border-amber-200" : "bg-muted border-border"
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${status === "low" ? "text-amber-600" : "text-muted-foreground/50"}`} />
                <div>
                  <p className={`text-xs font-medium ${status === "low" ? "text-amber-700" : "text-muted-foreground"}`}>
                    Below Optimal (&lt;{biomarker.optimalLow} {biomarker.unit})
                  </p>
                  <p className={`text-sm mt-0.5 ${status === "low" ? "text-amber-600" : "text-muted-foreground"}`}>
                    {biomarker.whatItMeans.low}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${
              status === "optimal" ? "bg-emerald-50 border-emerald-200" : "bg-muted border-border"
            }`}>
              <div className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 mt-0.5 ${status === "optimal" ? "text-emerald-600" : "text-muted-foreground/50"}`} />
                <div>
                  <p className={`text-xs font-medium ${status === "optimal" ? "text-emerald-700" : "text-muted-foreground"}`}>
                    Optimal ({biomarker.optimalLow} - {biomarker.optimalHigh} {biomarker.unit})
                  </p>
                  <p className={`text-sm mt-0.5 ${status === "optimal" ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {biomarker.whatItMeans.optimal}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${
              status === "high" ? "bg-red-50 border-red-200" : "bg-muted border-border"
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 mt-0.5 ${status === "high" ? "text-red-600" : "text-muted-foreground/50"}`} />
                <div>
                  <p className={`text-xs font-medium ${status === "high" ? "text-red-700" : "text-muted-foreground"}`}>
                    Above Optimal (&gt;{biomarker.optimalHigh} {biomarker.unit})
                  </p>
                  <p className={`text-sm mt-0.5 ${status === "high" ? "text-red-600" : "text-muted-foreground"}`}>
                    {biomarker.whatItMeans.high}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3 italic">
              This information is indicative only. Consult a healthcare professional for clinical advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
