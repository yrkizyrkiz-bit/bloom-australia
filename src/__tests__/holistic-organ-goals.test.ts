import { describe, expect, it } from "vitest";
import {
  getApprovedOrganSystem,
  isHolisticReportApproved,
  sanitizeHolisticHealthReport,
  uniqueOrganGoals,
  type HolisticOrganSystem,
} from "@/lib/holistic-health-report-types";

function organ(
  id: HolisticOrganSystem["id"],
  goal: string,
  extras: Partial<HolisticOrganSystem> = {}
): HolisticOrganSystem {
  return {
    id,
    label: id,
    score: 80,
    status: "optimal",
    trend: "stable",
    summary: `${id} summary`,
    biomarkersTracked: 3,
    highlights: [],
    goal,
    ...extras,
  };
}

describe("unique organ goals", () => {
  it("keeps the first organ that owns a goal and blanks later duplicates", () => {
    const result = uniqueOrganGoals([
      organ("liver", "Eat more vegetables"),
      organ("heart", "Eat more vegetables"),
      organ("kidney", "Drink more water"),
    ]);
    expect(result.map((o) => o.goal)).toEqual(["Eat more vegetables", "", "Drink more water"]);
  });

  it("treats near-paraphrase punctuation as the same goal", () => {
    const result = uniqueOrganGoals([
      organ("liver", "Bring ALT into range"),
      organ("heart", "Bring ALT into range!"),
    ]);
    expect(result[1].goal).toBe("");
  });
});

describe("approved organ extraction", () => {
  it("returns null until the report is approved", () => {
    const report = sanitizeHolisticHealthReport({
      approvalStatus: "pending_approval",
      organSystems: [organ("liver", "Bring ALT into range", { riskFactor: "Raised liver enzyme (ALT)" })],
      executiveSummary: "Summary.",
    });
    expect(isHolisticReportApproved(report)).toBe(false);
    expect(getApprovedOrganSystem(report, "liver")).toBeNull();
  });

  it("returns the matching organ after approval", () => {
    const report = sanitizeHolisticHealthReport({
      approvalStatus: "approved",
      organSystems: [
        organ("liver", "Bring ALT into range", {
          riskFactor: "Raised liver enzyme (ALT)",
          gaps: ["Missing follow-up GGT"],
        }),
        organ("heart", "Bring ALT into range"),
      ],
      executiveSummary: "Summary.",
    });
    expect(isHolisticReportApproved(report)).toBe(true);
    const liver = getApprovedOrganSystem(report, "liver");
    expect(liver?.riskFactor).toBe("Raised liver enzyme (ALT)");
    expect(liver?.gaps).toEqual(["Missing follow-up GGT"]);
    expect(liver?.goal).toBe("Bring ALT into range");
    expect(getApprovedOrganSystem(report, "heart")?.goal).toBe("");
  });
});

describe("holistic organ goal suggestions", () => {
  it("turns the unique organ goal into an addable suggestion", async () => {
    const { normalizeHolisticOrganForGoals } = await import("@/lib/organ-ai-recommendations");
    const report = sanitizeHolisticHealthReport({
      approvalStatus: "approved",
      aiProvider: "claude",
      executiveSummary: "Summary.",
      organSystems: [
        organ("liver", "Keep liver enzymes in range on your next blood test", {
          gaps: ["Confirm ALP is moving the right way."],
        }),
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
            trend: "worsening",
            previousValue: 28,
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

    const liver = report!.organSystems[0];
    const analysis = normalizeHolisticOrganForGoals(
      report!,
      liver,
      "liver",
      [{ biomarkerId: "ggt", value: 33 }],
      "male"
    );

    expect(analysis.recommendations).toHaveLength(1);
    expect(analysis.recommendations[0]?.id).toBe("liver-goal");
    expect(analysis.recommendations[0]?.description).toBe(
      "Keep liver enzymes in range on your next blood test"
    );
    expect(analysis.biomarkerGoals).toEqual([]);
  });

  it("does not repeat a goal already used by another organ", async () => {
    const { normalizeHolisticOrganForGoals } = await import("@/lib/organ-ai-recommendations");
    const report = sanitizeHolisticHealthReport({
      approvalStatus: "approved",
      aiProvider: "claude",
      executiveSummary: "Summary.",
      organSystems: [
        organ("liver", "Keep enzymes in range"),
        organ("heart", "Keep enzymes in range"),
      ],
    });
    const heart = report!.organSystems.find((row) => row.id === "heart")!;
    const analysis = normalizeHolisticOrganForGoals(report!, heart, "heart", [], "male");
    expect(heart.goal).toBe("");
    expect(analysis.recommendations).toEqual([]);
  });
});
