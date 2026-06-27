export type PortalQuizSubmissionView = {
  id: string;
  programKey: string;
  answers: Record<string, unknown>;
  result?: unknown;
  intent?: string | null;
  source?: string;
  submittedAt: string;
};
