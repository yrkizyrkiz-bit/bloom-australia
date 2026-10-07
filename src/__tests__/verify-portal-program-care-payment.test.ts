import { describe, expect, it } from "vitest";
import {
  programKeysForPrescriptionCategory,
} from "@/lib/stripe/verify-portal-program-care-payment";

describe("programKeysForPrescriptionCategory", () => {
  it("maps hair / sexual / hormone categories to program keys", () => {
    expect(programKeysForPrescriptionCategory("HAIR_LOSS")).toEqual(["HAIR_LOSS"]);
    expect(programKeysForPrescriptionCategory("SEXUAL_HEALTH")).toEqual([
      "MENS_HEALTH_SEXUAL",
      "MENS_HEALTH_VITALITY",
    ]);
    expect(programKeysForPrescriptionCategory("HORMONE_THERAPY")).toEqual([
      "WOMENS_HEALTH_SEXUAL",
      "WOMENS_HEALTH_VITALITY",
    ]);
    expect(programKeysForPrescriptionCategory("WEIGHT_MANAGEMENT")).toEqual([]);
  });
});
