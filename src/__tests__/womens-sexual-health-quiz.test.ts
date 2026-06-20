import { describe, it, expect } from "vitest";
import {
  getWomensSexualHealthQuizSteps,
  womensFocusLabel,
} from "@/lib/programs/quizzes/womens-sexual-health-quiz";

describe("getWomensSexualHealthQuizSteps", () => {
  it("starts with treatment focus only before a path is chosen", () => {
    const steps = getWomensSexualHealthQuizSteps();
    expect(steps).toHaveLength(1);
    expect(steps[0].id).toBe("treatmentFocus");
  });

  it("branches libido path with life stage question", () => {
    const ids = getWomensSexualHealthQuizSteps("libido").map((s) => s.id);
    expect(ids).toContain("libidoDuration");
    expect(ids).toContain("lifeStage");
    expect(ids).not.toContain("painDuration");
  });

  it("branches pain path with discomfort questions", () => {
    const ids = getWomensSexualHealthQuizSteps("pain").map((s) => s.id);
    expect(ids).toContain("painDuration");
    expect(ids).toContain("painType");
    expect(ids).not.toContain("libidoMainIssue");
  });

  it("branches both with libido and pain questions", () => {
    const ids = getWomensSexualHealthQuizSteps("both").map((s) => s.id);
    expect(ids).toContain("libidoDuration");
    expect(ids).toContain("painDuration");
    expect(ids).toContain("lifeStage");
  });

  it("labels focus for consultation copy", () => {
    expect(womensFocusLabel("both")).toBe("Libido and pain concerns");
  });
});
