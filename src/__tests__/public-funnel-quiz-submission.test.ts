import { describe, expect, it, vi, beforeEach } from "vitest";

const { findFirst, create } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    portalQuizSubmission: {
      findFirst,
    },
  },
}));

vi.mock("@/lib/portal-quiz-submissions", () => ({
  savePortalQuizSubmission: create,
}));

describe("public-funnel quiz submission", () => {
  beforeEach(() => {
    findFirst.mockReset();
    create.mockReset();
    create.mockResolvedValue({ id: "quiz-new" });
  });

  it("savePublicFunnelQuizFromIntake is idempotent when a row already exists", async () => {
    findFirst.mockResolvedValue({ id: "quiz-existing" });
    const { savePublicFunnelQuizFromIntake } = await import(
      "@/lib/portal/public-funnel-quiz-submission"
    );

    const result = await savePublicFunnelQuizFromIntake({
      userId: "user-1",
      program: "MENS_HEALTH",
      intakeData: {
        concern: "sexual-health",
        canonicalProgramKey: "MENS_HEALTH_SEXUAL",
      },
    });

    expect(result).toEqual({ id: "quiz-existing" });
    expect(create).not.toHaveBeenCalled();
  });

  it("appendPublicFunnelQuizFromIntake always creates a new submission", async () => {
    findFirst.mockResolvedValue({ id: "quiz-existing" });
    const { appendPublicFunnelQuizFromIntake } = await import(
      "@/lib/portal/public-funnel-quiz-submission"
    );

    const result = await appendPublicFunnelQuizFromIntake({
      userId: "user-1",
      program: "MENS_HEALTH",
      intakeData: {
        concern: "vitality",
        canonicalProgramKey: "MENS_HEALTH_VITALITY",
      },
    });

    expect(result).toEqual({ id: "quiz-new" });
    expect(create).toHaveBeenCalledOnce();
  });

  it("strips address and account fields from stored public funnel quiz answers", async () => {
    const { sanitizePublicFunnelIntakeAnswers } = await import(
      "@/lib/portal/public-funnel-quiz-submission"
    );

    const answers = sanitizePublicFunnelIntakeAnswers({
      gender: "female",
      hairStage: "type-2",
      streetAddress: "1 Test Street",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
      email: "polly@example.com",
      firstName: "Polly",
      programType: "HAIR_LOSS",
    });

    expect(answers).toEqual({
      gender: "female",
      hairStage: "type-2",
    });
  });
});
