import { describe, it, expect } from "vitest";
import {
  getMensSexualHealthQuizSteps,
  focusLabel,
} from "@/lib/programs/quizzes/mens-sexual-health-quiz";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";

describe("getMensSexualHealthQuizSteps", () => {
  it("starts with treatment focus only before a path is chosen", () => {
    const steps = getMensSexualHealthQuizSteps();
    expect(steps).toHaveLength(1);
    expect(steps[0].id).toBe("treatmentFocus");
  });

  it("branches ED with nitrates safety question", () => {
    const ids = getMensSexualHealthQuizSteps("ed").map((s) => s.id);
    expect(ids[0]).toBe("treatmentFocus");
    expect(ids).toContain("edDuration");
    expect(ids).toContain("takingNitrates");
    expect(ids).not.toContain("peDuration");
    expect(ids).not.toContain("startTiming");
  });

  it("branches PE without nitrates question", () => {
    const ids = getMensSexualHealthQuizSteps("pe").map((s) => s.id);
    expect(ids).toContain("peDuration");
    expect(ids).toContain("peFrequency");
    expect(ids).not.toContain("takingNitrates");
    expect(ids).not.toContain("startTiming");
  });

  it("branches Both with ED and PE questions plus nitrates", () => {
    const ids = getMensSexualHealthQuizSteps("both").map((s) => s.id);
    expect(ids).toContain("edDuration");
    expect(ids).toContain("peDuration");
    expect(ids).toContain("takingNitrates");
    expect(ids).not.toContain("startTiming");
  });

  it("labels focus for consultation copy", () => {
    expect(focusLabel("both")).toBe("ED and PE");
  });
});

describe("men's vitality public funnel quiz", () => {
  it("does not ask how soon they want to speak with a doctor", () => {
    const steps = getPublicFunnelQuizSteps("MENS_HEALTH_VITALITY") ?? [];
    expect(steps.map((s) => s.id)).not.toContain("startTiming");
    expect(steps.map((s) => s.prompt).join(" ")).not.toMatch(
      /How soon would you like to speak with a doctor/i
    );
  });
});
