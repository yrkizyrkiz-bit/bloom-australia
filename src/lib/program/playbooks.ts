import type { ProgramPlanTier } from "./plan-tier";
import type { ProgramTaskType } from "@prisma/client";

export type PlaybookConfig = {
  id: string;
  tier: ProgramPlanTier;
  /** Days of side-effect check-ins after start */
  sideEffectCheckDays: number;
  dailyTasks: ProgramTaskType[];
  sundayTasks: ProgramTaskType[];
  precisionOnlyTasks: ProgramTaskType[];
};

export const PLAYBOOKS: Record<string, PlaybookConfig> = {
  wm_core_v1: {
    id: "wm_core_v1",
    tier: "CORE",
    sideEffectCheckDays: 14,
    dailyTasks: ["WEIGH_IN", "MEAL_LOG", "EXERCISE"],
    sundayTasks: ["CHECK_IN"],
    precisionOnlyTasks: [],
  },
  wm_precision_v1: {
    id: "wm_precision_v1",
    tier: "PRECISION",
    sideEffectCheckDays: 21,
    dailyTasks: ["WEIGH_IN", "MEAL_LOG", "EXERCISE"],
    sundayTasks: ["CHECK_IN", "BIOMARKER_REVIEW"],
    precisionOnlyTasks: ["BIOMARKER_REVIEW"],
  },
};

export function getPlaybook(playbookId: string): PlaybookConfig {
  return PLAYBOOKS[playbookId] || PLAYBOOKS.wm_core_v1;
}
