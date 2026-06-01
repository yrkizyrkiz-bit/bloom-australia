import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { biomarkerDefinitions } from "@/data/biomarkers";

// Next.js route segment config - increase timeout to 60 seconds
// Note: Platform gateway may have its own lower timeout (nginx ~30-60s)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Maximum file size in bytes (2MB for faster processing)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Initialize Anthropic Claude AI with timeout
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  timeout: 55000, // 55 second timeout (less than gateway timeout)
});

// Helper: Compress base64 image by reducing quality
// For PNG/JPEG images, we can't easily compress without sharp/canvas
// But we can check if the base64 is too large and warn
const MAX_BASE64_SIZE = 1.5 * 1024 * 1024; // 1.5MB base64 limit for faster processing

// Build a comprehensive reference list of biomarkers for the AI with common aliases
const biomarkerReference = biomarkerDefinitions.map(b => {
  // Create list of common aliases for each biomarker
  const aliases: string[] = [b.name, b.shortName];

  // Add common variations
  if (b.id === "total_cholesterol") aliases.push("Cholesterol", "Chol", "TC");
  if (b.id === "ldl_cholesterol") aliases.push("LDL", "LDL-C", "Low Density Lipoprotein");
  if (b.id === "hdl_cholesterol") aliases.push("HDL", "HDL-C", "High Density Lipoprotein");
  if (b.id === "triglycerides") aliases.push("Trig", "TG", "Trigs");
  if (b.id === "glucose") aliases.push("Fasting Glucose", "Blood Glucose", "FBG", "Fasting Blood Sugar", "FBS", "Glucose Fasting");
  if (b.id === "hba1c") aliases.push("HbA1c", "A1C", "Glycated Haemoglobin", "Glycated Hemoglobin", "Haemoglobin A1c");
  if (b.id === "tsh") aliases.push("Thyroid Stimulating Hormone", "Thyrotropin");
  if (b.id === "free_t4") aliases.push("FT4", "Thyroxine Free", "Free Thyroxine");
  if (b.id === "free_t3") aliases.push("FT3", "Triiodothyronine Free", "Free Triiodothyronine");
  if (b.id === "vitamin_d") aliases.push("25-OH Vitamin D", "25-Hydroxyvitamin D", "Vitamin D3", "Vit D", "25(OH)D");
  if (b.id === "vitamin_b12") aliases.push("B12", "Cobalamin", "Vit B12");
  if (b.id === "folate") aliases.push("Folic Acid", "Serum Folate", "Vitamin B9");
  if (b.id === "iron") aliases.push("Serum Iron", "Fe");
  if (b.id === "ferritin") aliases.push("Serum Ferritin");
  if (b.id === "transferrin_saturation") aliases.push("TSAT", "Transferrin Sat", "Iron Saturation");
  if (b.id === "crp") aliases.push("C-Reactive Protein", "hsCRP", "hs-CRP", "High Sensitivity CRP");
  if (b.id === "esr") aliases.push("Erythrocyte Sedimentation Rate", "Sed Rate");
  if (b.id === "alt") aliases.push("ALT", "SGPT", "Alanine Aminotransferase", "GPT");
  if (b.id === "ast") aliases.push("AST", "SGOT", "Aspartate Aminotransferase", "GOT");
  if (b.id === "ggt") aliases.push("Gamma GT", "Gamma-Glutamyl Transferase");
  if (b.id === "alp") aliases.push("Alkaline Phosphatase", "Alk Phos");
  if (b.id === "bilirubin_total") aliases.push("Total Bilirubin", "Bilirubin", "Bili", "T.Bil", "T Bil", "T-Bil");
  if (b.id === "bilirubin_direct") aliases.push("Direct Bilirubin", "D.Bil", "D Bil", "D-Bil", "Conjugated Bilirubin");
  if (b.id === "creatinine") aliases.push("Creat", "Serum Creatinine");
  if (b.id === "urea") aliases.push("BUN", "Blood Urea Nitrogen", "Urea Nitrogen");
  if (b.id === "egfr") aliases.push("eGFR", "Estimated GFR", "Glomerular Filtration Rate");
  if (b.id === "uric_acid") aliases.push("Urate");
  if (b.id === "hemoglobin") aliases.push("Hb", "Haemoglobin", "Hgb");
  if (b.id === "hematocrit") aliases.push("Hct", "Haematocrit", "PCV", "Packed Cell Volume");
  if (b.id === "rbc") aliases.push("Red Blood Cells", "RCC", "Erythrocytes");
  if (b.id === "wbc") aliases.push("White Blood Cells", "WCC", "Leucocytes", "Leukocytes");
  if (b.id === "platelets") aliases.push("PLT", "Thrombocytes", "Platelet Count");
  if (b.id === "mcv") aliases.push("Mean Cell Volume", "Mean Corpuscular Volume");
  if (b.id === "mch") aliases.push("Mean Cell Haemoglobin", "Mean Corpuscular Hemoglobin");
  if (b.id === "mchc") aliases.push("Mean Cell Haemoglobin Concentration");
  if (b.id === "testosterone") aliases.push("Total Testosterone", "Serum Testosterone");
  if (b.id === "estradiol") aliases.push("E2", "Oestradiol");
  if (b.id === "cortisol") aliases.push("Serum Cortisol", "Cortisol AM", "Morning Cortisol");
  if (b.id === "dhea_s") aliases.push("DHEA-S", "DHEA Sulfate", "Dehydroepiandrosterone Sulfate");
  if (b.id === "insulin") aliases.push("Fasting Insulin", "Serum Insulin");
  if (b.id === "sodium") aliases.push("Na", "Serum Sodium");
  if (b.id === "potassium") aliases.push("K", "Serum Potassium");
  if (b.id === "chloride") aliases.push("Cl", "Serum Chloride");
  if (b.id === "calcium") aliases.push("Ca", "Serum Calcium", "Total Calcium");
  if (b.id === "magnesium") aliases.push("Mg", "Serum Magnesium");
  if (b.id === "phosphate") aliases.push("Phosphorus", "PO4", "Serum Phosphate");
  if (b.id === "albumin") aliases.push("Serum Albumin", "Alb");
  if (b.id === "total_protein") aliases.push("TP", "Serum Protein", "Total Protein", "Protein Total");
  if (b.id === "globulin") aliases.push("Serum Globulin", "Glob", "Globulins");
  if (b.id === "rdw") aliases.push("Red Cell Distribution Width", "RDW-CV", "RDW-SD");
  if (b.id === "lymphocyte_percent") aliases.push("Lymphocyte %", "Lymphocytes %", "Lymph %", "Lymphocyte Percentage");
  if (b.id === "lymphocytes") aliases.push("Lymphocytes", "Lymphocyte Count", "Lymphocyte Absolute", "Lymph");

  return {
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    category: b.category,
    unit: b.ranges.male.unit,
    aliases: [...new Set(aliases)], // Remove duplicates
  };
});

const systemPrompt = `You are an expert medical laboratory document parser specializing in Australian blood test results and pathology reports.

Your task is to CAREFULLY extract biomarker values from this blood test document. This is critical medical data - accuracy is essential.

## CRITICAL: DO NOT CONVERT UNITS - USE AUSTRALIAN SI UNITS AS-IS

Australian pathology reports use SI units. Extract values EXACTLY as shown in the document:
- Albumin: g/L (NOT g/dL) - typical range 35-50
- Creatinine: µmol/L (NOT mg/dL) - typical range 45-110
- Glucose: mmol/L (NOT mg/dL) - typical range 3.9-5.5
- CRP: mg/L (NOT mg/dL) - typical range 0-5
- MCV: fL (same) - typical range 80-100
- RDW: % (same) - typical range 11.5-14.5
- ALP: U/L (same) - typical range 30-120
- WBC: x10⁹/L (same as K/µL) - typical range 4.0-11.0
- Lymphocyte %: % (same) - typical range 20-40

**DO NOT convert values. If the document shows "Albumin: 45 g/L", return value: 45, unit: "g/L"**

## PRIORITY: CORE PHENOTYPIC AGE BIOMARKERS

These 9 biomarkers are ESSENTIAL for biological age calculation. Extract them FIRST if present:

1. **albumin** - Albumin, Serum Albumin, Alb (g/L, typically 35-50)
2. **creatinine** - Creatinine, Creat (µmol/L, typically 45-110)
3. **glucose** - Glucose, Fasting Glucose, FBG (mmol/L, typically 3.9-5.5)
4. **crp** - CRP, C-Reactive Protein, hsCRP (mg/L, typically 0-5)
5. **lymphocyte_percent** - Lymphocytes %, Lymph % (%, typically 20-40) - SEE NOTE BELOW
6. **mcv** - MCV, Mean Cell Volume (fL, typically 80-100)
7. **rdw** - RDW, Red Cell Distribution Width (%, typically 11.5-14.5)
8. **alp** - ALP, Alkaline Phosphatase, Alk Phos (U/L, typically 30-120)
9. **wbc** - WBC, White Blood Cells, WCC, Leucocytes (x10⁹/L, typically 4.0-11.0)

### IMPORTANT: Lymphocyte % vs Absolute Count

Lymphocytes can be reported TWO ways - extract BOTH if available:

1. **lymphocyte_percent** - Percentage (e.g., "Lymphocytes 27%")
   - Unit: %
   - Typical range: 20-40%

2. **lymphocytes** - Absolute count (e.g., "Lymphocytes 1.8 x10⁹/L")
   - Unit: x10⁹/L
   - Typical range: 1.0-4.0 x10⁹/L

If ONLY the absolute count is available, extract it as "lymphocytes" (not "lymphocyte_percent").
The system will derive the percentage: Lymphocyte % = (Lymphocytes ÷ WBC) × 100

These are often found in:
- Full Blood Count (FBC) / Complete Blood Count (CBC): wbc, lymphocytes/lymphocyte_percent, mcv, rdw
- Liver Function Tests (LFT): albumin, alp
- Kidney Function / UEC: creatinine
- Metabolic Panel: glucose
- Inflammation markers: crp

## CRITICAL: Multiple Date Columns Detection

This document likely contains MULTIPLE TEST DATES with results for each date. Look carefully for:

1. **Date row near the top** - A row containing multiple dates like:
   - "03-May-26  01-May-26  30-Apr-26  26-Jan-19"
   - "15/03/24  22/01/24  10/11/23"
   - Or similar patterns with multiple dates

2. **Column structure** - Each biomarker row has MULTIPLE values, one for each date column:
   - Example: "Haemoglobin    126 L    128 L    122 L    150    (130-180)    g/L"
   - This shows 4 different test results: 126, 128, 122, and 150 from 4 different dates

3. **"Latest Results" or similar header** - Indicates multiple dated columns follow

**YOU MUST extract EVERY value from EVERY date column, not just the first/latest column.**

## Date Format Recognition

Recognize these Australian date formats in headers:
- DD-MMM-YY (e.g., "03-May-26" = 2026-05-03)
- DD-MMM-YYYY (e.g., "03-May-2026")
- DD/MM/YY (e.g., "03/05/26" = 2026-05-03)
- DD/MM/YYYY (e.g., "03/05/2026")

For 2-digit years: 00-30 = 2000s, 31-99 = 1900s (e.g., "26" = 2026, "19" = 2019)

## Value Flags

Values may have flags next to them:
- "L" = Low (below reference range)
- "H" = High (above reference range)
- Extract the numeric value WITHOUT the flag

Examples:
- "126 L" → value is 126
- "16.4 H" → value is 16.4
- "<1.0" → value is 0.9 (or note as "below detection")

## Biomarkers to Look For

${biomarkerReference.map(b => `- ID: "${b.id}" | Name: ${b.name} (${b.shortName}) | Aliases: ${b.aliases.join(", ")} | Unit: ${b.unit}`).join('\n')}

## Extraction Process

1. **First, identify the date row** - Find all dates in the header
2. **Map each column to its date** - Column 1 = Date 1, Column 2 = Date 2, etc.
3. **For each biomarker row**, extract the value from EACH date column
4. **Create a separate entry for each date's value**

Example extraction from:
\`\`\`
Date                03-May-26  01-May-26  30-Apr-26  26-Jan-19
Haemoglobin         126 L      128 L      122 L      150        (130-180)  g/L
\`\`\`

Should produce 4 entries:
- Haemoglobin: 126 g/L on 2026-05-03 (isHistorical: false)
- Haemoglobin: 128 g/L on 2026-05-01 (isHistorical: true)
- Haemoglobin: 122 g/L on 2026-04-30 (isHistorical: true)
- Haemoglobin: 150 g/L on 2019-01-26 (isHistorical: true)

## Output Format

Return ONLY valid JSON:
{
  "biomarkers": [
    {
      "biomarkerId": "hemoglobin",
      "name": "Haemoglobin",
      "value": 126,
      "unit": "g/L",
      "testDate": "2026-05-03",
      "confidence": 0.95,
      "isHistorical": false,
      "flag": "L"
    },
    {
      "biomarkerId": "hemoglobin",
      "name": "Haemoglobin",
      "value": 128,
      "unit": "g/L",
      "testDate": "2026-05-01",
      "confidence": 0.95,
      "isHistorical": true,
      "flag": "L"
    }
  ],
  "labName": "Lab name if visible",
  "testDates": ["2026-05-03", "2026-05-01", "2026-04-30", "2019-01-26"],
  "hasHistoricalData": true,
  "patientName": "First name only if visible"
}

## Key Rules

1. **Extract ALL columns** - Don't just extract the first/latest column
2. **Most recent date = isHistorical: false** - All other dates = isHistorical: true
3. **testDates array** - List ALL dates found, most recent first
4. **Confidence**: 0.95+ for clear values, 0.85-0.94 for slightly unclear, below 0.85 skip
5. **Remove flags from values** - "126 L" becomes value: 126, flag: "L"

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation.`;


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      console.log(`[Blood Test Parser] ❌ File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`);
      return NextResponse.json({
        success: false,
        error: `File too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB. Please compress your PDF or use a lower resolution scan.`,
        mode: "error",
      }, { status: 413 });
    }

    // Check if Anthropic API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const hasValidKey = apiKey && apiKey.length > 10 && apiKey.startsWith("sk-ant-");

    if (!hasValidKey) {
      console.log("[Blood Test Parser] ⚠️ No valid Anthropic API key - using DEMO MODE");
      console.log("[Blood Test Parser] API Key status:", apiKey ? `Invalid format (${apiKey.substring(0, 10)}...)` : "Not set");
      return NextResponse.json({
        success: true,
        mode: "demo",
        aiProvider: null,
        aiModel: null,
        data: generateMockExtraction(),
        message: "Running in DEMO MODE - no valid Anthropic API key configured"
      });
    }

    console.log("[Blood Test Parser] ✅ Using Claude AI (API key verified)");

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;
    const base64Size = base64.length;

    // Determine if it's an image or PDF
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload an image or PDF." },
        { status: 400 }
      );
    }

    console.log(`[Blood Test Parser] Processing ${file.name} (${mimeType}, ${bytes.byteLength} bytes, base64: ${(base64Size / 1024).toFixed(0)}KB)`);

    // Check if base64 is too large (causes slow processing and timeouts)
    if (base64Size > MAX_BASE64_SIZE) {
      const sizeMB = (base64Size / (1024 * 1024)).toFixed(1);
      console.log(`[Blood Test Parser] ⚠️ File base64 too large: ${sizeMB}MB`);
      return NextResponse.json({
        success: false,
        error: `File is too large for fast processing (${sizeMB}MB encoded). Please use a smaller image or lower resolution scan. Maximum recommended size is 1MB.`,
        mode: "error",
        suggestion: "Try taking a photo of just the results table, or use a PDF under 1MB.",
      }, { status: 413 });
    }

    // Build content array based on file type
    type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    type ContentBlock =
      | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
      | { type: "text"; text: string };

    const contentBlocks: ContentBlock[] = [];

    if (isPdf) {
      // For PDFs, use document type
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      });
    } else {
      // For images, determine the correct media type
      let imageMediaType: ImageMediaType = "image/jpeg";
      if (mimeType === "image/png") imageMediaType = "image/png";
      else if (mimeType === "image/gif") imageMediaType = "image/gif";
      else if (mimeType === "image/webp") imageMediaType = "image/webp";

      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType,
          data: base64,
        },
      });
    }

    // Add the text prompt
    contentBlocks.push({
      type: "text",
      text: systemPrompt,
    });

    // Use Claude Sonnet 4.6 model with vision/PDF capabilities
    // This model supports both image_input and pdf_input
    const MODEL_NAME = "claude-sonnet-4-6";
    console.log(`[Blood Test Parser] 🚀 Calling Claude AI with model: ${MODEL_NAME}...`);
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 8192, // Reduced for faster processing
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
    });

    const aiDuration = Date.now() - startTime;
    console.log(`[Blood Test Parser] ✅ Claude AI responded in ${(aiDuration / 1000).toFixed(1)}s`);

    // Check if response was truncated
    const stopReason = message.stop_reason;
    console.log("[Blood Test Parser] Stop reason:", stopReason);

    // Extract text content from response
    const contentBlock = message.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error("Unexpected response type from Claude");
    }
    const content = contentBlock.text;

    console.log("[Blood Test Parser] AI Response received:", content.substring(0, 500) + "...");

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let parsedData: {
      biomarkers: Array<{
        biomarkerId: string;
        name?: string;
        value: number;
        unit?: string;
        confidence?: number;
        testDate?: string;
        isHistorical?: boolean;
        flag?: string;
      }>;
      labName?: string;
      testDate?: string;
      testDates?: string[];
      hasHistoricalData?: boolean;
      patientName?: string | null;
    };
    try {
      // Try to extract JSON from the response - handle markdown code blocks
      let jsonStr = content;

      console.log("[Blood Test Parser] Raw AI response length:", content.length);

      // Remove markdown code blocks if present
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```\n?/g, "");
      }

      // Find JSON object - get the outermost braces
      const firstBrace = jsonStr.indexOf('{');
      let lastBrace = jsonStr.lastIndexOf('}');

      if (firstBrace === -1) {
        throw new Error("No JSON object found in response");
      }

      // Handle truncated response - if no closing brace or response seems cut off
      let jsonContent: string;
      let wasTruncated = false;

      if (lastBrace === -1 || lastBrace < firstBrace) {
        console.log("[Blood Test Parser] ⚠️ Response truncated - no closing brace found");
        wasTruncated = true;
        jsonContent = jsonStr.substring(firstBrace);
      } else {
        jsonContent = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      // Check if the JSON structure is incomplete (truncated mid-object)
      // Count braces to see if they're balanced
      let openBraces = 0;
      let openBrackets = 0;
      for (const char of jsonContent) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
      }

      if (openBraces > 0 || openBrackets > 0) {
        console.log(`[Blood Test Parser] ⚠️ Unbalanced JSON: ${openBraces} unclosed braces, ${openBrackets} unclosed brackets`);
        wasTruncated = true;

        // Find the last complete biomarker object and close properly
        const lastCompleteObj = jsonContent.lastIndexOf('},');
        if (lastCompleteObj !== -1) {
          // Check if we're inside the biomarkers array
          const biomarkersStart = jsonContent.indexOf('"biomarkers"');
          const arrayStart = jsonContent.indexOf('[', biomarkersStart);

          if (arrayStart !== -1 && lastCompleteObj > arrayStart) {
            // Close at the last complete object, close the array, and close the main object
            jsonContent = jsonContent.substring(0, lastCompleteObj + 1) + ']}';
            console.log("[Blood Test Parser] Fixed truncated JSON - closed at last complete biomarker");
          }
        }
      }

      // Fix common JSON issues from AI responses
      // 1. Remove trailing commas before ] or }
      jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');

      // 2. Fix any double commas
      jsonContent = jsonContent.replace(/,,+/g, ',');

      // 3. If not truncated, find the matching closing brace for validation
      if (!wasTruncated) {
        let braceCount = 0;
        let validEndIndex = -1;
        for (let i = 0; i < jsonContent.length; i++) {
          if (jsonContent[i] === '{') braceCount++;
          if (jsonContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              validEndIndex = i;
              break;
            }
          }
        }

        if (validEndIndex > 0) {
          jsonContent = jsonContent.substring(0, validEndIndex + 1);
        }
      }

      console.log("[Blood Test Parser] Cleaned JSON length:", jsonContent.length);

      try {
        parsedData = JSON.parse(jsonContent);
      } catch (firstError) {
        console.error("[Blood Test Parser] First parse attempt failed:", firstError);
        console.log("[Blood Test Parser] Attempting to extract biomarkers individually...");

        // Extract individual biomarker objects by finding each {...} block with biomarkerId
        const biomarkerObjects: Array<{
          biomarkerId: string;
          name?: string;
          value: number;
          unit?: string;
          confidence?: number;
          testDate?: string;
          isHistorical?: boolean;
          flag?: string;
        }> = [];

        // Find the biomarkers array start
        const arrayStart = jsonContent.indexOf('"biomarkers"');
        if (arrayStart !== -1) {
          const bracketStart = jsonContent.indexOf('[', arrayStart);
          if (bracketStart !== -1) {
            // Extract objects one by one
            let depth = 0;
            let objStart = -1;

            for (let i = bracketStart; i < jsonContent.length; i++) {
              const char = jsonContent[i];

              if (char === '{') {
                if (depth === 1) {
                  objStart = i;
                }
                depth++;
              } else if (char === '}') {
                depth--;
                if (depth === 1 && objStart !== -1) {
                  // Found complete object
                  let objStr = jsonContent.substring(objStart, i + 1);

                  // Clean up the object string
                  objStr = objStr.replace(/,\s*}/g, '}');
                  objStr = objStr.replace(/\n/g, ' ');

                  try {
                    const obj = JSON.parse(objStr);
                    if (obj.biomarkerId && typeof obj.value === 'number') {
                      biomarkerObjects.push(obj);
                    }
                  } catch (e) {
                    console.log("[Blood Test Parser] Skipping malformed biomarker:", objStr.substring(0, 50) + "...");
                  }
                  objStart = -1;
                }
              } else if (char === ']' && depth === 1) {
                // End of array
                break;
              }
            }
          }
        }

        if (biomarkerObjects.length > 0) {
          console.log(`[Blood Test Parser] ✅ Extracted ${biomarkerObjects.length} biomarkers individually`);
          parsedData = {
            biomarkers: biomarkerObjects,
            hasHistoricalData: biomarkerObjects.some(b => b.isHistorical),
            testDates: [...new Set(biomarkerObjects.map(b => b.testDate).filter(Boolean))] as string[],
          };
        } else {
          console.error("[Blood Test Parser] Could not extract any biomarkers");
          throw firstError;
        }
      }

      // Validate the parsed data
      if (!parsedData.biomarkers || !Array.isArray(parsedData.biomarkers)) {
        throw new Error("Invalid response structure - missing biomarkers array");
      }

      // Validate each biomarker and ensure IDs match our definitions
      parsedData.biomarkers = parsedData.biomarkers
        .filter((b: { biomarkerId?: string; value?: number }) => {
          // Check if biomarkerId exists in our definitions
          const exists = biomarkerReference.some(ref => ref.id === b.biomarkerId);
          if (!exists && b.biomarkerId) {
            console.log(`[Blood Test Parser] Unknown biomarker ID: ${b.biomarkerId}`);
          }
          return exists && typeof b.value === "number";
        })
        .map((b: { biomarkerId: string; name?: string; value: number; unit?: string; confidence?: number; testDate?: string; isHistorical?: boolean; flag?: string }) => ({
          ...b,
          confidence: Math.min(1, Math.max(0, b.confidence || 0.85)),
          testDate: b.testDate || parsedData.testDate || undefined,
          isHistorical: b.isHistorical || false,
        }));

      // ==================== DERIVE CALCULATED BIOMARKERS ====================
      // Many biomarkers can be calculated from other values when not directly reported.
      // Group biomarkers by testDate to calculate derived values per test date
      const biomarkersByDate = new Map<string, typeof parsedData.biomarkers>();
      for (const biomarker of parsedData.biomarkers) {
        const dateKey = biomarker.testDate || 'unknown';
        if (!biomarkersByDate.has(dateKey)) {
          biomarkersByDate.set(dateKey, []);
        }
        biomarkersByDate.get(dateKey)!.push(biomarker);
      }

      // Helper function to validate percentage values (0-100%)
      const validatePercentage = (value: number): { valid: boolean; clamped: number } => {
        if (value < 0 || value > 100) {
          console.log(`[Blood Test Parser] ⚠️ Invalid percentage ${value}% - clamping to valid range`);
          return { valid: false, clamped: Math.max(0, Math.min(100, value)) };
        }
        return { valid: true, clamped: value };
      };

      // Helper to calculate minimum confidence from multiple sources
      const calcDerivedConfidence = (...sources: (number | undefined)[]): number => {
        const validConfidences = sources.filter((c): c is number => c !== undefined);
        if (validConfidences.length === 0) return 0.80;
        return Math.min(...validConfidences) * 0.95; // 5% reduction for derived values
      };

      // For each date group, derive missing biomarkers
      const derivedBiomarkers: typeof parsedData.biomarkers = [];

      for (const [testDate, biomarkers] of biomarkersByDate) {
        const findBiomarker = (id: string) => biomarkers.find(b => b.biomarkerId === id);
        const isHistorical = biomarkers.some(b => b.isHistorical) || false;
        const dateValue = testDate !== 'unknown' ? testDate : undefined;

        // ===== 1. DIFFERENTIAL PERCENTAGES FROM ABSOLUTE COUNTS =====
        const wbc = findBiomarker('wbc');

        if (wbc && wbc.value > 0) {
          // Lymphocyte %
          const lymphocyteAbsolute = findBiomarker('lymphocytes');
          const lymphocytePercent = findBiomarker('lymphocyte_percent');
          if (lymphocyteAbsolute && !lymphocytePercent) {
            const rawPercent = (lymphocyteAbsolute.value / wbc.value) * 100;
            const { valid, clamped } = validatePercentage(rawPercent);
            const roundedPercent = Math.round(clamped * 10) / 10;

            console.log(`[Blood Test Parser] 🧮 Deriving Lymphocyte %: ${lymphocyteAbsolute.value} / ${wbc.value} × 100 = ${roundedPercent}%${!valid ? ' (clamped)' : ''}`);

            derivedBiomarkers.push({
              biomarkerId: 'lymphocyte_percent',
              name: 'Lymphocyte % (Calculated)',
              value: roundedPercent,
              unit: '%',
              confidence: calcDerivedConfidence(lymphocyteAbsolute.confidence, wbc.confidence),
              testDate: dateValue,
              isHistorical,
              flag: !valid ? 'CALC_CLAMPED' : undefined,
            });
          }

          // Neutrophil %
          const neutrophilAbsolute = findBiomarker('neutrophils');
          const neutrophilPercent = findBiomarker('neutrophil_percent');
          if (neutrophilAbsolute && !neutrophilPercent) {
            const rawPercent = (neutrophilAbsolute.value / wbc.value) * 100;
            const { valid, clamped } = validatePercentage(rawPercent);
            const roundedPercent = Math.round(clamped * 10) / 10;

            console.log(`[Blood Test Parser] 🧮 Deriving Neutrophil %: ${neutrophilAbsolute.value} / ${wbc.value} × 100 = ${roundedPercent}%${!valid ? ' (clamped)' : ''}`);

            derivedBiomarkers.push({
              biomarkerId: 'neutrophil_percent',
              name: 'Neutrophil % (Calculated)',
              value: roundedPercent,
              unit: '%',
              confidence: calcDerivedConfidence(neutrophilAbsolute.confidence, wbc.confidence),
              testDate: dateValue,
              isHistorical,
              flag: !valid ? 'CALC_CLAMPED' : undefined,
            });
          }

          // Monocyte %
          const monocyteAbsolute = findBiomarker('monocytes');
          const monocytePercent = findBiomarker('monocyte_percent');
          if (monocyteAbsolute && !monocytePercent) {
            const rawPercent = (monocyteAbsolute.value / wbc.value) * 100;
            const { valid, clamped } = validatePercentage(rawPercent);
            const roundedPercent = Math.round(clamped * 10) / 10;

            console.log(`[Blood Test Parser] 🧮 Deriving Monocyte %: ${monocyteAbsolute.value} / ${wbc.value} × 100 = ${roundedPercent}%${!valid ? ' (clamped)' : ''}`);

            derivedBiomarkers.push({
              biomarkerId: 'monocyte_percent',
              name: 'Monocyte % (Calculated)',
              value: roundedPercent,
              unit: '%',
              confidence: calcDerivedConfidence(monocyteAbsolute.confidence, wbc.confidence),
              testDate: dateValue,
              isHistorical,
              flag: !valid ? 'CALC_CLAMPED' : undefined,
            });
          }

          // Eosinophil %
          const eosinophilAbsolute = findBiomarker('eosinophils');
          const eosinophilPercent = findBiomarker('eosinophil_percent');
          if (eosinophilAbsolute && !eosinophilPercent) {
            const rawPercent = (eosinophilAbsolute.value / wbc.value) * 100;
            const { valid, clamped } = validatePercentage(rawPercent);
            const roundedPercent = Math.round(clamped * 10) / 10;

            console.log(`[Blood Test Parser] 🧮 Deriving Eosinophil %: ${eosinophilAbsolute.value} / ${wbc.value} × 100 = ${roundedPercent}%${!valid ? ' (clamped)' : ''}`);

            derivedBiomarkers.push({
              biomarkerId: 'eosinophil_percent',
              name: 'Eosinophil % (Calculated)',
              value: roundedPercent,
              unit: '%',
              confidence: calcDerivedConfidence(eosinophilAbsolute.confidence, wbc.confidence),
              testDate: dateValue,
              isHistorical,
              flag: !valid ? 'CALC_CLAMPED' : undefined,
            });
          }

          // Basophil %
          const basophilAbsolute = findBiomarker('basophils');
          const basophilPercent = findBiomarker('basophil_percent');
          if (basophilAbsolute && !basophilPercent) {
            const rawPercent = (basophilAbsolute.value / wbc.value) * 100;
            const { valid, clamped } = validatePercentage(rawPercent);
            const roundedPercent = Math.round(clamped * 10) / 10;

            console.log(`[Blood Test Parser] 🧮 Deriving Basophil %: ${basophilAbsolute.value} / ${wbc.value} × 100 = ${roundedPercent}%${!valid ? ' (clamped)' : ''}`);

            derivedBiomarkers.push({
              biomarkerId: 'basophil_percent',
              name: 'Basophil % (Calculated)',
              value: roundedPercent,
              unit: '%',
              confidence: calcDerivedConfidence(basophilAbsolute.confidence, wbc.confidence),
              testDate: dateValue,
              isHistorical,
              flag: !valid ? 'CALC_CLAMPED' : undefined,
            });
          }
        }

        // ===== 2. LDL CHOLESTEROL (Friedewald Equation) =====
        // LDL = Total Cholesterol - HDL - (Triglycerides / 2.2) [for mmol/L]
        // Only valid when Triglycerides < 4.5 mmol/L
        const totalCholesterol = findBiomarker('total_cholesterol');
        const hdl = findBiomarker('hdl_cholesterol');
        const triglycerides = findBiomarker('triglycerides');
        const ldl = findBiomarker('ldl_cholesterol');

        if (totalCholesterol && hdl && triglycerides && !ldl) {
          if (triglycerides.value < 4.5) {
            const calculatedLDL = totalCholesterol.value - hdl.value - (triglycerides.value / 2.2);
            const roundedLDL = Math.round(calculatedLDL * 100) / 100;

            // LDL should be positive and reasonable (0-10 mmol/L)
            if (roundedLDL > 0 && roundedLDL < 10) {
              console.log(`[Blood Test Parser] 🧮 Deriving LDL (Friedewald): ${totalCholesterol.value} - ${hdl.value} - (${triglycerides.value} / 2.2) = ${roundedLDL} mmol/L`);

              derivedBiomarkers.push({
                biomarkerId: 'ldl_cholesterol',
                name: 'LDL Cholesterol (Calculated)',
                value: roundedLDL,
                unit: 'mmol/L',
                confidence: calcDerivedConfidence(totalCholesterol.confidence, hdl.confidence, triglycerides.confidence),
                testDate: dateValue,
                isHistorical,
                flag: undefined,
              });
            } else {
              console.log(`[Blood Test Parser] ⚠️ Calculated LDL ${roundedLDL} is out of reasonable range, skipping`);
            }
          } else {
            console.log(`[Blood Test Parser] ⚠️ Triglycerides ${triglycerides.value} ≥ 4.5 mmol/L - Friedewald equation not valid`);
          }
        }

        // ===== 3. NON-HDL CHOLESTEROL =====
        // Non-HDL = Total Cholesterol - HDL
        const nonHdl = findBiomarker('non_hdl_cholesterol');
        if (totalCholesterol && hdl && !nonHdl) {
          const calculatedNonHDL = totalCholesterol.value - hdl.value;
          const roundedNonHDL = Math.round(calculatedNonHDL * 100) / 100;

          if (roundedNonHDL > 0 && roundedNonHDL < 10) {
            console.log(`[Blood Test Parser] 🧮 Deriving Non-HDL: ${totalCholesterol.value} - ${hdl.value} = ${roundedNonHDL} mmol/L`);

            derivedBiomarkers.push({
              biomarkerId: 'non_hdl_cholesterol',
              name: 'Non-HDL Cholesterol (Calculated)',
              value: roundedNonHDL,
              unit: 'mmol/L',
              confidence: calcDerivedConfidence(totalCholesterol.confidence, hdl.confidence),
              testDate: dateValue,
              isHistorical,
              flag: undefined,
            });
          }
        }

        // ===== 4. HOMA-IR (Insulin Resistance Index) =====
        // HOMA-IR = (Fasting Insulin × Fasting Glucose) / 22.5
        // Glucose in mmol/L, Insulin in mIU/L (or μU/mL)
        const glucose = findBiomarker('glucose');
        const insulin = findBiomarker('insulin');
        const homaIr = findBiomarker('homa_ir');

        if (glucose && insulin && !homaIr) {
          const calculatedHOMA = (insulin.value * glucose.value) / 22.5;
          const roundedHOMA = Math.round(calculatedHOMA * 100) / 100;

          // HOMA-IR should be positive and typically < 10
          if (roundedHOMA > 0 && roundedHOMA < 20) {
            console.log(`[Blood Test Parser] 🧮 Deriving HOMA-IR: (${insulin.value} × ${glucose.value}) / 22.5 = ${roundedHOMA}`);

            derivedBiomarkers.push({
              biomarkerId: 'homa_ir',
              name: 'HOMA-IR (Calculated)',
              value: roundedHOMA,
              unit: '',
              confidence: calcDerivedConfidence(glucose.confidence, insulin.confidence),
              testDate: dateValue,
              isHistorical,
              flag: undefined,
            });
          } else {
            console.log(`[Blood Test Parser] ⚠️ Calculated HOMA-IR ${roundedHOMA} is out of reasonable range, skipping`);
          }
        }

        // ===== 5. CHOLESTEROL RATIOS =====
        // TC/HDL Ratio = Total Cholesterol / HDL
        const tcHdlRatio = findBiomarker('tc_hdl_ratio');
        if (totalCholesterol && hdl && hdl.value > 0 && !tcHdlRatio) {
          const calculatedRatio = totalCholesterol.value / hdl.value;
          const roundedRatio = Math.round(calculatedRatio * 10) / 10;

          if (roundedRatio > 0 && roundedRatio < 15) {
            console.log(`[Blood Test Parser] 🧮 Deriving TC/HDL Ratio: ${totalCholesterol.value} / ${hdl.value} = ${roundedRatio}`);

            derivedBiomarkers.push({
              biomarkerId: 'tc_hdl_ratio',
              name: 'TC/HDL Ratio (Calculated)',
              value: roundedRatio,
              unit: '',
              confidence: calcDerivedConfidence(totalCholesterol.confidence, hdl.confidence),
              testDate: dateValue,
              isHistorical,
              flag: undefined,
            });
          }
        }

        // LDL/HDL Ratio = LDL / HDL
        const ldlForRatio = findBiomarker('ldl_cholesterol') || derivedBiomarkers.find(b => b.biomarkerId === 'ldl_cholesterol' && b.testDate === dateValue);
        const ldlHdlRatio = findBiomarker('ldl_hdl_ratio');
        if (ldlForRatio && hdl && hdl.value > 0 && !ldlHdlRatio) {
          const calculatedRatio = ldlForRatio.value / hdl.value;
          const roundedRatio = Math.round(calculatedRatio * 10) / 10;

          if (roundedRatio > 0 && roundedRatio < 10) {
            console.log(`[Blood Test Parser] 🧮 Deriving LDL/HDL Ratio: ${ldlForRatio.value} / ${hdl.value} = ${roundedRatio}`);

            derivedBiomarkers.push({
              biomarkerId: 'ldl_hdl_ratio',
              name: 'LDL/HDL Ratio (Calculated)',
              value: roundedRatio,
              unit: '',
              confidence: calcDerivedConfidence(ldlForRatio.confidence, hdl.confidence),
              testDate: dateValue,
              isHistorical,
              flag: undefined,
            });
          }
        }

        // Triglyceride/HDL Ratio (marker of insulin resistance)
        const tgHdlRatio = findBiomarker('tg_hdl_ratio');
        if (triglycerides && hdl && hdl.value > 0 && !tgHdlRatio) {
          const calculatedRatio = triglycerides.value / hdl.value;
          const roundedRatio = Math.round(calculatedRatio * 10) / 10;

          if (roundedRatio > 0 && roundedRatio < 15) {
            console.log(`[Blood Test Parser] 🧮 Deriving TG/HDL Ratio: ${triglycerides.value} / ${hdl.value} = ${roundedRatio}`);

            derivedBiomarkers.push({
              biomarkerId: 'tg_hdl_ratio',
              name: 'TG/HDL Ratio (Calculated)',
              value: roundedRatio,
              unit: '',
              confidence: calcDerivedConfidence(triglycerides.confidence, hdl.confidence),
              testDate: dateValue,
              isHistorical,
              flag: undefined,
            });
          }
        }
      }

      // Add derived biomarkers to the main array
      if (derivedBiomarkers.length > 0) {
        parsedData.biomarkers = [...parsedData.biomarkers, ...derivedBiomarkers];
        console.log(`[Blood Test Parser] ✅ Added ${derivedBiomarkers.length} derived biomarker values`);

        // Log summary of derived biomarkers
        const derivedSummary = derivedBiomarkers.reduce((acc, b) => {
          acc[b.biomarkerId] = (acc[b.biomarkerId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`[Blood Test Parser] Derived biomarkers:`, Object.entries(derivedSummary).map(([id, count]) => `${id}(${count})`).join(', '));
      }
      // ==================== END DERIVE CALCULATED BIOMARKERS ====================

      // Ensure hasHistoricalData is set
      parsedData.hasHistoricalData = parsedData.hasHistoricalData ||
        parsedData.biomarkers.some((b: { isHistorical?: boolean }) => b.isHistorical === true);

      // Count current and historical
      const currentCount = parsedData.biomarkers.filter((b: { isHistorical?: boolean }) => !b.isHistorical).length;
      const historicalCount = parsedData.biomarkers.filter((b: { isHistorical?: boolean }) => b.isHistorical).length;

      console.log(`[Blood Test Parser] Successfully extracted ${parsedData.biomarkers.length} biomarkers (${currentCount} current, ${historicalCount} historical)`);
      if (parsedData.testDates) {
        console.log(`[Blood Test Parser] Test dates found: ${parsedData.testDates.join(', ')}`);
      }

    } catch (parseError) {
      console.error("[Blood Test Parser] ❌ Failed to parse Claude AI response:", parseError);

      // Extract error position from error message
      const errorMsg = parseError instanceof Error ? parseError.message : "";
      const posMatch = errorMsg.match(/position (\d+)/);
      const errorPos = posMatch ? parseInt(posMatch[1]) : 0;

      // Get snippet around error position
      const snippetStart = Math.max(0, errorPos - 100);
      const snippetEnd = Math.min(content.length, errorPos + 100);
      const errorSnippet = content.substring(snippetStart, snippetEnd);

      console.error("[Blood Test Parser] Content around error position:", errorSnippet);
      console.error("[Blood Test Parser] Total content length:", content.length);

      // Log the first 500 and last 500 chars
      console.log("[Blood Test Parser] Content start:", content.substring(0, 500));
      console.log("[Blood Test Parser] Content end:", content.substring(content.length - 500));

      return NextResponse.json({
        success: true,
        mode: "demo",
        aiProvider: "Anthropic (parse failed)",
        aiModel: MODEL_NAME,
        parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
        errorSnippet: errorSnippet,
        contentLength: content.length,
        data: generateMockExtraction(),
        message: `Claude AI (${MODEL_NAME}) responded but parsing failed - using DEMO fallback data. Check server console for details.`
      });
    }

    console.log(`[Blood Test Parser] ✅ Claude AI extraction complete - ${parsedData.biomarkers.length} biomarkers found`);

    return NextResponse.json({
      success: true,
      mode: "ai",
      aiProvider: "Anthropic",
      aiModel: MODEL_NAME,
      data: parsedData,
      message: `Successfully extracted ${parsedData.biomarkers.length} biomarkers with Claude AI (${MODEL_NAME})${parsedData.hasHistoricalData ? ' (includes historical data)' : ''}`
    });

  } catch (error) {
    console.error("[Blood Test Parser] ❌ Error processing blood test:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.toLowerCase().includes('timeout') ||
                      errorMessage.toLowerCase().includes('timed out') ||
                      errorMessage.includes('ETIMEDOUT') ||
                      errorMessage.includes('ECONNRESET');

    // Return helpful error message
    return NextResponse.json({
      success: true,
      mode: "demo",
      aiProvider: null,
      aiModel: null,
      error: isTimeout
        ? "Request timed out. The image may be too complex. Try cropping to show only the results table."
        : errorMessage,
      data: generateMockExtraction(),
      message: isTimeout
        ? "Request timed out - using DEMO data. Try a simpler image or crop to just the results."
        : `Error occurred: ${errorMessage} - using DEMO data`
    });
  }
}

function generateMockExtraction() {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // CRITICAL: Include ALL core PhenoAge biomarkers in mock data
  // Core biomarkers for Phenotypic Age calculation: albumin, creatinine, glucose, crp, lymphocyte_percent, mcv, rdw, alp, wbc
  const possibleBiomarkers = [
    // === CORE PHENOAGE BIOMARKERS (9 essential) ===
    { biomarkerId: "albumin", name: "Albumin", value: 42, unit: "g/L" },                           // Core
    { biomarkerId: "creatinine", name: "Creatinine", value: 85, unit: "umol/L" },                  // Core
    { biomarkerId: "glucose", name: "Glucose, Fasting", value: 5.1, unit: "mmol/L" },              // Core
    { biomarkerId: "crp", name: "C-Reactive Protein", value: 1.2, unit: "mg/L" },                  // Core
    { biomarkerId: "lymphocyte_percent", name: "Lymphocyte %", value: 28, unit: "%" },             // Core
    { biomarkerId: "mcv", name: "Mean Cell Volume", value: 88, unit: "fL" },                       // Core
    { biomarkerId: "rdw", name: "Red Cell Distribution Width", value: 13.0, unit: "%" },           // Core
    { biomarkerId: "alp", name: "Alkaline Phosphatase", value: 70, unit: "U/L" },                  // Core
    { biomarkerId: "wbc", name: "White Blood Cells", value: 6.0, unit: "x10^9/L" },                // Core
    // === RECOMMENDED BIOMARKERS ===
    { biomarkerId: "hemoglobin", name: "Haemoglobin", value: 145, unit: "g/L" },
    { biomarkerId: "hba1c", name: "HbA1c", value: 5.3, unit: "%" },
    { biomarkerId: "hdl_cholesterol", name: "HDL Cholesterol", value: 1.4, unit: "mmol/L" },
    { biomarkerId: "ldl_cholesterol", name: "LDL Cholesterol", value: 2.9, unit: "mmol/L" },
    { biomarkerId: "triglycerides", name: "Triglycerides", value: 1.2, unit: "mmol/L" },
    { biomarkerId: "total_cholesterol", name: "Total Cholesterol", value: 4.8, unit: "mmol/L" },
    { biomarkerId: "alt", name: "ALT (SGPT)", value: 28, unit: "U/L" },
    { biomarkerId: "ast", name: "AST (SGOT)", value: 24, unit: "U/L" },
    { biomarkerId: "ggt", name: "GGT", value: 25, unit: "U/L" },
    { biomarkerId: "egfr", name: "eGFR", value: 92, unit: "mL/min/1.73m2" },
    { biomarkerId: "tsh", name: "TSH", value: 2.1, unit: "mIU/L" },
    // === OPTIONAL BIOMARKERS ===
    { biomarkerId: "vitamin_d", name: "Vitamin D, 25-OH", value: 72, unit: "nmol/L" },
    { biomarkerId: "vitamin_b12", name: "Vitamin B12", value: 320, unit: "pmol/L" },
    { biomarkerId: "iron", name: "Iron, Serum", value: 18, unit: "umol/L" },
    { biomarkerId: "ferritin", name: "Ferritin", value: 95, unit: "ug/L" },
    { biomarkerId: "free_t4", name: "Free T4", value: 14.5, unit: "pmol/L" },
    { biomarkerId: "cortisol", name: "Cortisol, AM", value: 380, unit: "nmol/L" },
  ];

  // ALWAYS include the 9 core PhenoAge biomarkers, then add some additional ones
  const coreBiomarkerIds = ["albumin", "creatinine", "glucose", "crp", "lymphocyte_percent", "mcv", "rdw", "alp", "wbc"];
  const coreBiomarkers = possibleBiomarkers.filter(b => coreBiomarkerIds.includes(b.biomarkerId));
  const optionalBiomarkers = possibleBiomarkers.filter(b => !coreBiomarkerIds.includes(b.biomarkerId));

  // Randomly select 5-10 additional biomarkers
  const numAdditional = Math.floor(Math.random() * 6) + 5;
  const shuffledOptional = [...optionalBiomarkers].sort(() => Math.random() - 0.5);
  const selected = [...coreBiomarkers, ...shuffledOptional.slice(0, numAdditional)];

  // Create current results
  const currentResults = selected.map(b => ({
    ...b,
    value: Math.round((b.value * (0.9 + Math.random() * 0.2)) * 100) / 100,
    confidence: 0.88 + Math.random() * 0.11,
    testDate: formatDate(today),
    isHistorical: false,
  }));

  // Add some historical results (50% chance for each biomarker to have history)
  const historicalResults: typeof currentResults = [];
  selected.slice(0, 6).forEach(b => {
    // Add 3-month-ago result
    historicalResults.push({
      ...b,
      value: Math.round((b.value * (0.85 + Math.random() * 0.3)) * 100) / 100,
      confidence: 0.85 + Math.random() * 0.10,
      testDate: formatDate(threeMonthsAgo),
      isHistorical: true,
    });

    // 50% chance to also have 6-month-ago result
    if (Math.random() > 0.5) {
      historicalResults.push({
        ...b,
        value: Math.round((b.value * (0.8 + Math.random() * 0.4)) * 100) / 100,
        confidence: 0.82 + Math.random() * 0.10,
        testDate: formatDate(sixMonthsAgo),
        isHistorical: true,
      });
    }
  });

  return {
    biomarkers: [...currentResults, ...historicalResults],
    labName: "Pathology Australia (Demo)",
    testDates: [formatDate(today), formatDate(threeMonthsAgo), formatDate(sixMonthsAgo)],
    hasHistoricalData: historicalResults.length > 0,
    patientName: null
  };
}
