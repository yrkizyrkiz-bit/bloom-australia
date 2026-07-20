/** Map public biomarkers checkout source → clinical consult program type for booking hold/confirm. */
export function resolveConsultProgramType(
  sourceProgram?: string | null
): "HAIR_LOSS" | "WOMENS_HEALTH" | "MENS_HEALTH" | "BIOLOGICAL_CLOCK" {
  if (sourceProgram === "hair_loss") return "HAIR_LOSS";
  if (
    sourceProgram === "womens_health" ||
    sourceProgram === "womens_health_sexual" ||
    sourceProgram === "womens_health_vitality"
  ) {
    return "WOMENS_HEALTH";
  }
  if (sourceProgram === "mens_health") return "MENS_HEALTH";
  return "BIOLOGICAL_CLOCK";
}

export function consultRiskFlagsForSource(
  sourceProgram?: string | null
): string[] {
  const flags = ["BIOMARKERS_PANEL"];
  if (sourceProgram === "hair_loss") flags.push("HAIR_LOSS_PROGRAM");
  if (
    sourceProgram === "womens_health" ||
    sourceProgram === "womens_health_sexual" ||
    sourceProgram === "womens_health_vitality"
  ) {
    flags.push("WOMENS_HEALTH_PROGRAM");
  }
  if (sourceProgram === "mens_health") flags.push("MENS_HEALTH_PROGRAM");
  return flags;
}
