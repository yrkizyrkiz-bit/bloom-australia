import { describe, expect, it } from "vitest";
import {
  coerceBiomarkerValue,
  normalizeExtractedBiomarkerValues,
  normalizeHematocritValue,
  normalizeUacrValue,
  normalizeZincValue,
  resolveCatalogBiomarkerId,
} from "@/lib/blood-test/normalize-extracted-biomarkers";

describe("normalize-extracted-biomarkers", () => {
  it("coerces string lab values with flags and commas", () => {
    expect(coerceBiomarkerValue(126)).toBe(126);
    expect(coerceBiomarkerValue("126 L")).toBe(126);
    expect(coerceBiomarkerValue("1,234.5")).toBe(1234.5);
    expect(coerceBiomarkerValue("<0.5")).toBe(0.5);
    expect(coerceBiomarkerValue("n/a")).toBeNull();
  });

  it("resolves AU spellings and aliases to catalog IDs", () => {
    expect(resolveCatalogBiomarkerId("haemoglobin")).toBe("hemoglobin");
    expect(resolveCatalogBiomarkerId("WCC")).toBe("wbc");
    expect(resolveCatalogBiomarkerId(undefined, "Haemoglobin")).toBe("hemoglobin");
    expect(resolveCatalogBiomarkerId("not_a_real_marker")).toBeNull();
  });

  it("normalises haematocrit % → L/L", () => {
    expect(normalizeHematocritValue(42)).toBe(0.42);
    expect(normalizeHematocritValue(0.42)).toBe(0.42);
    expect(normalizeHematocritValue(42, "%")).toBe(0.42);
  });

  it("normalises UACR mg/g → mg/mmol", () => {
    expect(normalizeUacrValue(30, "mg/g")).toBeCloseTo(3.39, 1);
    expect(normalizeUacrValue(1.8, "mg/mmol")).toBe(1.8);
    expect(normalizeUacrValue(88)).toBeCloseTo(9.944, 2);
  });

  it("normalises zinc µg/dL → µmol/L", () => {
    expect(normalizeZincValue(85, "µg/dL")).toBeCloseTo(13.0, 0);
    expect(normalizeZincValue(14, "µmol/L")).toBe(14);
  });

  it("applies AU scale fixes on extracted batches", () => {
    const out = normalizeExtractedBiomarkerValues([
      { biomarkerId: "hematocrit", value: 42, unit: "%" },
      { biomarkerId: "uacr", value: 30, unit: "mg/g" },
      { biomarkerId: "zinc", value: 85, unit: "µg/dL" },
    ]);
    expect(out[0].value).toBe(0.42);
    expect(out[0].unit).toBe("L/L");
    expect(out[1].value).toBeCloseTo(3.39, 1);
    expect(out[1].unit).toBe("mg/mmol");
    expect(out[2].unit).toBe("µmol/L");
  });
});
