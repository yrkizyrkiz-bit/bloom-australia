import { extractText } from "unpdf";

const LAB_HINT =
  /\b(mmol|umol|µmol|g\/L|U\/L|nmol|pmol|fL|%|HbA1c|eGFR|cholesterol|haemoglobin|hemoglobin|creatinine|triglyceride|ferritin|TSH|WBC|RBC|platelet)\b/i;

/**
 * Extract selectable text from a pathology PDF.
 * Returns null when the PDF is likely scanned/image-only.
 */
export async function extractPathologyPdfText(
  bytes: ArrayBuffer | Uint8Array
): Promise<{ text: string; totalPages: number } | null> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try {
    const { text, totalPages } = await extractText(data, { mergePages: true });
    const cleaned = (text || "")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleaned.length < 400) {
      console.log(
        `[Blood Test Parser] PDF text too short (${cleaned.length} chars) — will use document vision`
      );
      return null;
    }

    if (!LAB_HINT.test(cleaned) && !/\d+[.,]?\d*/.test(cleaned)) {
      console.log(
        "[Blood Test Parser] PDF text lacks lab-like content — will use document vision"
      );
      return null;
    }

    // Cap extremely long multi-year reports so Claude stays within Netlify time budgets.
    const maxChars = 60_000;
    const truncated =
      cleaned.length > maxChars
        ? `${cleaned.slice(0, maxChars)}\n\n[TRUNCATED: document continued beyond ${maxChars} characters]`
        : cleaned;

    console.log(
      `[Blood Test Parser] Extracted ${truncated.length} chars of PDF text across ${totalPages} page(s)`
    );

    return { text: truncated, totalPages };
  } catch (error) {
    console.warn("[Blood Test Parser] PDF text extraction failed:", error);
    return null;
  }
}
