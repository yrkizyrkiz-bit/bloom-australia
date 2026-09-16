import { describe, expect, it } from "vitest";
import { normalizeLiverAnalysis } from "@/lib/liver-analysis-normalize";

describe("normalizeLiverAnalysis", () => {
  it("maps compact cached reports onto the risk UI fields", () => {
    const normalized = normalizeLiverAnalysis({
      overallRiskScore: 28,
      summary: "Liver looks steady.",
      riskFactors: [
        { factor: "Enzyme load", detail: "ALT is slightly up", severity: "low" },
      ],
      predictions: [
        { prediction: "Fatty liver", detail: "Watch waist and alcohol", timeframe: "5 years" },
      ],
    });

    expect(normalized.riskFactors[0].name).toBe("Enzyme load");
    expect(normalized.riskFactors[0].explanation).toBe("ALT is slightly up");
    expect(normalized.riskFactors[0].currentRisk).toBe(18);
    expect(normalized.predictions[0].condition).toBe("Fatty liver");
    expect(normalized.predictions[0].keyFactors).toEqual(["Watch waist and alcohol"]);
    expect(() => normalized.predictions[0].keyFactors.slice(0, 2)).not.toThrow();
  });
});
