import { describe, expect, it } from "vitest";
import {
  HBA1C_IFCC_TO_NGSP,
  normalizeExtractedHba1cEntries,
  normalizeHba1cValueToPercent,
} from "@/lib/blood-test/normalize-hba1c";

describe("normalize-hba1c", () => {
  it("converts IFCC mmol/mol to NGSP %", () => {
    expect(HBA1C_IFCC_TO_NGSP(39)).toBe(5.7);
    expect(normalizeHba1cValueToPercent(39, "mmol/mol")).toEqual({
      value: 5.7,
      unit: "%",
      convertedFromIfcc: true,
    });
    expect(normalizeHba1cValueToPercent(39, "%")?.convertedFromIfcc).toBe(true);
  });

  it("keeps NGSP percent values", () => {
    expect(normalizeHba1cValueToPercent(5.7, "%")).toEqual({
      value: 5.7,
      unit: "%",
      convertedFromIfcc: false,
    });
  });

  it("dedupes 39 mmol/mol and 5.7% on the same date to a single 5.7%", () => {
    const out = normalizeExtractedHba1cEntries([
      {
        biomarkerId: "hba1c",
        value: 39,
        unit: "mmol/mol",
        testDate: "2026-09-03",
        confidence: 0.97,
      },
      {
        biomarkerId: "hba1c",
        value: 5.7,
        unit: "%",
        testDate: "2026-09-03",
        confidence: 0.97,
      },
      {
        biomarkerId: "glucose",
        value: 5.1,
        unit: "mmol/L",
        testDate: "2026-09-03",
      },
    ]);
    const hba1c = out.filter((b) => b.biomarkerId === "hba1c");
    expect(hba1c).toHaveLength(1);
    expect(hba1c[0].value).toBe(5.7);
    expect(out.some((b) => b.biomarkerId === "glucose")).toBe(true);
  });
});
