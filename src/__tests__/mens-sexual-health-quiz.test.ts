import { describe, it, expect } from "vitest";
import {
  getMensSexualHealthQuizSteps,
  focusLabel,
} from "@/lib/programs/quizzes/mens-sexual-health-quiz";

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
  });

  it("branches PE without nitrates question", () => {
    const ids = getMensSexualHealthQuizSteps("pe").map((s) => s.id);
    expect(ids).toContain("peDuration");
    expect(ids).toContain("peFrequency");
    expect(ids).not.toContain("takingNitrates");
  });

  it("branches Both with ED and PE questions plus nitrates", () => {
    const ids = getMensSexualHealthQuizSteps("both").map((s) => s.id);
    expect(ids).toContain("edDuration");
    expect(ids).toContain("peDuration");
    expect(ids).toContain("takingNitrates");
  });

  it("labels focus for consultation copy", () => {
    expect(focusLabel("both")).toBe("ED and PE");
  });
});
