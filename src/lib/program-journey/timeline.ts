import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Phone,
  Beaker,
  FileText,
  Package,
  Truck,
  Sparkles,
} from "lucide-react";

export type JourneyTimelineStep = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const DEFAULT_JOURNEY_STEPS: JourneyTimelineStep[] = [
  {
    key: "payment",
    label: "Payment received",
    description: "Your program payment has been received",
    icon: CheckCircle2,
  },
  {
    key: "consultation",
    label: "Doctor assessment",
    description: "Your doctor will call at your scheduled time",
    icon: Phone,
  },
  {
    key: "pending_tests",
    label: "Blood test and biomarkers reviewed",
    description: "Any ordered tests support your ongoing care",
    icon: Beaker,
  },
  {
    key: "results",
    label: "Results reviewed",
    description: "Your doctor reviews your health markers",
    icon: FileText,
  },
  {
    key: "approved",
    label: "Program approved",
    description: "Your care team is preparing your treatment plan",
    icon: CheckCircle2,
  },
  {
    key: "script",
    label: "Treatment being prepared",
    description: "Your prescription is being prepared",
    icon: Package,
  },
  {
    key: "shipped",
    label: "Treatment shipped",
    description: "Your treatment is on its way",
    icon: Truck,
  },
  {
    key: "active",
    label: "Program active",
    description: "Track progress in your program dashboard",
    icon: Sparkles,
  },
];

const STATUS_TO_STEP: Record<string, number> = {
  CONSULTATION_PAID: 0,
  PRE_TRIAGE_PENDING: 0,
  PRE_TRIAGE_COMPLETE: 1,
  AWAITING_DOCTOR_CALL: 1,
  CONSULT_COMPLETED: 1,
  AWAITING_DOCTOR_DECISION: 1,
  APPROVED_PENDING_TESTS: 4,
  TESTS_ORDERED: 4,
  AWAITING_TESTS: 4,
  RESULTS_RECEIVED: 4,
  FINAL_DOCTOR_REVIEW: 4,
  APPROVED: 4,
  NO_TREATMENT: 4,
  SCRIPT_DRAFT: 5,
  SCRIPT_WRITTEN: 5,
  SCRIPT_SENT_TO_PHARMACY: 5,
  PHARMACY_PENDING: 5,
  DISPENSING: 5,
  SHIPPED: 6,
  DELIVERED: 7,
  ONBOARDING_PENDING: 7,
  ONBOARDING_COMPLETE: 7,
  ACTIVE: 7,
};

export function getTimelineProgress(
  journeyStatus: string,
  options?: { includeMonitoringSteps?: boolean }
): { currentStep: number; steps: JourneyTimelineStep[] } {
  const currentStep = STATUS_TO_STEP[journeyStatus] ?? 0;
  const steps =
    options?.includeMonitoringSteps === false
      ? DEFAULT_JOURNEY_STEPS.filter(
          (step) => step.key !== "pending_tests" && step.key !== "results"
        )
      : DEFAULT_JOURNEY_STEPS;

  return { currentStep, steps };
}

export function getConsultationCountdown(scheduledAt: string): string | null {
  const target = new Date(scheduledAt).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}, ${hours} hr`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins} min`;
}
