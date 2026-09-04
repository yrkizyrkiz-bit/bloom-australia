import { describe, expect, it } from "vitest";
import {
  formatPortalQuizAnswers,
  isProgramQuizIntakeNote,
  portalQuizTabLabel,
} from "@/lib/portal-quiz-display";

describe("portalQuizTabLabel", () => {
  it("labels the hair program tab Hair health", () => {
    expect(portalQuizTabLabel("HAIR_LOSS")).toBe("Hair health");
  });
});

describe("isProgramQuizIntakeNote", () => {
  it("hides system program quiz dumps from Notes, not staff notes or triage workflow", () => {
    expect(
      isProgramQuizIntakeNote({ title: "Hair Loss, Stage", createdBy: "system" })
    ).toBe(true);
    expect(
      isProgramQuizIntakeNote({
        title: "Men's Sexual Health, ED Duration",
        createdBy: "system",
      })
    ).toBe(true);
    expect(
      isProgramQuizIntakeNote({
        title: "Women's Health, Primary Concerns",
        createdBy: "system",
      })
    ).toBe(true);
    expect(
      isProgramQuizIntakeNote({
        title: "Triage, Metabolic Conditions",
        createdBy: "system",
      })
    ).toBe(true);
    expect(
      isProgramQuizIntakeNote({ title: "Triage Started", createdBy: "system" })
    ).toBe(false);
    expect(
      isProgramQuizIntakeNote({ title: "Care partner follow-up", createdBy: "system" })
    ).toBe(false);
    expect(
      isProgramQuizIntakeNote({ title: "Hair Loss, Stage", createdBy: "jane@sanative.com" })
    ).toBe(false);
  });
});

describe("formatPortalQuizAnswers", () => {
  it("shows hair quiz questions in public intake order, not address fields", () => {
    const rows = formatPortalQuizAnswers(
      "HAIR_LOSS",
      {
        gender: "female",
        hairStage: "type-2",
        hairLossTimeline: "Gradually over the past year",
        familyHistory: "Yes",
        medicalConditions: ["Thyroid condition", "PCOS"],
        pregnancyStatus: "No",
        otherConcerns: ["Just hair health for now"],
        streetAddress: "1 Pocket Lane",
        suburb: "Sydney",
        postcode: "2000",
        firstName: "Polly",
        programType: "HAIR_LOSS",
      },
      "male"
    );

    expect(rows.map((row) => row.questionId)).toEqual([
      "gender",
      "hairStage",
      "hairLossTimeline",
      "familyHistory",
      "medicalConditions",
      "pregnancyStatus",
      "otherConcerns",
    ]);
    expect(rows.map((row) => row.question)).toEqual([
      "What's your biological sex?",
      "How would you describe your hair right now?",
      "When did you start noticing changes?",
      "Any hair loss in your family?",
      "Any health conditions we should know about?",
      "Are you currently pregnant or planning to be?",
      "Anything else on your health radar?",
    ]);
    expect(rows.map((row) => row.answerLabel)).toEqual([
      "Female",
      "Noticeable thinning",
      "Gradually over the past year",
      "Yes, on one or both sides",
      "Thyroid condition; PCOS",
      "No, neither",
      "Just hair health for now",
    ]);
    expect(rows.map((row) => row.question).join(" ")).not.toMatch(
      /Street Address|Suburb|Postcode|First Name/i
    );
  });

  it("shows men's sexual health quiz in clinical order, not leftover keys or address", () => {
    const rows = formatPortalQuizAnswers(
      "MENS_HEALTH_SEXUAL",
      {
        concern: "erectile-dysfunction",
        treatmentFocus: "ed",
        edDuration: "3-6-months",
        edSeverity: "moderate",
        edMainIssue: "maintaining",
        takingNitrates: "no",
        previousTreatment: "none",
        streetAddress: "9 Test St",
        firstName: "Dicky",
      },
      "male"
    );

    expect(rows.map((row) => row.questionId)).toEqual([
      "treatmentFocus",
      "edDuration",
      "edSeverity",
      "edMainIssue",
      "takingNitrates",
      "previousTreatment",
    ]);
    expect(rows[0]?.answerLabel).toBe("Erectile Dysfunction (ED)");
    expect(rows.map((row) => row.question).join(" ")).not.toMatch(
      /Street Address|First Name|Concern/i
    );
  });

  it("shows women's public assessment questions in intake order", () => {
    const rows = formatPortalQuizAnswers(
      "WOMENS_HEALTH_VITALITY",
      {
        category: "menopause",
        primaryConcerns: ["Hot flushes", "Sleep disturbances"],
        symptomDuration: "6-12 months",
        currentTreatments: ["No current treatment"],
        medicalConditions: ["None of these"],
        menstrualStatus: "Perimenopause",
        familyHistory: ["None of these"],
        goals: ["Relieve symptoms"],
        streetAddress: "2 Test Ave",
      },
      "female"
    );

    expect(rows.map((row) => row.questionId)).toEqual([
      "category",
      "primaryConcerns",
      "symptomDuration",
      "currentTreatments",
      "medicalConditions",
      "menstrualStatus",
      "familyHistory",
      "goals",
    ]);
    expect(rows[0]?.answerLabel).toBe("Menopause & Perimenopause");
    expect(rows.map((row) => row.question).join(" ")).not.toMatch(/Street Address/i);
  });
});
