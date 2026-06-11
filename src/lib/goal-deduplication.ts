/**
 * Goal statuses that prevent creating another goal for the same biomarker.
 * Must match values in prisma `GoalStatus` enum (IN_PROGRESS | ACHIEVED | MISSED | CANCELLED).
 */
export const BLOCKING_GOAL_STATUSES = ["IN_PROGRESS"] as const;

/** UI "paused" goals are stored as CANCELLED in the database. */
export const PAUSED_GOAL_STATUS = "CANCELLED" as const;

export type BlockingGoalStatus = (typeof BLOCKING_GOAL_STATUSES)[number];

export interface GoalLike {
  biomarkerId: string;
  status: string;
  notes?: string | null;
  biomarker?: {
    name?: string;
    shortName?: string;
  } | null;
}

export function isBlockingGoalStatus(status: string): boolean {
  return BLOCKING_GOAL_STATUSES.includes(
    status.toUpperCase() as BlockingGoalStatus
  );
}

export function findBlockingGoalForBiomarker<T extends GoalLike>(
  goals: T[],
  biomarkerId: string
): T | undefined {
  return goals.find(
    g => g.biomarkerId === biomarkerId && isBlockingGoalStatus(g.status)
  );
}

export function hasBlockingGoalForBiomarker(
  goals: GoalLike[],
  biomarkerId: string
): boolean {
  return !!findBlockingGoalForBiomarker(goals, biomarkerId);
}

export function getBlockingBiomarkerIds(goals: GoalLike[]): Set<string> {
  return new Set(
    goals.filter(g => isBlockingGoalStatus(g.status)).map(g => g.biomarkerId)
  );
}

export function duplicateGoalMessage(
  biomarkerId: string,
  existing?: GoalLike
): string {
  const name =
    existing?.biomarker?.name ||
    existing?.biomarker?.shortName ||
    biomarkerId.replace(/_/g, " ");

  const statusLabel =
    existing?.status?.toUpperCase() === PAUSED_GOAL_STATUS ? "paused" : "active";

  return `You already have an ${statusLabel} goal for ${name}. Edit or delete the existing goal before adding another.`;
}
