export const SEXUAL_HEALTH_MED_KEYWORDS = [
  "sildenafil",
  "tadalafil",
  "vardenafil",
  "avanafil",
  "dapoxetine",
  "viagra",
  "cialis",
  "levitra",
  "spedra",
  "priligy",
  "ed ",
  "erectile",
  "premature ejaculation",
  "sexual health",
];

export const SCRIPT_STATUS_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  SCRIPT_DRAFT: {
    label: "Script being prepared",
    description: "Your doctor is preparing your prescription",
  },
  SCRIPT_WRITTEN: {
    label: "Script written",
    description: "Your prescription has been written",
  },
  SCRIPT_SENT_TO_PHARMACY: {
    label: "Sent to pharmacy",
    description: "Your prescription has been sent to the pharmacy",
  },
  PHARMACY_PENDING: {
    label: "At pharmacy",
    description: "Pharmacy is preparing your treatment",
  },
  DISPENSING: {
    label: "Being dispensed",
    description: "Your treatment is being dispensed",
  },
  SHIPPED: {
    label: "Shipped",
    description: "Your treatment is on its way",
  },
  DELIVERED: {
    label: "Delivered",
    description: "Your treatment has been delivered",
  },
};

export function isSexualHealthMedication(
  name?: string | null,
  diagnosis?: string | null,
  notes?: string | null
): boolean {
  const haystack = `${name || ""} ${diagnosis || ""} ${notes || ""}`.toLowerCase();
  return SEXUAL_HEALTH_MED_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function scriptStatusInfo(scriptStatus: string) {
  return (
    SCRIPT_STATUS_DESCRIPTIONS[scriptStatus] || {
      label: scriptStatus.replace(/_/g, " "),
      description: "We will update you as your prescription progresses.",
    }
  );
}

export type UseEffectiveness = "excellent" | "good" | "limited" | "none";

export function parseUseLogNotes(notes?: string | null): {
  effectiveness?: UseEffectiveness;
  detail?: string;
} {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes) as { effectiveness?: UseEffectiveness; detail?: string };
    return parsed;
  } catch {
    return { detail: notes };
  }
}

export function formatUseLogNotes(input: {
  effectiveness: UseEffectiveness;
  detail?: string;
  sideEffects?: string[];
}): string {
  return JSON.stringify({
    effectiveness: input.effectiveness,
    detail: input.detail || undefined,
    sideEffects: input.sideEffects?.length ? input.sideEffects : undefined,
  });
}
