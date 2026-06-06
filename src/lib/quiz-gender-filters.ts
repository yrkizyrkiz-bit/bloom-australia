export type QuizGender = "male" | "female" | "";

const FEMALE_ONLY_METABOLIC = new Set([
  "Polycystic ovary syndrome (PCOS)",
]);

const FEMALE_ONLY_SERIOUS = new Set([
  "Pregnancy or actively trying",
  "Currently breastfeeding",
]);

const MALE_ONLY_OTHER_GOAL_IDS = new Set(["mens_vitality"]);

/** Female-only cross-sell goals (extend when women-specific options are added). */
const FEMALE_ONLY_OTHER_GOAL_IDS = new Set<string>([]);

export function isQuizGenderSet(gender: string): gender is "male" | "female" {
  return gender === "male" || gender === "female";
}

export function filterMetabolicConditionsForGender(
  options: readonly string[],
  gender: QuizGender
): string[] {
  if (!isQuizGenderSet(gender)) return [...options];
  if (gender === "male") {
    return options.filter((o) => !FEMALE_ONLY_METABOLIC.has(o));
  }
  return [...options];
}

export function filterSeriousConditionsForGender(
  options: readonly string[],
  gender: QuizGender
): string[] {
  if (!isQuizGenderSet(gender)) return [...options];
  if (gender === "male") {
    return options.filter((o) => !FEMALE_ONLY_SERIOUS.has(o));
  }
  return [...options];
}

export type OtherGoalOption = { id: string; label: string };

export function filterOtherGoalsForGender(
  options: readonly OtherGoalOption[],
  gender: QuizGender
): OtherGoalOption[] {
  if (!isQuizGenderSet(gender)) return [...options];
  return options.filter((o) => {
    if (gender === "male" && FEMALE_ONLY_OTHER_GOAL_IDS.has(o.id)) return false;
    if (gender === "female" && MALE_ONLY_OTHER_GOAL_IDS.has(o.id)) return false;
    return true;
  });
}

export function pruneGenderIncompatibleSelections(
  gender: QuizGender,
  selections: {
    metabolicConditions: string[];
    seriousConditions: string[];
    otherGoals: string[];
  }
): {
  metabolicConditions: string[];
  seriousConditions: string[];
  otherGoals: string[];
} {
  if (!isQuizGenderSet(gender)) return selections;

  const allowedMetabolic = new Set(
    filterMetabolicConditionsForGender(selections.metabolicConditions, gender)
  );
  const allowedSerious = new Set(
    filterSeriousConditionsForGender(selections.seriousConditions, gender)
  );
  const allowedGoalIds = new Set(
    filterOtherGoalsForGender(
      selections.otherGoals.map((id) => ({ id, label: id })),
      gender
    ).map((o) => o.id)
  );

  return {
    metabolicConditions: selections.metabolicConditions.filter((v) =>
      allowedMetabolic.has(v)
    ),
    seriousConditions: selections.seriousConditions.filter((v) =>
      allowedSerious.has(v)
    ),
    otherGoals: selections.otherGoals.filter((id) => allowedGoalIds.has(id)),
  };
}
