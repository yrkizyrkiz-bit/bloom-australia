import { PROGRAM_SLUG } from "@/lib/billing/program-slugs";

/** Clinical subscription tiers that belong in In Triage (incl. legacy bare slugs). */
export const CLINICAL_PROGRAM_TIERS = [
  ...Object.values(PROGRAM_SLUG),
  "mens_health",
  "womens_health",
];

export const TRIAGE_STATUS_GROUPS: Record<string, string[]> = {
  all: [
    "LEAD",
    "SURVEY_COMPLETED",
    "CONSULTATION_BOOKED",
    "CONSULTATION_PAID",
    "PRE_TRIAGE_PENDING",
    "PRE_TRIAGE_COMPLETE",
    "AWAITING_DOCTOR_DECISION",
    "APPROVED_PENDING_TESTS",
    "DECLINED",
  ],
  pre_payment: ["LEAD", "SURVEY_COMPLETED", "CONSULTATION_BOOKED"],
  CONSULTATION_PAID: ["CONSULTATION_PAID"],
  PRE_TRIAGE_PENDING: ["PRE_TRIAGE_PENDING"],
  AWAITING_DOCTOR_DECISION: ["AWAITING_DOCTOR_DECISION", "PRE_TRIAGE_COMPLETE"],
  APPROVED_PENDING_TESTS: ["APPROVED_PENDING_TESTS"],
  DECLINED: ["DECLINED"],
};

export const AWAITING_DOCTOR_JOURNEY_STATUSES = [
  "AWAITING_DOCTOR_DECISION",
  "PRE_TRIAGE_COMPLETE",
] as const;

/**
 * Queue filter for /api/admin/triage.
 *
 * In Triage stays clinical-program only. Awaiting Doctor also includes
 * membership / portal Pre-Triage handoffs (subscriptionTier "membership")
 * once a doctor is assigned — otherwise those consults vanish after save.
 */
export function triageQueueWhere(status: string): Record<string, unknown> {
  const journeyStatuses = TRIAGE_STATUS_GROUPS[status] || [status];
  const journeyStatus = { in: journeyStatuses };

  if (status === "AWAITING_DOCTOR_DECISION") {
    return { journeyStatus };
  }

  return {
    subscriptionTier: { in: CLINICAL_PROGRAM_TIERS },
    journeyStatus,
  };
}

/** Header badge counts: In Triage stays clinical; Awaiting Doctor includes membership handoffs. */
export function triageStatsWhere(): Record<string, unknown> {
  return {
    OR: [
      {
        subscriptionTier: { in: CLINICAL_PROGRAM_TIERS },
        journeyStatus: {
          in: [
            "PRE_TRIAGE_PENDING",
            "AWAITING_DOCTOR_DECISION",
            "PRE_TRIAGE_COMPLETE",
            "APPROVED_PENDING_TESTS",
            "DECLINED",
          ],
        },
      },
      {
        journeyStatus: { in: [...AWAITING_DOCTOR_JOURNEY_STATUSES] },
      },
    ],
  };
}
