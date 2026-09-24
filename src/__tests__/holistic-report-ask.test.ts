import { describe, expect, it } from "vitest";
import {
  answerReportAskQuestion,
  buildReportAskItems,
  refreshAskQuestions,
} from "@/lib/holistic-report-ask";
import type {
  HolisticHealthReport,
  HolisticMarkerItem,
} from "@/lib/holistic-health-report-types";

function marker(
  overrides: Partial<HolisticMarkerItem> & Pick<HolisticMarkerItem, "biomarkerId" | "name" | "band">
): HolisticMarkerItem {
  return {
    value: 10,
    unit: "ug/L",
    status: "out_of_range",
    trend: "unknown",
    plainEnglish: `${overrides.name}: Your result is 10 ug/L.`,
    ...overrides,
  } as HolisticMarkerItem;
}

function report(): HolisticHealthReport {
  return {
    reportTitle: "Test",
    overallHealthScore: 70,
    overallRisk: "moderate",
    executiveSummary: "",
    priorityBands: {
      immediate: [marker({ biomarkerId: "ferritin", name: "Iron stores (ferritin)", band: "immediate" })],
      needsAttention: [marker({ biomarkerId: "hemoglobin", name: "Haemoglobin (oxygen in blood)", band: "needs_attention" })],
      lookOut: [marker({ biomarkerId: "hba1c", name: "Average blood sugar (HbA1c)", band: "look_out", status: "normal" })],
      good: [marker({ biomarkerId: "crp", name: "CRP", band: "good", status: "normal" })],
    },
    organSystems: [],
    crossSystemPatterns: [],
    programContributions: [],
    recommendations: [],
    questionsForCareTeam: [],
    retestingGuidance: "",
    urgentActions: [],
    limitations: [],
    analysisTimestamp: new Date().toISOString(),
  } as unknown as HolisticHealthReport;
}

describe("holistic report Ask questions", () => {
  it("reads as natural English and keeps acronyms intact", () => {
    const questions = buildReportAskItems(report()).map((i) => i.question);
    expect(questions).toContain("Why does my iron stores (ferritin) need prompt attention?");
    expect(questions).toContain("Why does my haemoglobin (oxygen in blood) need attention?");
    expect(questions).toContain("Why is my average blood sugar (HbA1c) worth keeping an eye on?");
    for (const q of questions) {
      expect(q).not.toMatch(/\bis my .* needs\b/i);
      expect(q).not.toMatch(/hba1c|crp\b/);
    }

    // "Good" markers only pad the list when there are few flagged ones.
    const mostlyGood = report();
    mostlyGood.priorityBands.needsAttention = [];
    mostlyGood.priorityBands.lookOut = [];
    expect(buildReportAskItems(mostlyGood).map((i) => i.question)).toContain(
      "Is my inflammation marker (CRP) looking okay?"
    );
  });

  it("refreshes legacy question wording on cached items while keeping the stored answer", () => {
    const cached = [
      {
        id: "marker-ferritin",
        question: "Why is my iron stores (ferritin) needs prompt attention?",
        intro: "Claude-authored intro",
        bullets: [{ title: "Iron stores (ferritin): 10 ug/L", body: "body" }],
        insight: "insight",
      },
      {
        id: "pattern-0",
        question: "What does “Blood sugar and blood fats moving together” mean for me?",
        intro: "pattern intro",
        bullets: [{ title: "t", body: "b" }],
      },
    ];
    const refreshed = refreshAskQuestions(report(), cached);
    expect(refreshed).toHaveLength(2);
    expect(refreshed[0].question).toBe("Why does my iron stores (ferritin) need prompt attention?");
    expect(refreshed[0].intro).toBe("Claude-authored intro");
    // Pattern ids are positional, so their wording must not be swapped.
    expect(refreshed[1].question).toBe("What does “Blood sugar and blood fats moving together” mean for me?");
  });

  it("matches a free-text question to the nearest prepared answer", () => {
    const r = report();
    const catalog = buildReportAskItems(r);
    const answer = answerReportAskQuestion(r, "what is going on with my ferritin", catalog);
    expect(answer.id).toBe("marker-ferritin");
  });

  it("maps everyday words to the marker that answers them", () => {
    const r = report();
    const catalog = buildReportAskItems(r);
    const diabetes = answerReportAskQuestion(r, "am I diabetic?", catalog);
    expect(diabetes.id).toBe("topic-diabetes");
    expect(diabetes.intro).toMatch(/cannot diagnose diabetes/i);
    expect(diabetes.bullets.some((b) => /hba1c|blood sugar/i.test(`${b.title} ${b.body}`))).toBe(true);
    expect(diabetes.intro).not.toMatch(/highest-impact finding/i);

    expect(answerReportAskQuestion(r, "Am I anaemic", catalog).id).toBe("topic-anaemia");
    expect(answerReportAskQuestion(r, "any inflammation?", catalog).id).toMatch(
      /^(topic-inflammation|marker-crp)$/
    );
  });

  it("never answers a different question when nothing in the report matches", () => {
    const r = report();
    const catalog = buildReportAskItems(r);
    const answer = answerReportAskQuestion(r, "should I take up running?", catalog);
    expect(answer.id).toBe("no-match");
    expect(answer.question).toBe("should I take up running?");
    expect(answer.intro).toMatch(/couldn’t find/);
    // The explicit "what should I do" style still gets the overall action plan.
    expect(answerReportAskQuestion(r, "what should I do first?", catalog).id).toBe("overall-actions");
  });
});
