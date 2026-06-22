import { STAGE_DESCRIPTIONS } from "@/lib/portal-context";

const CONSULTATION_STAGES = new Set([
  "AWAITING_DOCTOR_CALL",
  "CONSULT_COMPLETED",
  "AWAITING_DOCTOR_DECISION",
]);

const APPROVED_STAGES = new Set([
  "APPROVED",
  "APPROVED_PENDING_TESTS",
  "TESTS_ORDERED",
  "AWAITING_TESTS",
  "RESULTS_RECEIVED",
  "FINAL_DOCTOR_REVIEW",
]);

export function getJourneyStageMeta(journeyStatus: string): {
  stageDescription: string;
  stage: string;
  isApproved: boolean;
} {
  const description = STAGE_DESCRIPTIONS[journeyStatus] || "We're preparing your program";
  let stage = "pre-consultation";

  if (CONSULTATION_STAGES.has(journeyStatus)) stage = "consultation";
  else if (journeyStatus.includes("TEST") || journeyStatus === "RESULTS_RECEIVED") {
    stage = "pending_tests";
  } else if (APPROVED_STAGES.has(journeyStatus)) stage = "approved";
  else if (
    journeyStatus.startsWith("SCRIPT") ||
    ["PHARMACY_PENDING", "DISPENSING"].includes(journeyStatus)
  ) {
    stage = "treatment-prep";
  }

  return {
    stageDescription: description,
    stage,
    isApproved: APPROVED_STAGES.has(journeyStatus),
  };
}
