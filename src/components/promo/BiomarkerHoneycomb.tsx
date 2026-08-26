"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface Biomarker {
  id: string;
  name: string;
  fullName: string;
  description: string;
  categories: string[];
}

const biomarkers: Biomarker[] = [
  // Heart & Cardiovascular
  { id: "LDL", name: "LDL", fullName: "LDL Cholesterol", description: "Low-density lipoprotein cholesterol, often called 'bad' cholesterol. High levels can lead to plaque buildup in arteries.", categories: ["heart", "metabolism"] },
  { id: "HDL", name: "HDL", fullName: "HDL Cholesterol", description: "High-density lipoprotein cholesterol, known as 'good' cholesterol. Helps remove other forms of cholesterol from bloodstream.", categories: ["heart", "metabolism"] },
  { id: "TC", name: "TC", fullName: "Total Cholesterol", description: "The total amount of cholesterol in your blood, including LDL, HDL, and other lipid components.", categories: ["heart"] },
  { id: "TG", name: "TG", fullName: "Triglycerides", description: "A type of fat in your blood. High levels may increase risk of heart disease.", categories: ["heart", "metabolism"] },
  { id: "hsCRP", name: "hsCRP", fullName: "High-Sensitivity CRP", description: "Measures low-grade inflammation. Your doctor can review this alongside lipids when looking at cardiovascular risk.", categories: ["heart", "inflammation", "biological-age"] },

  // Metabolism
  { id: "HbA1c", name: "HbA1c", fullName: "Glycated Haemoglobin", description: "Shows your average blood sugar levels over the past 2-3 months. Key marker for diabetes risk.", categories: ["metabolism"] },
  { id: "Gluc", name: "Gluc", fullName: "Fasting Glucose", description: "Measures blood sugar after fasting. Used to screen for diabetes and prediabetes.", categories: ["metabolism", "biological-age"] },
  { id: "Ins", name: "Ins", fullName: "Fasting Insulin", description: "Measures insulin levels after fasting. Helps assess insulin resistance and metabolic health.", categories: ["metabolism", "hormones"] },
  { id: "UA", name: "UA", fullName: "Uric Acid", description: "A waste product from purine breakdown. High levels can lead to gout and may indicate metabolic issues.", categories: ["metabolism", "liver"] },
  { id: "HOMA", name: "HOMA", fullName: "HOMA-IR Score", description: "Calculated metric that estimates insulin resistance based on fasting glucose and insulin levels.", categories: ["metabolism"] },

  // Hormones & Thyroid
  { id: "TSH", name: "TSH", fullName: "Thyroid Stimulating Hormone", description: "Controls thyroid function. Abnormal levels may indicate hypo- or hyperthyroidism.", categories: ["hormones", "thyroid"] },
  { id: "fT4", name: "fT4", fullName: "Free Thyroxine", description: "Active thyroid hormone that regulates metabolism, energy, and body temperature.", categories: ["hormones", "thyroid"] },
  { id: "fT3", name: "fT3", fullName: "Free Triiodothyronine", description: "The most active thyroid hormone. Important for metabolism and energy production.", categories: ["hormones", "thyroid"] },
  { id: "COR", name: "COR", fullName: "Cortisol", description: "The primary stress hormone. Affects metabolism, immune response, and blood pressure.", categories: ["hormones"] },
  { id: "DHEA", name: "DHEA", fullName: "DHEA-Sulfate", description: "A precursor hormone that converts to oestrogen and testosterone. Declines with age.", categories: ["hormones"] },
  { id: "E2", name: "E2", fullName: "Oestradiol", description: "The primary form of oestrogen. Important for reproductive health, bone density, and mood.", categories: ["hormones"] },
  { id: "Prog", name: "Prog", fullName: "Progesterone", description: "Hormone involved in menstrual cycle and pregnancy. Also affects mood and sleep.", categories: ["hormones"] },
  { id: "TT", name: "TT", fullName: "Total Testosterone", description: "Primary male sex hormone, also important for women. Affects energy, mood, and libido.", categories: ["hormones"] },
  { id: "FSH", name: "FSH", fullName: "Follicle Stimulating Hormone", description: "Regulates reproductive processes. Levels change throughout menstrual cycle and menopause.", categories: ["hormones"] },
  { id: "LH", name: "LH", fullName: "Luteinising Hormone", description: "Triggers ovulation and supports reproductive health. Important for fertility assessment.", categories: ["hormones"] },
  { id: "SHBG", name: "SHBG", fullName: "Sex Hormone Binding Globulin", description: "Protein that binds to sex hormones. Affects how much hormone is available for use.", categories: ["hormones"] },

  // Vitamins & Nutrients
  { id: "B12", name: "aB12", fullName: "Active B12", description: "Holotranscobalamin, the usable form of B12. Used on Essential for nerve function, red-cell production and energy.", categories: ["nutrients"] },
  { id: "Fe", name: "Fe", fullName: "Iron", description: "Essential mineral for oxygen transport in blood. Deficiency causes fatigue and anaemia.", categories: ["nutrients", "blood"] },
  { id: "Fer", name: "Fer", fullName: "Ferritin", description: "Protein that stores iron. Best indicator of total body iron stores.", categories: ["nutrients", "blood"] },

  // Liver & Kidney
  { id: "ALT", name: "ALT", fullName: "Alanine Transaminase", description: "Liver enzyme. Elevated levels may indicate liver damage or disease.", categories: ["liver"] },
  { id: "AST", name: "AST", fullName: "Aspartate Transaminase", description: "Enzyme found in liver and heart. High levels may indicate organ damage.", categories: ["liver"] },
  { id: "GGT", name: "GGT", fullName: "Gamma-Glutamyl Transferase", description: "Liver enzyme sensitive to alcohol consumption and bile duct problems.", categories: ["liver"] },
  { id: "ALP", name: "ALP", fullName: "Alkaline Phosphatase", description: "Enzyme found in liver and bones. Helps assess liver and bone health.", categories: ["liver", "biological-age"] },
  { id: "Bil", name: "Bil", fullName: "Bilirubin", description: "Waste product from red blood cell breakdown. High levels may cause jaundice.", categories: ["liver", "blood"] },
  { id: "Alb", name: "Alb", fullName: "Albumin", description: "Protein made by the liver. Low levels may indicate liver or kidney problems.", categories: ["liver", "biological-age"] },
  { id: "Crea", name: "Crea", fullName: "Creatinine", description: "Waste product from muscle metabolism. Used to assess kidney function.", categories: ["kidney", "biological-age"] },
  { id: "eGFR", name: "eGFR", fullName: "Estimated GFR", description: "Calculated estimate of how well your kidneys filter waste from blood.", categories: ["kidney"] },
  { id: "BUN", name: "BUN", fullName: "Urea", description: "Waste product from protein metabolism. Used with creatinine to assess kidney function.", categories: ["kidney"] },
  { id: "Na", name: "Na", fullName: "Sodium", description: "Main electrolyte that helps control fluid balance and nerve function. Part of the EUC kidney panel.", categories: ["kidney"] },
  { id: "K", name: "K", fullName: "Potassium", description: "Electrolyte that supports heart rhythm and muscle function. Part of the EUC kidney panel.", categories: ["kidney"] },
  { id: "Cl", name: "Cl", fullName: "Chloride", description: "Electrolyte that works with sodium and bicarbonate for acid-base balance. Part of the EUC kidney panel.", categories: ["kidney"] },
  { id: "HCO3", name: "HCO3", fullName: "Bicarbonate", description: "Reflects acid-base balance. Reported with electrolytes on the EUC kidney panel.", categories: ["kidney"] },
  { id: "Ca", name: "Ca", fullName: "Calcium", description: "Mineral involved in bone, nerve and muscle function. Requested with the Essential kidney chemistry.", categories: ["kidney"] },
  { id: "AG", name: "AG", fullName: "Anion Gap", description: "Calculated from sodium, chloride and bicarbonate. Helps interpret acid-base balance.", categories: ["kidney"] },
  { id: "CorrCa", name: "Corr Ca", fullName: "Corrected Calcium", description: "Calcium adjusted for albumin. Calculated from Essential calcium and albumin.", categories: ["kidney"] },
  { id: "Osm", name: "Osm", fullName: "Calculated Osmolality", description: "Estimated from sodium, glucose and urea. Used with electrolytes to assess fluid balance.", categories: ["kidney"] },
  { id: "UACR", name: "UACR", fullName: "Urine Albumin/Creatinine", description: "Protein in a morning urine sample compared with creatinine. An early kidney marker on Essential.", categories: ["kidney"] },

  // Blood & Inflammation
  { id: "WBC", name: "WBC", fullName: "White Blood Cell Count", description: "Measures immune cells. High or low levels may indicate infection or immune issues.", categories: ["blood", "inflammation", "biological-age"] },
  { id: "RBC", name: "RBC", fullName: "Red Blood Cell Count", description: "Cells that carry oxygen. Low count indicates anaemia.", categories: ["blood"] },
  { id: "Hgb", name: "Hgb", fullName: "Haemoglobin", description: "Protein in red blood cells that carries oxygen. Low levels indicate anaemia.", categories: ["blood"] },
  { id: "Hct", name: "Hct", fullName: "Haematocrit", description: "Percentage of blood volume made up of red blood cells.", categories: ["blood"] },
  { id: "Plt", name: "Plt", fullName: "Platelet Count", description: "Cells that help blood clot. Abnormal levels may indicate bleeding disorders.", categories: ["blood"] },

  // Biological age, Levine PhenoAge cores on Essential + calculated scores
  { id: "MCV", name: "MCV", fullName: "Mean Cell Volume", description: "Average red-cell size from the full blood count. One of the nine blood inputs used to estimate PhenoAge.", categories: ["blood", "biological-age"] },
  { id: "RDW", name: "RDW", fullName: "Red Cell Distribution Width", description: "Variation in red-cell size from the full blood count. A Levine core input for the biological-age score.", categories: ["blood", "biological-age"] },
  { id: "AgeAccel", name: "Age Δ", fullName: "Age Acceleration", description: "PhenoAge minus calendar age, in years. Negative means the score is at or below your chronological age.", categories: ["biological-age"] },
];

const extraColumn: Biomarker[] = [
  { id: "NonHDL", name: "nHDL", fullName: "Non-HDL Cholesterol", description: "Total cholesterol minus HDL. Captures all atherogenic particles in one number.", categories: ["heart"] },
  { id: "TCHDL", name: "TC/H", fullName: "Cholesterol/HDL Ratio", description: "Calculated in your portal from total cholesterol and HDL. A lipid risk ratio from the same draw.", categories: ["heart"] },
  { id: "TP", name: "TP", fullName: "Total Protein", description: "Albumin plus globulin. Used with liver enzymes to assess hepatic protein production.", categories: ["liver"] },
  { id: "DBil", name: "DBil", fullName: "Direct Bilirubin", description: "Conjugated bilirubin processed by the liver. Helps localise the cause of a raised total bilirubin.", categories: ["liver"] },
  { id: "Glob", name: "Glob", fullName: "Globulin", description: "Calculated as total protein minus albumin. Reflects immune and liver protein balance.", categories: ["liver"] },
  { id: "FIB4", name: "FIB-4", fullName: "FIB-4 Score", description: "Calculated from age, AST, ALT and platelets. Your doctor can use it as one non-invasive fibrosis context score, not a diagnosis.", categories: ["liver"] },
  { id: "APRI", name: "APRI", fullName: "APRI Score", description: "Calculated from AST and platelets. Another fibrosis context score from the same Essential liver and blood results.", categories: ["liver"] },
  { id: "ASTALT", name: "A/A", fullName: "AST/ALT Ratio", description: "Calculated from AST and ALT. Your doctor may review the pattern alongside other liver enzymes.", categories: ["liver"] },
  { id: "TIBC", name: "TIBC", fullName: "Total Iron Binding Capacity", description: "How much iron the blood can carry. Rises in iron deficiency and falls with inflammation.", categories: ["nutrients"] },
  { id: "TSat", name: "TSat", fullName: "Transferrin Saturation", description: "Percentage of transferrin occupied by iron. Calculated from iron and TIBC.", categories: ["nutrients"] },
];

const fbeExtras: Biomarker[] = [
  { id: "MCH", name: "MCH", fullName: "Mean Cell Haemoglobin", description: "Average amount of haemoglobin in each red cell. Reported with the FBE.", categories: ["blood"] },
  { id: "MCHC", name: "MCHC", fullName: "Mean Cell Haemoglobin Concentration", description: "Haemoglobin concentration inside red cells. Reported with the FBE.", categories: ["blood"] },
  { id: "Neut", name: "Neut", fullName: "Neutrophils", description: "White cells that respond first to bacterial infection. Part of the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "Lymph", name: "Lymph", fullName: "Lymphocytes", description: "White cells involved in immune memory and viral response. Part of the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "Mono", name: "Mono", fullName: "Monocytes", description: "White cells that help clear debris and chronic infection. Part of the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "Eos", name: "Eos", fullName: "Eosinophils", description: "White cells linked to allergy and parasite response. Part of the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "Baso", name: "Baso", fullName: "Basophils", description: "White cells involved in allergic and inflammatory responses. Part of the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "NeutPct", name: "Neut%", fullName: "Neutrophil %", description: "Neutrophils as a share of white cells. Reported with the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "MonoPct", name: "Mono%", fullName: "Monocyte %", description: "Monocytes as a share of white cells. Reported with the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "EosPct", name: "Eos%", fullName: "Eosinophil %", description: "Eosinophils as a share of white cells. Reported with the FBE differential.", categories: ["blood", "inflammation"] },
  { id: "BasoPct", name: "Baso%", fullName: "Basophil %", description: "Basophils as a share of white cells. Reported with the FBE differential.", categories: ["blood", "inflammation"] },
];

const categories = [
  { id: "heart", name: "Heart", color: "bg-red-500" },
  { id: "metabolism", name: "Metabolism", color: "bg-amber-500" },
  { id: "hormones", name: "Hormones", color: "bg-pink-500" },
  { id: "thyroid", name: "Thyroid", color: "bg-purple-500" },
  { id: "nutrients", name: "Nutrients", color: "bg-teal-500" },
  { id: "liver", name: "Liver", color: "bg-emerald-500" },
  { id: "kidney", name: "Kidney", color: "bg-sky-500" },
  { id: "blood", name: "Blood", color: "bg-rose-500" },
  { id: "biological-age", name: "Biological age", color: "bg-indigo-500" },
  { id: "inflammation", name: "Inflammation & Stress", color: "bg-orange-500" },
];

/** Compact metabolic-care panel, Essential markers only (no Vitamin D). */
export const METABOLIC_PANEL_HONEYCOMB_IDS = [
  "Gluc",
  "HbA1c",
  "Ins",
  "HOMA",
  "TG",
  "HDL",
  "LDL",
  "ALT",
  "AST",
  "GGT",
  "hsCRP",
  "UA",
  "Fer",
] as const;

/** Heart Health Panel, Essential measured lipids + hs-CRP, plus calculated lipid ratios. */
export const HEART_PANEL_HONEYCOMB_IDS = [
  "hsCRP",
  "HDL",
  "LDL",
  "TC",
  "TG",
  "NonHDL",
  "TCHDL",
] as const;

/** Men's Health, Essential markers only. Hormone panel and PSA sit outside this set. */
export const MENS_HEALTH_PANEL_HONEYCOMB_IDS = [
  "TSH",
  "fT4",
  "fT3",
  "ALT",
  "AST",
  "GGT",
  "Crea",
  "eGFR",
  "LDL",
  "HDL",
  "TG",
  "Gluc",
  "HbA1c",
  "Ins",
  "Fer",
  "B12",
  "hsCRP",
  "Hgb",
] as const;

/** Liver Health Panel, Essential LFTs, metabolic, lipids, plus calculated fibrosis scores. */
export const LIVER_PANEL_HONEYCOMB_IDS = [
  "ALT",
  "AST",
  "GGT",
  "ALP",
  "Bil",
  "Alb",
  "Plt",
  "Gluc",
  "HbA1c",
  "Ins",
  "TG",
  "HDL",
  "LDL",
  "hsCRP",
  "Fer",
  "UA",
  "FIB4",
  "APRI",
] as const;

const ROSE_HEX_BACKGROUNDS = [
  "linear-gradient(135deg, #9f1239 0%, #be123c 100%)",
  "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
  "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",
  "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
  "linear-gradient(135deg, #9f1239 0%, #fb7185 100%)",
  "linear-gradient(135deg, #881337 0%, #e11d48 100%)",
] as const;

const SAGE_HEX_BACKGROUNDS = [
  "linear-gradient(135deg, #2c3628 0%, #4a6243 100%)",
  "linear-gradient(135deg, #34412f 0%, #5c7a52 100%)",
  "linear-gradient(135deg, #3d4f38 0%, #7e9a72 100%)",
  "linear-gradient(135deg, #4a6243 0%, #6b8a62 100%)",
  "linear-gradient(135deg, #2c3628 0%, #5c7a52 100%)",
  "linear-gradient(135deg, #34412f 0%, #7e9a72 100%)",
  "linear-gradient(135deg, #3d4f38 0%, #a8bb9e 100%)",
] as const;

interface BiomarkerHoneycombProps {
  defaultCategory?: string;
  /** Left-align tabs / honeycomb for split layouts */
  align?: "center" | "start";
  /** Show only these honeycomb IDs, in this order */
  includeIds?: readonly string[];
  showCategoryTabs?: boolean;
  showCalculatedFooter?: boolean;
  /** Fill every hex as in-panel rather than category-highlighting */
  highlightAll?: boolean;
  /** Hex fill, default sage, rose for Heart, sage shades for Liver */
  palette?: "default" | "rose" | "sage";
}

export function BiomarkerHoneycomb({
  defaultCategory = "heart",
  align = "center",
  includeIds,
  showCategoryTabs = true,
  showCalculatedFooter = true,
  highlightAll = false,
  palette = "default",
}: BiomarkerHoneycombProps) {
  const alignStart = align === "start";
  const initialCategory = defaultCategory === "stress" ? "inflammation" : defaultCategory;
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [hoveredBiomarker, setHoveredBiomarker] = useState<Biomarker | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0,
    below: false,
    arrowOffset: 0,
  });

  const handleMouseEnter = (biomarker: Biomarker, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const pad = 16;
    const tooltipWidth = Math.min(240, window.innerWidth - pad * 2);
    const centerX = rect.left + rect.width / 2;
    const minX = tooltipWidth / 2 + pad;
    const maxX = window.innerWidth - tooltipWidth / 2 - pad;
    const x = Math.min(maxX, Math.max(minX, centerX));
    const maxArrow = tooltipWidth / 2 - 16;
    const below = rect.top < 150;
    setTooltipPosition({
      x,
      y: below ? rect.bottom + 10 : rect.top - 10,
      below,
      arrowOffset: Math.min(maxArrow, Math.max(-maxArrow, centerX - x)),
    });
    setHoveredBiomarker(biomarker);
  };

  const handleMouseLeave = () => {
    setHoveredBiomarker(null);
  };

  const isActive = (biomarker: Biomarker) => {
    if (highlightAll) return true;
    return biomarker.categories.includes(activeCategory);
  };

  const catalog = [...biomarkers, ...extraColumn, ...fbeExtras];
  const allMarkers = includeIds
    ? includeIds.flatMap((id) => {
        const marker = catalog.find((item) => item.id === id);
        return marker ? [marker] : [];
      })
    : catalog;
  const compact = Boolean(includeIds);

  const chunkRows = (evenSize: number, oddSize: number) => {
    const next: Biomarker[][] = [];
    let index = 0;
    let rowIndex = 0;
    while (index < allMarkers.length) {
      const size = rowIndex % 2 === 0 ? evenSize : oddSize;
      next.push(allMarkers.slice(index, index + size));
      index += size;
      rowIndex += 1;
    }
    return next;
  };

  const compactTight = compact && allMarkers.length <= 8;
  const mobileRows = chunkRows(
    compactTight ? 4 : compact ? 4 : 6,
    compactTight ? 3 : compact ? 5 : 7,
  );
  const desktopRows = chunkRows(
    compactTight ? 4 : compact ? 5 : 8,
    compactTight ? 3 : compact ? 4 : 9,
  );

  const renderRows = (gridRows: Biomarker[][]) =>
    gridRows.map((row, rowIndex) => (
      <div
        key={rowIndex}
        className={`flex gap-1 ${alignStart ? "justify-start" : "justify-center"}`}
        style={{
          marginLeft: alignStart && rowIndex % 2 === 1 ? "28px" : "0",
        }}
      >
        {row.map((biomarker, colIndex) => {
          const active = isActive(biomarker);
          const hexIndex = gridRows
            .slice(0, rowIndex)
            .reduce((sum, r) => sum + r.length, 0) + colIndex;
          const roseFill = ROSE_HEX_BACKGROUNDS[hexIndex % ROSE_HEX_BACKGROUNDS.length];
          const sageFill = SAGE_HEX_BACKGROUNDS[hexIndex % SAGE_HEX_BACKGROUNDS.length];
          const activeFill =
            palette === "rose"
              ? roseFill
              : palette === "sage"
                ? sageFill
                : "linear-gradient(135deg, #34412f 0%, #4a6243 100%)";
          return (
            <div
              key={biomarker.id}
              className="relative shrink-0"
              onMouseEnter={(e) => handleMouseEnter(biomarker, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`
                  w-12 h-14 lg:w-14 lg:h-16
                  flex items-center justify-center
                  cursor-pointer
                  transition-transform duration-300
                  hover:scale-105 hover:z-10
                  ${active
                    ? "text-white"
                    : "text-[#7e9a72] hover:text-[#5c7a52]"
                  }
                `}
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: active
                    ? activeFill
                    : "#e6ebe3",
                }}
              >
                <span className="text-xs lg:text-sm font-medium">
                  {biomarker.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    ));

  return (
    <div
      className={
        compact && !alignStart
          ? "w-max max-w-full mx-auto"
          : "w-full min-w-0 overflow-x-hidden"
      }
    >
      {showCategoryTabs && (
        <div
          className={`flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-10 ${
            alignStart ? "justify-start" : "justify-center"
          }`}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? "bg-[#34412f] text-white"
                  : "bg-[#e6ebe3] text-[#5c7a52] hover:bg-[#cdd8c6]"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <div
        className={`relative min-w-0 ${compact ? "py-0.5" : "py-2 sm:py-4"} ${
          compact && !alignStart ? "w-max mx-auto" : "w-full"
        }`}
      >
        <div
          className={`min-w-0 overflow-y-hidden py-1 ${
            compact && !alignStart
              ? "overflow-visible"
              : "w-full overflow-x-auto overflow-y-hidden lg:overflow-visible"
          }`}
        >
          <div
            className={`flex w-max flex-col gap-1 lg:hidden ${
              alignStart ? "items-start min-w-full" : "items-center mx-auto"
            }`}
          >
            {renderRows(mobileRows)}
          </div>
          <div
            className={`hidden w-max flex-col gap-1 lg:flex ${
              alignStart ? "items-start min-w-full" : "items-center mx-auto"
            }`}
          >
            {renderRows(desktopRows)}
          </div>
        </div>

        {showCalculatedFooter && (
        <div
          className={`mt-5 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm text-[#5c7a52] ${
            alignStart ? "items-start" : "items-center justify-center"
          }`}
        >
          <span>Calculated metrics included:</span>
          <div className="flex flex-wrap justify-center gap-2">
            {["eGFR", "HOMA", "PhenoAge"].map((metric) => (
              <span
                key={metric}
                className="px-3 py-1 rounded-full bg-[#f4f7f2] border border-[#cdd8c6] text-[#34412f] text-xs"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>
        )}

        {showCategoryTabs && activeCategory === "hormones" && (
          <p
            className={`mt-3 text-[11px] leading-snug text-[#5c7a52] ${
              alignStart ? "text-left" : "text-center"
            }`}
          >
            Available as an add-on for men&apos;s and women&apos;s health programs.
          </p>
        )}
      </div>

      {hoveredBiomarker &&
        createPortal(
          <div
            className="fixed z-[80] w-60 max-w-[calc(100vw-32px)] bg-white rounded-xl shadow-xl border border-[#e6ebe3] p-3 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: tooltipPosition.below
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
          >
            <div className="flex items-start gap-2.5 mb-1.5">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-white text-[11px] font-medium flex-shrink-0"
                style={{
                  background:
                    palette === "rose"
                      ? "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)"
                      : palette === "sage"
                        ? "linear-gradient(135deg, #34412f 0%, #5c7a52 100%)"
                        : "linear-gradient(135deg, #34412f 0%, #4a6243 100%)",
                }}
              >
                {hoveredBiomarker.name}
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-[#2c3628] text-sm leading-snug">
                  {hoveredBiomarker.fullName}
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hoveredBiomarker.categories.map((cat) => {
                    const category = categories.find(c => c.id === cat);
                    return (
                      <span
                        key={cat}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] text-white ${category?.color}`}
                      >
                        {category?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#5c7a52] leading-relaxed break-words">
              {hoveredBiomarker.description}
            </p>
            <div
              className="absolute w-3.5 h-3.5 bg-white"
              style={
                tooltipPosition.below
                  ? {
                      top: "-7px",
                      left: `calc(50% + ${tooltipPosition.arrowOffset}px)`,
                      transform: "translateX(-50%) rotate(45deg)",
                      borderLeft: "1px solid #e6ebe3",
                      borderTop: "1px solid #e6ebe3",
                    }
                  : {
                      bottom: "-7px",
                      left: `calc(50% + ${tooltipPosition.arrowOffset}px)`,
                      transform: "translateX(-50%) rotate(45deg)",
                      borderRight: "1px solid #e6ebe3",
                      borderBottom: "1px solid #e6ebe3",
                    }
              }
            />
          </div>,
          document.body
        )}

    </div>
  );
}
