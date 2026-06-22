import type { ProgramKey } from "@/lib/membership/keys";

export type ProgramJourneyTheme = {
  headerGradient: string;
  accentText: string;
  mutedText: string;
  statusBorder: string;
  statusBackground: string;
  iconBackground: string;
  iconColor: string;
  currentRing: string;
  completeBackground: string;
  completeText: string;
};

export type ProgramJourneyConfig = {
  programKey: ProgramKey;
  programLabel: string;
  prepTitle: string;
  prepItems: string[];
  theme: ProgramJourneyTheme;
};

export const PROGRAM_JOURNEY_CONFIG: Partial<Record<ProgramKey, ProgramJourneyConfig>> = {
  WEIGHT_MANAGEMENT: {
    programKey: "WEIGHT_MANAGEMENT",
    programLabel: "Weight Management",
    prepTitle: "Prepare for your doctor call",
    prepItems: [
      "Find a quiet place with good phone reception",
      "Have your ID and Medicare details nearby",
      "List any medications and supplements you take",
      "Note questions you want to ask your doctor",
    ],
    theme: {
      headerGradient: "from-emerald-800 via-emerald-700 to-teal-600",
      accentText: "text-emerald-200",
      mutedText: "text-emerald-100",
      statusBorder: "border-emerald-200",
      statusBackground: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
      iconBackground: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600",
      currentRing: "ring-emerald-200",
      completeBackground: "bg-emerald-100 text-emerald-600",
      completeText: "text-emerald-900 dark:text-emerald-100",
    },
  },
  HAIR_LOSS: {
    programKey: "HAIR_LOSS",
    programLabel: "Hair Restoration",
    prepTitle: "Prepare for your hair assessment",
    prepItems: [
      "Find a quiet place with good phone reception",
      "Have photos of your hair loss pattern ready if asked",
      "List any medications or supplements you currently take",
      "Note how long you have noticed changes and any family history",
    ],
    theme: {
      headerGradient: "from-violet-900 via-purple-900 to-slate-900",
      accentText: "text-violet-300",
      mutedText: "text-violet-200",
      statusBorder: "border-violet-200",
      statusBackground: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
      iconBackground: "bg-violet-100 dark:bg-violet-900/50",
      iconColor: "text-violet-600",
      currentRing: "ring-violet-200",
      completeBackground: "bg-violet-100 text-violet-600",
      completeText: "text-violet-900 dark:text-violet-100",
    },
  },
};

export function getProgramJourneyConfig(programKey: ProgramKey): ProgramJourneyConfig {
  return (
    PROGRAM_JOURNEY_CONFIG[programKey] ?? {
      programKey,
      programLabel: "Your Program",
      prepTitle: "Prepare for your doctor call",
      prepItems: [
        "Find a quiet place with good phone reception",
        "Have your ID and Medicare details nearby",
        "List any medications and supplements you take",
      ],
      theme: {
        headerGradient: "from-slate-800 via-slate-700 to-teal-800",
        accentText: "text-teal-300",
        mutedText: "text-slate-200",
        statusBorder: "border-slate-200",
        statusBackground: "from-slate-50 to-teal-50 dark:from-slate-950/20 dark:to-teal-950/20",
        iconBackground: "bg-teal-100 dark:bg-teal-900/50",
        iconColor: "text-teal-600",
        currentRing: "ring-teal-200",
        completeBackground: "bg-teal-100 text-teal-600",
        completeText: "text-slate-900 dark:text-slate-100",
      },
    }
  );
}
