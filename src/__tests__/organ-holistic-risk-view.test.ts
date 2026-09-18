import { describe, expect, it } from "vitest";
import { buildOrganRiskAssessmentView, riskLevelFromScore } from "@/lib/organ-holistic-risk-view";
import { sanitizeHolisticHealthReport } from "@/lib/holistic-health-report-types";

describe("organ holistic risk view", () => {
  it("maps a high organ score to low overall risk", () => {
    expect(riskLevelFromScore(13).label).toBe("Low");
    expect(riskLevelFromScore(45).label).toBe("Elevated");
  });

  it("builds expandable factors from risk factor, gaps, and organ markers", () => {
    const report = sanitizeHolisticHealthReport({
      approvalStatus: "approved",
      aiProvider: "claude",
      executiveSummary: "Summary.",
      organSystems: [
        {
          id: "liver",
          label: "Liver",
          score: 87,
          status: "optimal",
          trend: "stable",
          summary: "Liver looks stable overall.",
          biomarkersTracked: 7,
          highlights: ["GGT is worth watching."],
          riskFactor: "Liver enzyme (GGT): result is 33 U/L.",
          gaps: ["Confirm ALP is moving the right way."],
          goal: "Keep liver enzymes in range on your next blood test",
        },
      ],
      priorityBands: {
        good: [],
        lookOut: [
          {
            biomarkerId: "ggt",
            name: "GGT",
            category: "liver",
            value: 33,
            unit: "U/L",
            status: "normal",
            testedAt: "2026-09-13",
            previousValue: 28,
            trend: "worsening",
            plainEnglish: "GGT is 33 U/L.",
            band: "look_out",
          },
        ],
        needsAttention: [],
        immediate: [],
      },
      recommendations: [
        {
          category: "lifestyle",
          priority: "medium",
          action: "Keep alcohol intake modest to support liver enzymes.",
          rationale: "Liver support",
        },
      ],
    });

    const organ = report!.organSystems[0];
    const view = buildOrganRiskAssessmentView(report!, organ, "liver");
    expect(view.riskScore).toBe(13);
    expect(view.riskLabel).toBe("Low");
    expect(view.riskFactors.length).toBeGreaterThan(0);
    expect(view.riskFactors[0]?.name).toContain("GGT");
    expect(view.riskFactors[0]?.trendLabel).toBe("Still optimal");
    expect(view.riskFactors[0]?.contributingBiomarkers[0]?.trendLabel).toBe(
      "Elevated but still normal"
    );
  });

  it("strips GP handoff wording and does not repeat the organ goal", () => {
    const report = sanitizeHolisticHealthReport({
      approvalStatus: "approved",
      aiProvider: "claude",
      executiveSummary: "Summary.",
      organSystems: [
        {
          id: "liver",
          label: "Liver",
          score: 80,
          status: "watch",
          trend: "stable",
          summary: "Summary.",
          biomarkersTracked: 3,
          highlights: [],
          goal: "Keep alcohol modest for liver enzymes",
        },
      ],
      recommendations: [
        {
          category: "lifestyle",
          priority: "medium",
          action: "Keep alcohol modest for liver enzymes",
          rationale: "Same as the organ goal",
        },
        {
          category: "monitoring",
          priority: "medium",
          action: "Talk with your GP about liver enzymes and when to retest.",
          rationale: "GP follow-up",
        },
        {
          category: "lifestyle",
          priority: "low",
          action: "Mention GGT to your GP at the next visit.",
          rationale: "GP follow-up",
        },
      ],
      crossSystemPatterns: [
        {
          title: "Liver and metabolic pattern",
          severity: "medium",
          involvedSystems: ["liver"],
          involvedBiomarkers: ["ggt"],
          explanation: "Liver enzymes can move with blood sugar and blood fats.",
          monitoringAdvice: "Ask your GP to review liver enzymes at your next test.",
        },
      ],
    });

    const organ = report!.organSystems[0];
    const view = buildOrganRiskAssessmentView(report!, organ, "liver");
    expect(view.watchItems[0]?.advice).toBe("");
    expect(view.watchItems[0]?.advice.toLowerCase()).not.toContain("gp");
    expect(view.watchItems[0]?.advice.toLowerCase()).not.toContain("ask your");
    expect(view.watchItems[0]?.explanation.toLowerCase()).not.toContain("gp");
  });
});
