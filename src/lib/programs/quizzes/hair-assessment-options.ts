export type HairOptionSex = "all" | "male" | "female";

export type HairGenderedOption = {
  id?: string;
  label: string;
  description?: string;
  gender?: HairOptionSex;
};

export const HAIR_MALE_STAGES: HairGenderedOption[] = [
  { id: "not-sure", label: "I'm not sure yet", description: "That's okay, we'll help figure it out" },
  { id: "stage-1", label: "Early signs", description: "Hairline starting to shift slightly" },
  { id: "stage-2", label: "Noticeable recession", description: "Temples becoming more visible" },
  { id: "stage-3", label: "Moderate recession", description: "Clear M-shaped hairline forming" },
  { id: "stage-4", label: "Crown thinning", description: "Top of head showing through" },
  { id: "stage-5", label: "Advanced thinning", description: "Front and crown areas connecting" },
  { id: "stage-6", label: "Extensive loss", description: "Hair mainly on sides and back" },
];

export const HAIR_FEMALE_STAGES: HairGenderedOption[] = [
  { id: "not-sure", label: "I'm not sure yet", description: "We'll help you identify it" },
  { id: "type-1", label: "Early thinning", description: "Part line slightly wider than before" },
  { id: "type-2", label: "Noticeable thinning", description: "Scalp visible through hair" },
  { id: "type-3", label: "Significant thinning", description: "Widespread visibility on crown" },
];

export const HAIR_MEDICAL_CONDITIONS: HairGenderedOption[] = [
  { label: "Blood pressure concerns" },
  { label: "Dizziness or lightheadedness" },
  { label: "Heart rhythm issues" },
  { label: "Thyroid condition" },
  { label: "PCOS", gender: "female" },
  { label: "Heavy or irregular periods", gender: "female" },
  { label: "Menopause or perimenopause symptoms", gender: "female" },
  { label: "Prostate concerns or PSA monitoring", gender: "male" },
  { label: "Taking testosterone or anabolic steroids", gender: "male" },
  { label: "Autoimmune condition" },
  { label: "None of these apply to me" },
];

export const HAIR_OTHER_CONCERNS: HairGenderedOption[] = [
  { id: "weight", label: "Weight management", gender: "all" },
  { id: "hormones", label: "Hormone optimisation", gender: "all" },
  { id: "womens-hormones", label: "Periods, PCOS or menopause support", gender: "female" },
  { id: "mens-health", label: "Men's sexual health", gender: "male" },
  { id: "sleep", label: "Sleep quality", gender: "all" },
  { id: "none", label: "Just hair health for now", gender: "all" },
];

export function resolveHairQuizSex(
  gender?: string | null,
  answers?: Record<string, unknown>
): "male" | "female" | "" {
  const fromAnswers = answers?.gender;
  const raw =
    typeof fromAnswers === "string" && fromAnswers.trim() ? fromAnswers : gender || "";
  const value = raw.toLowerCase();
  if (value === "male" || value === "female") return value;
  return "";
}

export function hairOptionsForSex<T extends { gender?: HairOptionSex }>(
  options: T[],
  sex: string | null | undefined
): T[] {
  const resolved = (sex || "").toLowerCase();
  if (resolved !== "male" && resolved !== "female") {
    return options.filter((option) => !option.gender || option.gender === "all");
  }
  return options.filter(
    (option) => !option.gender || option.gender === "all" || option.gender === resolved
  );
}
