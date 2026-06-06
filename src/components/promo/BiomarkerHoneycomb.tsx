"use client";

import { useState } from "react";

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
  { id: "ApoB", name: "ApoB", fullName: "Apolipoprotein B", description: "A protein that helps carry fat and cholesterol through your body. May be a better predictor of heart disease than LDL.", categories: ["heart"] },
  { id: "hsCRP", name: "hsCRP", fullName: "High-Sensitivity CRP", description: "Measures inflammation in the body. Elevated levels may indicate increased cardiovascular risk.", categories: ["heart", "inflammation"] },

  // Metabolism
  { id: "HbA1c", name: "HbA1c", fullName: "Glycated Haemoglobin", description: "Shows your average blood sugar levels over the past 2-3 months. Key marker for diabetes risk.", categories: ["metabolism"] },
  { id: "Gluc", name: "Gluc", fullName: "Fasting Glucose", description: "Measures blood sugar after fasting. Used to screen for diabetes and prediabetes.", categories: ["metabolism"] },
  { id: "Ins", name: "Ins", fullName: "Fasting Insulin", description: "Measures insulin levels after fasting. Helps assess insulin resistance and metabolic health.", categories: ["metabolism", "hormones"] },
  { id: "UA", name: "UA", fullName: "Uric Acid", description: "A waste product from purine breakdown. High levels can lead to gout and may indicate metabolic issues.", categories: ["metabolism", "liver"] },
  { id: "HOMA", name: "HOMA", fullName: "HOMA-IR Score", description: "Calculated metric that estimates insulin resistance based on fasting glucose and insulin levels.", categories: ["metabolism"] },

  // Hormones & Thyroid
  { id: "TSH", name: "TSH", fullName: "Thyroid Stimulating Hormone", description: "Controls thyroid function. Abnormal levels may indicate hypo- or hyperthyroidism.", categories: ["hormones", "thyroid"] },
  { id: "fT4", name: "fT4", fullName: "Free Thyroxine", description: "Active thyroid hormone that regulates metabolism, energy, and body temperature.", categories: ["hormones", "thyroid"] },
  { id: "fT3", name: "fT3", fullName: "Free Triiodothyronine", description: "The most active thyroid hormone. Important for metabolism and energy production.", categories: ["hormones", "thyroid"] },
  { id: "COR", name: "COR", fullName: "Cortisol", description: "The primary stress hormone. Affects metabolism, immune response, and blood pressure.", categories: ["hormones", "stress"] },
  { id: "DHEA", name: "DHEA", fullName: "DHEA-Sulfate", description: "A precursor hormone that converts to oestrogen and testosterone. Declines with age.", categories: ["hormones"] },
  { id: "E2", name: "E2", fullName: "Oestradiol", description: "The primary form of oestrogen. Important for reproductive health, bone density, and mood.", categories: ["hormones"] },
  { id: "Prog", name: "Prog", fullName: "Progesterone", description: "Hormone involved in menstrual cycle and pregnancy. Also affects mood and sleep.", categories: ["hormones"] },
  { id: "TT", name: "TT", fullName: "Total Testosterone", description: "Primary male sex hormone, also important for women. Affects energy, mood, and libido.", categories: ["hormones"] },
  { id: "FSH", name: "FSH", fullName: "Follicle Stimulating Hormone", description: "Regulates reproductive processes. Levels change throughout menstrual cycle and menopause.", categories: ["hormones"] },
  { id: "LH", name: "LH", fullName: "Luteinising Hormone", description: "Triggers ovulation and supports reproductive health. Important for fertility assessment.", categories: ["hormones"] },
  { id: "SHBG", name: "SHBG", fullName: "Sex Hormone Binding Globulin", description: "Protein that binds to sex hormones. Affects how much hormone is available for use.", categories: ["hormones"] },

  // Vitamins & Nutrients
  { id: "VitD", name: "VitD", fullName: "Vitamin D", description: "Essential for bone health, immune function, and mood. Many Australians are deficient.", categories: ["nutrients"] },
  { id: "B12", name: "B12", fullName: "Vitamin B12", description: "Vital for nerve function, red blood cell production, and energy. Vegans are at higher risk of deficiency.", categories: ["nutrients"] },
  { id: "Fol", name: "Fol", fullName: "Folate", description: "B vitamin important for cell division and DNA synthesis. Critical during pregnancy.", categories: ["nutrients"] },
  { id: "Fe", name: "Fe", fullName: "Iron", description: "Essential mineral for oxygen transport in blood. Deficiency causes fatigue and anaemia.", categories: ["nutrients", "blood"] },
  { id: "Fer", name: "Fer", fullName: "Ferritin", description: "Protein that stores iron. Best indicator of total body iron stores.", categories: ["nutrients", "blood"] },
  { id: "Mg", name: "Mg", fullName: "Magnesium", description: "Involved in hundreds of enzymatic reactions. Affects muscle function, sleep, and stress.", categories: ["nutrients"] },
  { id: "Zn", name: "Zn", fullName: "Zinc", description: "Essential for immune function, wound healing, and protein synthesis.", categories: ["nutrients"] },
  { id: "Se", name: "Se", fullName: "Selenium", description: "Trace mineral with antioxidant properties. Important for thyroid function.", categories: ["nutrients", "thyroid"] },
  { id: "Cu", name: "Cu", fullName: "Copper", description: "Trace mineral involved in iron metabolism, energy production, and connective tissue formation.", categories: ["nutrients"] },

  // Liver & Kidney
  { id: "ALT", name: "ALT", fullName: "Alanine Transaminase", description: "Liver enzyme. Elevated levels may indicate liver damage or disease.", categories: ["liver"] },
  { id: "AST", name: "AST", fullName: "Aspartate Transaminase", description: "Enzyme found in liver and heart. High levels may indicate organ damage.", categories: ["liver"] },
  { id: "GGT", name: "GGT", fullName: "Gamma-Glutamyl Transferase", description: "Liver enzyme sensitive to alcohol consumption and bile duct problems.", categories: ["liver"] },
  { id: "ALP", name: "ALP", fullName: "Alkaline Phosphatase", description: "Enzyme found in liver and bones. Helps assess liver and bone health.", categories: ["liver"] },
  { id: "Bil", name: "Bil", fullName: "Bilirubin", description: "Waste product from red blood cell breakdown. High levels may cause jaundice.", categories: ["liver", "blood"] },
  { id: "Alb", name: "Alb", fullName: "Albumin", description: "Protein made by the liver. Low levels may indicate liver or kidney problems.", categories: ["liver", "kidney"] },
  { id: "Crea", name: "Crea", fullName: "Creatinine", description: "Waste product from muscle metabolism. Used to assess kidney function.", categories: ["kidney"] },
  { id: "eGFR", name: "eGFR", fullName: "Estimated GFR", description: "Calculated estimate of how well your kidneys filter waste from blood.", categories: ["kidney"] },
  { id: "BUN", name: "BUN", fullName: "Blood Urea Nitrogen", description: "Measures nitrogen in blood from urea. Indicates kidney and liver function.", categories: ["kidney", "liver"] },

  // Blood & Inflammation
  { id: "WBC", name: "WBC", fullName: "White Blood Cell Count", description: "Measures immune cells. High or low levels may indicate infection or immune issues.", categories: ["blood", "inflammation"] },
  { id: "RBC", name: "RBC", fullName: "Red Blood Cell Count", description: "Cells that carry oxygen. Low count indicates anaemia.", categories: ["blood"] },
  { id: "Hgb", name: "Hgb", fullName: "Haemoglobin", description: "Protein in red blood cells that carries oxygen. Low levels indicate anaemia.", categories: ["blood"] },
  { id: "Hct", name: "Hct", fullName: "Haematocrit", description: "Percentage of blood volume made up of red blood cells.", categories: ["blood"] },
  { id: "Plt", name: "Plt", fullName: "Platelet Count", description: "Cells that help blood clot. Abnormal levels may indicate bleeding disorders.", categories: ["blood"] },
  { id: "ESR", name: "ESR", fullName: "Erythrocyte Sedimentation Rate", description: "Non-specific marker of inflammation in the body.", categories: ["inflammation"] },
  { id: "Hcy", name: "Hcy", fullName: "Homocysteine", description: "Amino acid linked to cardiovascular risk when elevated. Affected by B vitamins.", categories: ["inflammation", "heart"] },
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
  { id: "inflammation", name: "Inflammation", color: "bg-orange-500" },
  { id: "stress", name: "Stress", color: "bg-violet-500" },
];

interface BiomarkerHoneycombProps {
  defaultCategory?: string;
}

export function BiomarkerHoneycomb({ defaultCategory = "heart" }: BiomarkerHoneycombProps) {
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [hoveredBiomarker, setHoveredBiomarker] = useState<Biomarker | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (biomarker: Biomarker, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredBiomarker(biomarker);
  };

  const handleMouseLeave = () => {
    setHoveredBiomarker(null);
  };

  const isActive = (biomarker: Biomarker) => {
    return biomarker.categories.includes(activeCategory);
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || "bg-[#5c7a52]";
  };

  // Arrange biomarkers in honeycomb rows
  const rows = [
    biomarkers.slice(0, 6),
    biomarkers.slice(6, 13),
    biomarkers.slice(13, 20),
    biomarkers.slice(20, 27),
    biomarkers.slice(27, 34),
    biomarkers.slice(34, 40),
    biomarkers.slice(40, 46),
  ];

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === category.id
                ? "bg-[#34412f] text-white"
                : "bg-[#e6ebe3] text-[#5c7a52] hover:bg-[#cdd8c6]"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Honeycomb Grid */}
      <div className="relative flex flex-col items-center gap-1 py-8">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-1 justify-center"
            style={{
              marginLeft: rowIndex % 2 === 1 ? "28px" : "0",
            }}
          >
            {row.map((biomarker) => {
              const active = isActive(biomarker);
              return (
                <div
                  key={biomarker.id}
                  className="relative"
                  onMouseEnter={(e) => handleMouseEnter(biomarker, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Hexagon */}
                  <div
                    className={`
                      w-12 h-14 lg:w-14 lg:h-16
                      flex items-center justify-center
                      cursor-pointer
                      transition-all duration-300
                      hover:scale-110 hover:z-10
                      ${active
                        ? "text-white"
                        : "text-[#7e9a72] hover:text-[#5c7a52]"
                      }
                    `}
                    style={{
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      background: active
                        ? "linear-gradient(135deg, #34412f 0%, #4a6243 100%)"
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
        ))}

        {/* Calculated Metrics Label */}
        <div className="mt-8 flex items-center gap-4 text-sm text-[#5c7a52]">
          <span>Calculated metrics included:</span>
          <div className="flex gap-2">
            {["eGFR", "HOMA"].map((metric) => (
              <span
                key={metric}
                className="px-3 py-1 rounded-full bg-[#f4f7f2] border border-[#cdd8c6] text-[#34412f] text-xs"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredBiomarker && (
        <div
          className="fixed z-50 max-w-xs bg-white rounded-2xl shadow-xl border border-[#e6ebe3] p-4 pointer-events-none animate-fade-in"
          style={{
            left: `${Math.min(tooltipPosition.x, window.innerWidth - 320)}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-start gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #34412f 0%, #4a6243 100%)",
              }}
            >
              {hoveredBiomarker.name}
            </div>
            <div>
              <h4 className="font-medium text-[#2c3628] text-sm">
                {hoveredBiomarker.fullName}
              </h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {hoveredBiomarker.categories.map((cat) => {
                  const category = categories.find(c => c.id === cat);
                  return (
                    <span
                      key={cat}
                      className={`px-2 py-0.5 rounded-full text-[10px] text-white ${category?.color}`}
                    >
                      {category?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="text-xs text-[#5c7a52] leading-relaxed">
            {hoveredBiomarker.description}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-[#e6ebe3] rotate-45" />
        </div>
      )}

    </div>
  );
}
